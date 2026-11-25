const mongoose = require('mongoose');
const Modalidade = require('../models/modalidade.model');
const Sala = require('../models/sala.model');
const Inscricao = require('../models/inscricao.model');
const Aluno = require('../models/aluno.model');
const Hall = require('../models/hall.model');
const historico = require('./historico.json');
const { modalidades, salas } = require('./catalogo');
const horarios = require('./horarios');
const Controle = mongoose.model('ControleEdicao', new mongoose.Schema({
  _id: String, versao: Number, aviso: String
}));
async function iniciar() {
  await Promise.all([Controle.init(), Modalidade.init(), Inscricao.init(), Sala.init(), Hall.init(), Aluno.init()]);
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
}
module.exports = { Controle, iniciar };
