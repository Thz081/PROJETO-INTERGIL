const mongoose = require('mongoose');
const Inscricao = require('../models/inscricao.model');
const Aluno = require('../models/aluno.model');
const Modalidade = require('../models/modalidade.model');
const { randomUUID } = require('node:crypto');
const { Controle } = require('../edicao/iniciar');
const { fim, ficha, validar, recusar, chaveTurma } = require('../edicao/regras');

async function buscarAluno(id, session = null) {
  const aluno = await Aluno.findOne({ _id: id, ativo: { $ne: false } }).session(session).lean();
  if (!aluno || !aluno.turma) recusar('Matrícula sem turma ativa. Procure a gestão.');
  return aluno;
}
async function contagem(turma, session = null) {
  const docs = await Inscricao.find({ turmaOrigem: turma }).select('modalidades').session(session).lean();
  const vagas = {};
  for (const doc of docs) {
    for (const codigo of doc.modalidades) {
      vagas[codigo] = (vagas[codigo] || 0) + 1;
    }
  }
  return vagas;
}
function rota(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'Você já tem uma inscrição.' });
      if (!err.status) console.error('Erro na inscrição:', err.message);
      res.status(err.status || 500).json({ message: err.status ? err.message : 'Erro ao processar inscrição.' });
    }
  };
}
async function alterar(turma, fn) {
  return mongoose.connection.transaction(async session => {
    if (Date.now() >= Date.parse(fim)) recusar('O prazo de inscrição terminou.');
    // A escrita comum serializa a disputa de vagas, inclusive entre processos.
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 }, $set: { aviso: [randomUUID(), turma].join('|') } }, { session });
    return fn(session);
  });
}
const criarInscricao = rota(async (req, res) => {
  if (Object.hasOwn(req.body || {}, 'visitante')) recusar('Inscrições são feitas pela sua turma.');
  const aluno = await buscarAluno(req.user.id);
  const origem = chaveTurma(aluno.turma);
  const inscricao = await alterar(origem, async session => {
    const atual = await buscarAluno(req.user.id, session);
    if (chaveTurma(atual.turma) !== origem) recusar('Sua turma mudou. Recarregue a inscrição.');
    if (await Inscricao.exists({ aluno: aluno._id }).session(session)) recusar('Você já realizou sua inscrição.');
    const mods = await Modalidade.find().session(session).lean();
    const { escolhas, total } = validar(ficha(mods, atual), req.body?.modalidades);
    const ocupadas = await contagem(origem, session);
    for (const op of escolhas) {
      if (op.limite != null && (ocupadas[op.codigo] || 0) >= op.limite)
        recusar(`As vagas de ${op.slug} (${op.nome}) acabaram. Atualize suas escolhas.`);
    }
    const [registro] = await Inscricao.create([{ aluno: aluno._id, modalidades: req.body.modalidades,
      pontuacaoTotal: total, turmaOrigem: origem }], { session });
    await Aluno.updateOne({ _id: aluno._id }, { $set: { inscricoes: [registro.id] } }, { session });
    return registro;
  });
  res.status(201).json({ inscricao });
});
const deleteMinhaInscricao = rota(async (req, res) => {
  const registro = await Inscricao.findOne({ aluno: req.user.id }).lean();
  if (!registro) return res.status(404).json({ message: 'Inscrição não encontrada.' });
  await alterar(registro.turmaOrigem, async session => {
    const resultado = await Inscricao.deleteOne({ _id: registro._id }, { session });
    if (!resultado.deletedCount) recusar('Inscrição não encontrada.');
    await Aluno.updateOne({ _id: req.user.id }, { $pull: { inscricoes: String(registro._id) } }, { session });
  });
  res.json({ message: 'Inscrição cancelada.' });
});
const getMinhaInscricao = rota(async (req, res) => {
  const registro = await Inscricao.findOne({ aluno: req.user.id });
  if (!registro) return res.status(404).json({ message: 'Você ainda não realizou sua inscrição.' });
  res.json(registro);
});
const getOpcoes = rota(async (req, res) => {
  const aluno = await buscarAluno(req.user.id);
  const mods = await Modalidade.find().sort({ _id: 1 }).lean();
  res.json({ ...ficha(mods, aluno), turma: chaveTurma(aluno.turma) });
});
const getContagemTurma = rota(async (req, res) => {
  const aluno = await buscarAluno(req.user.id);
  res.json(await contagem(chaveTurma(aluno.turma)));
});
module.exports = { criarInscricao, getMinhaInscricao, deleteMinhaInscricao, getContagemTurma, getOpcoes };
