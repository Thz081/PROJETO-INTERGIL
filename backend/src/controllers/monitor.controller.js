const { unlink } = require('node:fs/promises');
const mongoose = require('mongoose');
const Modalidade = require('../models/modalidade.model');
const Monitor = require('../models/monitor.model');
const Aluno = require('../models/aluno.model');
const LogAcao = require('../models/logAcao.model');

function erro(status, message) {
  throw Object.assign(new Error(message), { status });
}

function rota(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (falha) {
      if (req.file && !req.arquivoPublicado) await unlink(req.file.path).catch(() => {});
      const status = falha.status || (falha.name === 'CastError' ? 400 : 500);
      if (status === 500) console.error('Falha na monitoria:', falha.message);
      res.status(status).json({ message: falha.status ? falha.message :
        status === 400 ? 'Confira o identificador informado.' : 'Não foi possível concluir a operação.' });
    }
  };
}

async function escopoMonitor(req, res, next) {
  const monitor = await Monitor.findById(req.user.id)
    .select('modalidadesIds modalidadeId restricoesFormato alunoId matricula').lean();
  if (!monitor) return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' });
  if (monitor.alunoId && (req.user.alunoId !== String(monitor.alunoId) || req.user.versaoAcesso == null ||
      !await Aluno.exists({ _id: monitor.alunoId, n_inscricao: monitor.matricula,
        versaoAcesso: req.user.versaoAcesso, ativo: { $ne: false }, senhaHash: { $type: 'string' } })))
    return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' });
  if (!monitor.alunoId && req.user.alunoId)
    return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' });
  let ids = monitor.modalidadesIds;
  if (!ids && monitor.modalidadeId) {
    const legado = await Modalidade.findOne(/^\d+$/.test(monitor.modalidadeId)
      ? { _id: Number(monitor.modalidadeId) } : { slug: monitor.modalidadeId }).select('_id').lean();
    ids = legado ? [legado._id] : [];
  }
  req.modalidadesMonitor = (ids || []).slice(0, 3);
  req.formatosMonitor = new Map((monitor.restricoesFormato || []).map(item => [item.modalidadeId, item.formatos]));
  next();
}

function autorizarFormato(req, id, formato) {
  const permitidos = req.formatosMonitor?.get(id);
  if (permitidos && !permitidos.includes(formato))
    erro(403, 'Este formato não está atribuído à sua monitoria.');
}

function limitarVisao(req, modalidade) {
  modalidade.submodalidades?.sort((a, b) => Number(!!b.isPrincipal) - Number(!!a.isPrincipal));
  const permitidos = req.formatosMonitor?.get(modalidade._id);
  if (!permitidos) return modalidade;
  const { linkEdital, linkChaveamento, ...visivel } = modalidade;
  visivel.permiteGeral = false;
  if (visivel.submodalidades) visivel.submodalidades = visivel.submodalidades.filter(opcao => permitidos.includes(opcao.nome));
  if (visivel.horarios) visivel.horarios = visivel.horarios.filter(item => permitidos.includes(item.categoria));
  return visivel;
}

function modalidadePermitida(req, valor) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) erro(400, 'Selecione uma modalidade.');
  if (req.user.role === 'monitor' && !req.modalidadesMonitor?.includes(id))
    erro(403, 'Esta modalidade não está atribuída à sua monitoria.');
  return id;
}

function registrar(req, acao) {
  const perfil = req.user.role === 'gestao' ? 'Gestão' : 'Monitoria';
  return LogAcao.create({ autor: `${perfil}: ${req.user.nome}`, acao });
}

function dadosHorario(body) {
  const campos = ['categoria', 'data', 'horario', 'local'];
  if (!campos.every(campo => typeof body[campo] === 'string' && body[campo].trim()))
    erro(400, 'Preencha o formato, a data, o horário e o local.');
  return Object.fromEntries(campos.map(campo => [campo, body[campo].trim()]));
}

const getHorarios = rota(async (req, res) => {
  const modalidades = await Modalidade.find({ _id: { $in: req.modalidadesMonitor } })
    .select('nome horarios submodalidades').sort('_id').lean();
  res.json(modalidades.map(modalidade => limitarVisao(req, modalidade)));
});

const addHorario = rota(async (req, res) => {
  const id = modalidadePermitida(req, req.body.modId);
  const dados = dadosHorario(req.body);
  autorizarFormato(req, id, dados.categoria);
  const modalidade = await Modalidade.findById(id).select('nome submodalidades').lean();
  if (!modalidade) erro(404, 'Modalidade não encontrada.');
  if (dados.categoria !== 'Geral' && !modalidade.submodalidades.some(opcao => opcao.nome === dados.categoria))
    erro(400, 'Selecione um formato dessa modalidade.');
  const horario = { _id: new mongoose.Types.ObjectId(), ...dados };
  const atualizado = await Modalidade.findByIdAndUpdate(id, { $push: { horarios: horario } },
    { new: true, runValidators: true });
  if (!atualizado) erro(404, 'Modalidade não encontrada.');
  await registrar(req, 'Adicionou horário de ' + atualizado.nome);
  res.status(201).json(limitarVisao(req, atualizado.toObject()));
});

