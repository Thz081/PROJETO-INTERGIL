const mongoose = require('mongoose');
const crypto = require('node:crypto');
const Aluno = require('../models/aluno.model');
const Sala = require('../models/sala.model');
const Inscricao = require('../models/inscricao.model');
const { Controle } = require('../edicao/iniciar');
const { chaveTurma, recusar } = require('../edicao/regras');

const normal = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().toUpperCase().replace(/\s+/g, ' ');
function dataValida(valor) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return false;
  const [d,m,a] = valor.split('/').map(Number);
  const data = new Date(Date.UTC(a,m-1,d));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m-1 && data.getUTCDate() === d;
}
async function planejar(linhas, completa, session) {
  if (!Array.isArray(linhas) || !linhas.length || linhas.length > 5000) recusar('Envie de 1 a 5.000 alunos.');
  const salas = await Sala.find().session(session).lean();
  const turmas = new Map(salas.map(s => [chaveTurma(s.turma), s.turma]));
  const anteriores = await Aluno.find().sort({ _id: 1 }).session(session).lean();
  const inscritos = new Set((await Inscricao.distinct('aluno').session(session)).map(String));
  const porMatricula = new Map(anteriores.map(a => [a.n_inscricao, a]));
  const porNome = new Map();
  for (const aluno of anteriores) {
    const nome = normal(aluno.nome);
    if (!porNome.has(nome)) porNome.set(nome, []);
    porNome.get(nome).push(aluno);
  }
  const usados = new Set(), matriculas = new Set(), destinos = new Set();
  const operacoes = [], erros = [], previa = [];
  for (const [i, linha] of linhas.entries()) {
    const nome = String(linha.nome || '').trim();
    const matricula = String(linha.n_inscricao || '').trim();
    const nasc = String(linha.data_nascimento || '').trim();
    const sexo = normal(linha.sexo);
    const turma = turmas.get(chaveTurma(linha.turma));
    const ref = `${linha.origem || 'Linha ' + (i + 1)} · ${nome || 'sem nome'}`;
    if (!nome || !/^\d+$/.test(matricula) || !turma || matriculas.has(matricula)) {
      erros.push(ref + ' — confira nome, matrícula duplicada/inválida ou turma.'); continue;
    }
    matriculas.add(matricula); destinos.add(turma);
    let anterior = porMatricula.get(matricula);
    if (anterior && normal(anterior.nome) !== normal(nome)) {
      erros.push(ref + ' — o nome difere do cadastro desta matrícula.'); continue;
    }
    if (!anterior) {
      const candidatos = porNome.get(normal(nome)) || [];
      const exatos = candidatos.filter(a => a.data_nascimento === nasc && nasc);
      if (candidatos.length && exatos.length !== 1) {
        erros.push(ref + ' — confira a identidade do aluno com nome coincidente.'); continue;
      }
      anterior = exatos[0];
    }
    const data = nasc || anterior?.data_nascimento;
    const genero = sexo || anterior?.sexo;
    if (!dataValida(data) || !['M','F'].includes(genero)) {
      erros.push(ref + ' — informe nascimento válido e sexo M/F.'); continue;
    }
    if (anterior && usados.has(String(anterior._id))) { erros.push(ref + ' — aluno associado a duas linhas.'); continue; }
    if (anterior) usados.add(String(anterior._id));
    const mudou = anterior && chaveTurma(anterior.turma) !== chaveTurma(turma);
    if (mudou && inscritos.has(String(anterior._id))) { erros.push(ref + ' — já existe inscrição nesta edição.'); continue; }
    const aluno = { nome, n_inscricao: matricula, data_nascimento: data, sexo: genero, turma, ativo: true };
    previa.push({ nome, matricula, de: anterior?.turma, para: turma,
      acao: !anterior ? 'Novo' : mudou ? 'Transferir' : anterior.ativo === false ? 'Reativar' : 'Atualizar' });
    operacoes.push({ updateOne: { filter: anterior ? { _id: anterior._id } : { n_inscricao: matricula },
      update: { $set: aluno }, upsert: !anterior } });
  }
  if (completa && [...turmas.values()].some(t => !destinos.has(t))) erros.push('A atualização geral requer alunos de todas as turmas ativas.');
  const ausentes = completa ? anteriores.filter(a => a.ativo !== false && !usados.has(String(a._id))) : [];
  for (const a of ausentes) {
    if (inscritos.has(String(a._id))) erros.push(a.nome + ' — ausente na planilha e com inscrição ativa.');
    previa.push({ nome: a.nome, matricula: a.n_inscricao, de: a.turma, acao: 'Inativar' });
  }
  if (ausentes.length) operacoes.push({ updateMany: { filter: { _id: { $in: ausentes.map(a => a._id) } }, update: { $set: { ativo: false } } } });
  const versao = crypto.createHash('sha256').update(JSON.stringify([linhas, previa, operacoes])).digest('hex');
  return { previa, erros, versao, operacoes };
}
module.exports = async (req, res) => {
  try {
    const { linhas, completa, confirmar } = req.body;
    const resultado = await mongoose.connection.transaction(async session => {
      if (confirmar) await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 } }, { session });
      const p = await planejar(linhas, completa === true, session);
      if (confirmar) {
        if (p.erros.length || confirmar !== p.versao) recusar('Os dados mudaram ou têm pendências. Gere outra prévia.');
        await Aluno.bulkWrite(p.operacoes, { session });
      }
      return { previa: p.previa, erros: p.erros, versao: p.versao };
    });
    res.json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Não foi possível importar os alunos.' });
  }
};
