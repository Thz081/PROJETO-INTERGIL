const { readFileSync } = require('node:fs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Aluno = require('../models/aluno.model');
const Modalidade = require('../models/modalidade.model');
const Monitor = require('../models/monitor.model');

function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}

async function vincular() {
  const aplicar = process.argv.includes('--aplicar');
  const fichas = JSON.parse(readFileSync(0, 'utf8'));
  if (!Array.isArray(fichas) || !fichas.length) throw new Error('Informe uma lista de atribuições em JSON.');
  const matriculas = new Set();
  const slugs = new Set();
  for (const { matricula, nome, turma, modalidades } of fichas) {
    if (typeof matricula !== 'string' || !/^\d+$/.test(matricula) || matriculas.has(matricula) ||
        typeof nome !== 'string' || !nome.trim() || typeof turma !== 'string' || !turma.trim() ||
        !Array.isArray(modalidades) || modalidades.length < 1 || modalidades.length > 3 ||
        new Set(modalidades.map(item => item.slug)).size !== modalidades.length)
      throw new Error('Informe matrícula única, nome, turma e uma a três modalidades distintas por aluno.');
    matriculas.add(matricula);
    for (const { slug, formatos } of modalidades) {
      if (typeof slug !== 'string' || !slug.trim() || (formatos !== undefined && (
          !Array.isArray(formatos) || !formatos.length || new Set(formatos).size !== formatos.length)))
        throw new Error('Confira os slugs e os formatos da atribuição.');
      slugs.add(slug);
    }
  }

  await connectDB({ dbName: 'intergil2026' });
  const [alunos, catalogo] = await Promise.all([
    Aluno.find({ n_inscricao: { $in: [...matriculas] }, ativo: { $ne: false } }).select('nome n_inscricao turma').lean(),
    Modalidade.find({ slug: { $in: [...slugs] } }).select('slug submodalidades.nome').lean()
  ]);
  const porMatricula = new Map(alunos.map(aluno => [aluno.n_inscricao, aluno]));
  const porSlug = new Map(catalogo.map(modalidade => [modalidade.slug, modalidade]));
  const operacoes = fichas.map((ficha, i) => {
    const aluno = porMatricula.get(ficha.matricula);
    if (!aluno?.turma || normalizar(aluno.nome) !== normalizar(ficha.nome) || normalizar(aluno.turma) !== normalizar(ficha.turma))
      throw new Error(`Registro ${i + 1}: a matrícula, o nome e a turma precisam identificar o mesmo aluno ativo.`);

    const modalidadesIds = [];
    const restricoesFormato = [];
    for (const { slug, formatos } of ficha.modalidades) {
      const modalidade = porSlug.get(slug);
      if (!modalidade || formatos?.some(nome => !modalidade.submodalidades.some(opcao => opcao.nome === nome)))
        throw new Error(`Registro ${i + 1}: confira os formatos cadastrados para ${slug}.`);
      modalidadesIds.push(modalidade._id);
      if (formatos) restricoesFormato.push({ modalidadeId: modalidade._id, formatos });
    }

    return { updateOne: {
      filter: { matricula: aluno.n_inscricao },
      update: { $set: { nome: aluno.nome, alunoId: aluno._id, modalidadesIds, restricoesFormato, role: 'monitor' },
        $unset: { senha: 1, modalidadeId: 1 } },
      upsert: true
    } };
  });
  if (aplicar) {
    await Monitor.init();
    await mongoose.connection.transaction(session => Monitor.bulkWrite(operacoes, { session }));
  }
  console.log(`${operacoes.length} vínculos ${aplicar ? 'aplicados' : 'validados'}.`);
}

vincular().catch(erro => { console.error(erro.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
