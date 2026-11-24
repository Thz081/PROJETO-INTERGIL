const mongoose = require('mongoose');
const Inscricao = require('../models/inscricao.model');
const Aluno = require('../models/aluno.model');
const Modalidade = require('../models/modalidade.model');
const Sala = require('../models/sala.model');
const { Controle } = require('../edicao/iniciar');
const { fim, ficha, validar, recusar, chaveTurma } = require('../edicao/regras');

async function buscarAluno(id, session = null) {
  const aluno = await Aluno.findOne({ _id: id, ativo: { $ne: false } }).session(session).lean();
  if (!aluno || !aluno.turma) recusar('Matrícula sem turma ativa. Procure a gestão.');
  return aluno;
}
async function contagem(turma, session = null) {
  const docs = await Inscricao.find({ $or: [{ turmaOrigem: turma }, { 'visitante.turma': turma }] })
    .select('modalidades turmaOrigem visitante').session(session).lean();
  const vagas = {};
  for (const doc of docs) {
    for (const codigo of doc.modalidades) {
      const destino = doc.visitante?.codigos?.includes(codigo) ? doc.visitante.turma : doc.turmaOrigem;
      if (destino === turma) vagas[codigo] = (vagas[codigo] || 0) + 1;
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
async function alterar(turmas, fn) {
  return mongoose.connection.transaction(async session => {
    if (Date.now() >= Date.parse(fim)) recusar('O prazo de inscrição terminou.');
    // A escrita comum serializa a disputa de vagas, inclusive entre processos.
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 }, $set: { aviso: [require('node:crypto').randomUUID(), ...turmas].join('|') } }, { session });
    return fn(session);
  });
}
const criarInscricao = rota(async (req, res) => {
  const aluno = await buscarAluno(req.user.id);
  const origem = chaveTurma(aluno.turma);
  const pedido = req.body.visitante;
  const destino = pedido ? chaveTurma(pedido.turma) : null;
  const inscricao = await alterar(destino ? [origem, destino] : [origem], async session => {
    const atual = await buscarAluno(req.user.id, session);
    if (chaveTurma(atual.turma) !== origem) recusar('Sua turma mudou. Recarregue a inscrição.');
    if (await Inscricao.exists({ aluno: aluno._id }).session(session)) recusar('Você já realizou sua inscrição.');
    const mods = await Modalidade.find().session(session).lean();
    const { escolhas, total } = validar(ficha(mods, atual), req.body.modalidades);
    let visitante;
    if (pedido) {
      const salas = await Sala.find().session(session).lean();
      const naOutraSala = escolhas.filter(op => op.slug === pedido.slug);
      if (new Set(naOutraSala.map(op => op.grupo)).size > 1) recusar('Apenas uma modalidade por outra sala.');
      const codigos = naOutraSala.map(op => op.codigo);
      if (!codigos.length || !salas.some(s => chaveTurma(s.turma) === destino) || destino === origem || pedido.semTime !== true)
        recusar('Confira a modalidade, a sala de destino e a declaração de ausência de time.');
      if (await Inscricao.countDocuments({ 'visitante.turma': destino }).session(session) >= 2)
        recusar('A sala de destino já tem dois participantes de fora.');
      visitante = { turma: destino, slug: pedido.slug, codigos };
    }
    const ocupadas = await contagem(origem, session);
    const externas = visitante ? await contagem(destino, session) : {};
    for (const op of escolhas) {
      const usadas = visitante?.slug === op.slug ? externas : ocupadas;
      if (op.limite != null && (usadas[op.codigo] || 0) >= op.limite)
        recusar(`As vagas de ${op.slug} (${op.nome}) acabaram. Atualize suas escolhas.`);
    }
    const [registro] = await Inscricao.create([{ aluno: aluno._id, modalidades: req.body.modalidades,
      pontuacaoTotal: total, turmaOrigem: origem, visitante }], { session });
    await Aluno.updateOne({ _id: aluno._id }, { $set: { inscricoes: [registro.id] } }, { session });
    return registro;
  });
  res.status(201).json({ inscricao });
});
const deleteMinhaInscricao = rota(async (req, res) => {
  const registro = await Inscricao.findOne({ aluno: req.user.id }).lean();
  if (!registro) return res.status(404).json({ message: 'Inscrição não encontrada.' });
  const turmas = [registro.turmaOrigem, registro.visitante?.turma].filter(Boolean);
  await alterar(turmas, async session => {
    await Inscricao.deleteOne({ _id: registro._id }, { session });
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
  const salas = await Sala.find().sort({ turma: 1 }).lean();
  res.json({ ...ficha(mods, aluno), turma: chaveTurma(aluno.turma),
    salas: salas.map(s => ({ turma: chaveTurma(s.turma), nome: s.nome })) });
});
const getContagemTurma = rota(async (req, res) => {
  const aluno = await buscarAluno(req.user.id);
  res.json(await contagem(chaveTurma(req.query.turma || aluno.turma)));
});
module.exports = { criarInscricao, getMinhaInscricao, deleteMinhaInscricao, getContagemTurma, getOpcoes };