const editarHorario = rota(async (req, res) => {
  const id = modalidadePermitida(req, req.params.modId);
  const dados = dadosHorario(req.body);
  autorizarFormato(req, id, dados.categoria);
  const modalidade = await Modalidade.findOne({ _id: id, 'horarios._id': req.params.horarioId })
    .select('nome submodalidades horarios').lean();
  if (!modalidade) erro(404, 'Horário não encontrado.');
  const anterior = modalidade.horarios.find(horario => String(horario._id) === req.params.horarioId);
  if (!anterior) erro(404, 'Horário não encontrado.');
  autorizarFormato(req, id, anterior.categoria);
  if (dados.categoria !== anterior.categoria && dados.categoria !== 'Geral' &&
      !modalidade.submodalidades.some(opcao => opcao.nome === dados.categoria))
    erro(400, 'Selecione um formato dessa modalidade.');
  const atualizado = await Modalidade.findOneAndUpdate({ _id: id,
    horarios: { $elemMatch: { _id: anterior._id, categoria: anterior.categoria } } },
    { $set: Object.fromEntries(Object.entries(dados).map(([campo, valor]) => ['horarios.$.' + campo, valor])) },
    { new: true, runValidators: true });
  if (!atualizado) erro(404, 'Horário não encontrado.');
  await registrar(req, 'Editou horário de ' + atualizado.nome);
  res.json(limitarVisao(req, atualizado.toObject()));
});

const deleteHorario = rota(async (req, res) => {
  const id = modalidadePermitida(req, req.params.modId);
  const horarioId = req.params.horarioId;
  const permitidos = req.formatosMonitor?.get(id);
  const horario = { _id: horarioId, ...(permitidos && { categoria: { $in: permitidos } }) };
  const modalidade = await Modalidade.findOneAndUpdate({ _id: id, horarios: { $elemMatch: horario } },
    { $pull: { horarios: { _id: horarioId } } });
  if (!modalidade) erro(404, 'Horário não encontrado.');
  await registrar(req, 'Apagou horário de ' + modalidade.nome);
  res.json({ message: 'Horário apagado.' });
});

const getModalidadesParaLinks = rota(async (req, res) => {
  const modalidades = await Modalidade.find({ _id: { $in: req.modalidadesMonitor } })
    .select('nome categoria linkEdital linkChaveamento submodalidades').sort('_id').lean();
  res.json(modalidades.map(modalidade => limitarVisao(req, modalidade)));
});

async function gravarLink(req, res, tipo, url) {
  const { modId, subNome = 'Geral' } = req.body;
  const id = modalidadePermitida(req, modId);
  if (!['edital', 'chaveamento'].includes(tipo)) erro(400, 'Escolha edital ou chaveamento.');
  if (typeof subNome !== 'string' || !subNome.trim()) erro(400, 'Escolha um formato.');
  autorizarFormato(req, id, subNome);
  const filtro = { _id: id };
  let campo = tipo === 'edital' ? 'linkEdital' : 'linkChaveamento';
  if (subNome !== 'Geral') {
    filtro['submodalidades.nome'] = subNome;
    campo = 'submodalidades.$.' + tipo;
  }
  const modalidade = await Modalidade.findOneAndUpdate(filtro, { $set: { [campo]: url } },
    { new: true, runValidators: true });
  if (!modalidade) erro(404, 'Modalidade ou formato não encontrado.');
  if (req.file) req.arquivoPublicado = true;
  await registrar(req, `Atualizou ${tipo} de ${modalidade.nome} · ${subNome}`);
  res.json({ modalidade: limitarVisao(req, modalidade.toObject()) });
}

const updateLink = rota(async (req, res) => {
  const valor = typeof req.body.url === 'string' ? req.body.url.trim() : '';
  if (!valor || valor === '#') return gravarLink(req, res, req.body.tipoLink, '#');
  let url;
  try { url = new URL(valor); }
  catch { erro(400, 'Informe um link HTTP ou HTTPS.'); }
  if (!['http:', 'https:'].includes(url.protocol)) erro(400, 'Informe um link HTTP ou HTTPS.');
  return gravarLink(req, res, req.body.tipoLink, url.href);
});

const uploadDocumento = tipo => rota(async (req, res) => {
  if (!req.file) erro(400, 'Selecione um PDF.');
  return gravarLink(req, res, tipo, '/arquivos/' + req.file.filename);
});

module.exports = {
  escopoMonitor, getHorarios, addHorario, deleteHorario, editarHorario, getModalidadesParaLinks, updateLink,
  uploadEdital: uploadDocumento('edital'), uploadChaveamento: uploadDocumento('chaveamento')
};
