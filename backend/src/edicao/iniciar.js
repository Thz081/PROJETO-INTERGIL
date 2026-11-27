const mongoose = require('mongoose');
const Modalidade = require('../models/modalidade.model');
const Sala = require('../models/sala.model');
const Inscricao = require('../models/inscricao.model');
const Aluno = require('../models/aluno.model');
const Hall = require('../models/hall.model');
const Podio = require('../models/podio.model');
const historico = require('./historico.json');
const { modalidades, salas, freeFireMapaAberto } = require('./catalogo');
const { movimentosIniciais } = require('./pontuacao');
const { chaveTurma } = require('./regras');
const horarios = require('./horarios');
const Controle = mongoose.model('ControleEdicao', new mongoose.Schema({
  _id: String, versao: Number, aviso: String
}));
async function iniciar() {
  await Promise.all([Controle.init(), Modalidade.init(), Inscricao.init(), Sala.init(), Hall.init(), Aluno.init(), Podio.init()]);
  await Controle.updateOne({ _id: 'vagas' }, { $setOnInsert: { versao: 0 } }, { upsert: true });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'inscricao-turma-2026' }).session(session)) return;
    await Inscricao.collection.updateMany({ visitante: { $exists: true } }, { $unset: { visitante: 1 } }, { session });
    await Controle.create([{ _id: 'inscricao-turma-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'catalogo-2026' }).session(session)) return;
    for (const m of modalidades) {
      await Modalidade.create([{ ...m, horarios: horarios[m.slug] || [] }], { session });
    }
    await Sala.insertMany(salas, { session });
    await Controle.create([{ _id: 'catalogo-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'brasoes-2026' }).session(session)) return;
    for (const sala of salas) {
      await Sala.updateOne({ turma: sala.turma, logo_url: '/images/armoriar.png' },
        { $set: { nome: sala.nome, logo_url: sala.logo_url } }, { session });
    }
    await Controle.create([{ _id: 'brasoes-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'gravuras-2026' }).session(session)) return;
    for (const mod of modalidades) {
      await Modalidade.updateOne({ _id: mod._id, imgCarrossel: null, imgDetalhe: null },
        { $set: { imgCarrossel: mod.imgCarrossel, imgDetalhe: mod.imgDetalhe } }, { session });
    }
    await Controle.create([{ _id: 'gravuras-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'banners-2026' }).session(session)) return;
    for (const mod of modalidades) {
      await Modalidade.updateOne({ _id: mod._id, slug: mod.slug, imgDetalhe: { $in: [null, '', mod.imgCarrossel] } },
        { $set: { imgDetalhe: mod.imgDetalhe } }, { session });
    }
    await Controle.create([{ _id: 'banners-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'hall-alatares-2025' }).session(session)) return;
    await Hall.updateOne({ ano: 2025 }, { $setOnInsert: {
      ano: 2025, turma: 'ALATARES', logo_path: '/images/historia/alatares.webp',
      instagram: 'https://www.instagram.com/3bds.2023/'
    } }, { upsert: true, session });
    await Controle.create([{ _id: 'hall-alatares-2025' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'historico' }).session(session)) return;
    for (const entrada of historico) {
      await Hall.updateOne({ ano: entrada.ano }, { $setOnInsert: entrada }, { upsert: true, session });
    }
    await Controle.create([{ _id: 'historico' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'primeiro-acesso-2026' }).session(session)) return;
    await Aluno.updateMany({}, { $unset: { senhaHash: 1, email: 1 }, $inc: { versaoAcesso: 1 } }, { session });
    await Controle.create([{ _id: 'primeiro-acesso-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'pontuacao-inicial-2026' }).session(session)) return;
    const turmasOficiais = new Set(salas.map(sala => chaveTurma(sala.turma)));
    const cadastradas = await Sala.find().session(session);
    for (const sala of cadastradas) {
      const movimentos = turmasOficiais.has(chaveTurma(sala.turma))
        ? movimentosIniciais(sala)
        : sala.pontos ? [{ motivo: 'Saldo anterior ao registro de motivos', pontos: sala.pontos }] : [];
      sala.movimentosPontuacao = movimentos;
      sala.pontos = movimentos.reduce((total, item) => total + item.pontos, 0);
      await sala.save({ session });
    }
    await Controle.create([{ _id: 'pontuacao-inicial-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'free-fire-mapa-aberto-2026' }).session(session)) return;
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 } }, { session });
    await Modalidade.updateOne({ slug: 'free-fire', 'submodalidades.nome': { $nin: [freeFireMapaAberto.nome, 'Free Fire Mapa Aberto'] } },
      { $push: { submodalidades: freeFireMapaAberto }, $max: { maxEscolhas: 3 } }, { session });
    await Controle.create([{ _id: 'free-fire-mapa-aberto-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'futmesa-dois-formatos-2026' }).session(session)) return;
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 } }, { session });
    await Modalidade.updateOne({ slug: 'futmesa', 'submodalidades.1': { $exists: true } },
      { $max: { maxEscolhas: 2 } }, { session });
    await Controle.create([{ _id: 'futmesa-dois-formatos-2026' }], { session });
  });
  await mongoose.connection.transaction(async session => {
    if (await Controle.exists({ _id: 'atletismo-provas-independentes-2026' }).session(session)) return;
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 } }, { session });
    const corrida = await Modalidade.findOne({ slug: 'corrida' }).select('submodalidades').session(session).lean();
    if (corrida?.submodalidades?.length) {
      const codigos = corrida.submodalidades.map((_, indice) => `${corrida._id}-${indice}`);
      const registros = { $cond: [{ $isArray: '$modalidades' }, '$modalidades', []] };
      const provas = { $size: { $setIntersection: [registros, codigos] } };
      await Inscricao.collection.updateMany({ modalidades: { $in: codigos }, pontuacaoTotal: { $gte: 1 },
        $expr: { $gt: [provas, 1] } },
      [{ $set: { pontuacaoTotal: { $add: ['$pontuacaoTotal', { $subtract: [provas, 1] }] } } }], { session });
    }
    await Controle.create([{ _id: 'atletismo-provas-independentes-2026' }], { session });
  });
}
module.exports = { Controle, iniciar };
