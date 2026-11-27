const { createHash, randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const express = require('express');
const { Types } = require('mongoose');
const Momento = require('../models/momento.model');
const Modalidade = require('../models/modalidade.model');
const Sala = require('../models/sala.model');
const LogAcao = require('../models/logAcao.model');
const { raiz, entrada, saida, limites, formatos, MiB, prepararDiretorios } = require('../config/momentos');

const idValido = valor => typeof valor === 'string' && /^[a-f0-9]{24}$/i.test(valor);
const tipoValido = tipo => tipo === 'foto' || tipo === 'video';
const assuntos = ['evento', 'modalidade', 'mascote', 'danca'];
const publico = { estado: { $nin: ['rascunho', 'retirado'] } };
const podeAnexar = { $or: [{ estado: { $in: ['rascunho', 'retirado'] } }, { estado: 'publicado', tipo: 'foto' }] };
const erro = (status, message) => Object.assign(new Error(message), { status });
const lerTrecho = express.raw({ type: 'application/octet-stream', limit: 4 * MiB });
const nomeOriginal = valor => {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > 240) throw erro(400, 'Nome de arquivo inválido.');
  return valor;
};

let recebendo = false;

function idMomento(req) {
  if (!idValido(req.params.id)) throw erro(404, 'Publicação não encontrada.');
  return req.params.id;
}

async function catalogo(_req, res) {
  const [modalidades, salas] = await Promise.all([
    Modalidade.find().select('nome slug categoria submodalidades.nome imgCarrossel').sort({ nome: 1 }).lean(),
    Sala.find().select('nome turma logo_url').sort({ turma: 1 }).lean()
  ]);
  res.json({ modalidades, salas });
}

async function colecoes(req, res) {
  const { sala } = req.query;
  if (sala && !idValido(sala)) throw erro(400, 'Selecione uma turma válida.');
  const filtro = { ...publico, assunto: { $in: ['modalidade', 'mascote', 'danca'] },
    ...(sala && { salas: new Types.ObjectId(sala) }) };
  const resumo = await Momento.aggregate([
    { $match: filtro },
    { $sort: { _id: -1 } },
    { $project: {
      assunto: 1, modalidade: 1, tipo: 1, url: 1, formato: { $ifNull: ['$formato', ''] },
      prontas: { $filter: { input: { $ifNull: ['$midias', []] }, as: 'm', cond: { $eq: ['$$m.estado', 'pronta'] } } }
    } },
    { $project: { assunto: 1, modalidade: 1, tipo: 1, url: 1, formato: 1,
      arquivos: { $cond: [{ $gt: [{ $size: '$prontas' }, 0] }, { $size: '$prontas' }, { $cond: ['$url', 1, 0] }] },
      capaId: { $arrayElemAt: ['$prontas._id', 0] }
    } },
    { $match: { arquivos: { $gt: 0 } } },
    { $group: {
      _id: { assunto: '$assunto', modalidade: '$modalidade', formato: '$formato', tipo: '$tipo' },
      total: { $sum: '$arquivos' }, publicacao: { $first: '$_id' }, capaId: { $first: '$capaId' }, url: { $first: '$url' }
    } }
  ]).option({ maxTimeMS: 3000 });
  res.set('Cache-Control', 'no-store').json(resumo.map(({ _id, total, publicacao, capaId, url }) => ({
    ..._id, total, capa: capaId ? `/api/acervo-momentos/${publicacao}/arquivo/${capaId}/capa` :
      _id.tipo === 'foto' ? url : undefined
  })));
}

function chaveAlbum({ modalidade, formato, salas }) {
  return createHash('sha256').update(JSON.stringify([modalidade, formato || '', salas.map(sala => String(sala).toLowerCase()).sort()])).digest('hex');
}

function texto(valor, max) {
  if (valor == null) return '';
  if (typeof valor !== 'string' || valor.trim().length > max) throw erro(400, 'Confira o tamanho dos campos de texto.');
  return valor.trim();
}

async function campos(body, tipo) {
  const titulo = texto(body.titulo, 120);
  const legenda = texto(body.legenda, 1400);
  const assunto = body.assunto;
  if (!titulo || !tipoValido(tipo) || !assuntos.includes(assunto)) throw erro(400, 'Informe o título, o tipo e o assunto.');
  const salas = body.salas ?? [];
  if (!Array.isArray(salas) || salas.length > 3 || salas.some(sala => !idValido(sala)) ||
      new Set(salas.map(sala => sala.toLowerCase())).size !== salas.length ||
      await Sala.countDocuments({ _id: { $in: salas } }) !== salas.length)
    throw erro(400, 'Selecione turmas válidas e distintas.');
  if ((assunto === 'mascote' && salas.length !== 1) || (assunto === 'danca' && salas.length !== 3))
    throw erro(400, 'Selecione uma turma para Mascote ou três para Dança geral.');
  if (assunto === 'modalidade' && salas.length > 2)
    throw erro(400, 'Marque até duas turmas por registro da modalidade.');
  const tema = assunto === 'danca' ? texto(body.tema, 120) : '';
  if (assunto === 'danca' && !tema) throw erro(400, 'Informe o tema da dança geral.');
  const modalidade = assunto === 'modalidade' ? Number(body.modalidade) : null;
  const formato = modalidade ? texto(body.formato, 100) : '';
  if (assunto === 'modalidade') {
    const registro = Number.isSafeInteger(modalidade) && await Modalidade.findById(modalidade).select('submodalidades.nome').lean();
    if (!registro || (formato && !registro.submodalidades.some(item => item.nome === formato)))
      throw erro(400, 'Selecione uma modalidade e um formato do catálogo.');
  }
  return { titulo, legenda, assunto, salas, tema, modalidade, formato, lance: tipo === 'video' && body.lance === true };
}

function ficha(doc, equipe = false, previa = '') {
  const { _id, tipo, estado = 'publicado', titulo, assunto = 'evento', legenda, tema, modalidade, formato,
    salas = [], lance, publicadoEm, createdAt, url } = doc;
  const midias = (doc.midias || []).filter(item => equipe || item.estado === 'pronta').map(item => {
    const rota = `/api/acervo-momentos/${_id}/arquivo/${item._id}/`;
    return { _id: item._id, duracao: item.duracao, largura: item.largura, altura: item.altura,
      ...(item.estado === 'pronta' && { capa: rota + 'capa' + previa, url: rota + 'principal' + previa }),
      ...(equipe && { estado: item.estado, erro: item.erro, tamanho: item.tamanho }) };
  });
  if (url && !doc.midias) midias.push({ _id, url, capa: tipo === 'foto' ? url : undefined });
  return { _id, tipo, titulo, assunto, legenda, tema, modalidade, formato, salas, lance,
    publicadoEm: publicadoEm || createdAt, midias, ...(equipe && { estado, legado: Boolean(url && !doc.midias) }) };
}

async function lista(req, res, equipe = false) {
  const filtro = equipe ? {} : { ...publico };
  const { tipo, assunto, modalidade, sala, antes, lance } = req.query;
  if (tipoValido(tipo)) filtro.tipo = tipo;
  if (assuntos.includes(assunto)) filtro.assunto = assunto;
  if (/^\d{1,8}$/.test(modalidade)) filtro.modalidade = Number(modalidade);
  if (idValido(sala)) filtro.salas = sala;
  if (typeof req.query.formato === 'string' && req.query.formato && req.query.formato.length <= 100)
    filtro.formato = req.query.formato;
  if (lance === '1') {
    filtro.lance = true;
    filtro.tipo = 'video';
    if (!equipe) filtro.midias = { $elemMatch: { estado: 'pronta', duracao: { $gt: 0, $lte: 90 } } };
  }
  if (idValido(antes)) filtro._id = { $lt: antes };
  const itens = await Momento.find(filtro).sort({ _id: -1 }).limit(13).lean();
  res.set('Cache-Control', 'no-store').json({
    itens: itens.slice(0, 12).map(item => ficha(item, equipe)),
    proximo: itens.length > 12 ? itens[11]._id : null
  });
}

async function detalhe(req, res, equipe = false) {
  const doc = await Momento.findOne({ _id: idMomento(req), ...(equipe ? {} : publico) }).lean();
  if (!doc) throw erro(404, 'Publicação não encontrada.');
  const previa = equipe && doc.estado !== 'publicado' && doc.midias?.some(item => item.estado === 'pronta')
    ? '?previa=' + jwt.sign({}, process.env.JWT_SECRET, { audience: 'momento-previa',
        subject: String(doc._id), expiresIn: '10m', algorithm: 'HS256' }) : '';
  res.set('Cache-Control', 'no-store').json(ficha(doc, equipe, previa));
}

async function criar(req, res) {
  const { tipo } = req.body;
  const valores = await campos(req.body, tipo);
  const doc = await Momento.create({ ...valores, tipo, estado: 'rascunho', midias: [], autor: String(req.user.id) });
  res.status(201).json(ficha(doc, true));
}

async function abrirAlbum(req, res) {
  const modalidade = Number(req.body.modalidade);
  const registro = Number.isSafeInteger(modalidade) && await Modalidade.findById(modalidade).select('nome').lean();
  if (!registro) throw erro(404, 'Modalidade não encontrada.');
  const formato = texto(req.body.formato, 100);
  const titulo = [registro.nome, formato].filter(Boolean).join(' · ').slice(0, 120);
  const valores = await campos({ titulo, assunto: 'modalidade', modalidade, formato, salas: req.body.salas }, 'foto');
  valores.salas = valores.salas.map(sala => sala.toLowerCase());
  const albumChave = chaveAlbum(valores);
  const filtro = { albumChave };
  const dados = { ...valores, tipo: 'foto', estado: 'rascunho', midias: [], autor: String(req.user.id), albumChave };
  const doc = await Momento.findOneAndUpdate(filtro, { $setOnInsert: dados }, { upsert: true, new: true }).lean()
    .catch(falha => { if (falha.code === 11000) return Momento.findOne(filtro).lean(); throw falha; });
  if (!doc) throw erro(409, 'O álbum foi alterado. Abra a coleção novamente.');
  res.json(ficha(doc, true));
}

async function editar(req, res) {
  const doc = await Momento.findById(idMomento(req)).lean();
  if (!doc) throw erro(404, 'Publicação não encontrada.');
  const valores = await campos(req.body, doc.tipo);
  if (valores.lance && doc.midias?.some(item => item.duracao > 90))
    throw erro(400, 'Use como Lance apenas um vídeo de até 90 segundos.');
  const atualizacao = { $set: valores };
  if (doc.albumChave && (valores.assunto !== 'modalidade' || chaveAlbum(valores) !== doc.albumChave))
    atualizacao.$unset = { albumChave: '' };
  const atual = await Momento.findByIdAndUpdate(doc._id, atualizacao, { new: true }).lean();
  if (!atual) throw erro(404, 'Publicação não encontrada.');
  res.json(ficha(atual, true));
}

async function tamanhoRecebido(arquivo) {
  try { return (await fs.stat(arquivo)).size; }
  catch (falha) {
    if (falha.code === 'ENOENT') return 0;
    throw falha;
  }
}

async function iniciarEnvio(req, res) {
  const id = idMomento(req);
  const doc = await Momento.findById(id).select('tipo estado midias').lean();
  if (!doc || !doc.midias) throw erro(404, 'Rascunho não encontrado.');
  if (doc.estado === 'publicado' && doc.tipo !== 'foto') throw erro(409, 'Retire o vídeo do ar antes de trocar o arquivo.');
  const nome = nomeOriginal(req.body.nome);
  const extensao = path.extname(nome).toLowerCase();
  const { bytes, alteradoEm } = req.body;
  if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > limites[doc.tipo])
    throw erro(413, 'O arquivo passou do limite desta publicação ou está vazio.');
  if (!formatos[doc.tipo].includes(extensao) || !Number.isSafeInteger(alteradoEm))
    throw erro(400, 'Formato de arquivo incompatível com esta publicação.');
  const autor = String(req.user.id);
  const anterior = doc.midias.find(item => item.autor === autor && item.original === nome &&
    item.bytesOriginais === bytes && item.alteradoEm === alteradoEm && item.estado !== 'falhou');
  if (anterior) {
    const recebido = anterior.estado === 'enviando' ? await tamanhoRecebido(path.join(entrada, anterior.entrada)) : bytes;
    if (recebido === bytes && anterior.estado === 'enviando') await Momento.updateOne({
      _id: id, midias: { $elemMatch: { _id: anterior._id, estado: 'enviando' } }
    }, { $set: { 'midias.$.estado': 'fila' } });
    return res.json({ midia: anterior._id, recebido, concluido: recebido === bytes });
  }
  const maximo = doc.tipo === 'foto' ? 12 : 1;
  if (doc.midias.length >= maximo) throw erro(409, 'Libere espaço nos anexos antes de enviar.');
  if (recebendo) throw erro(429, 'Já há um envio em andamento. Tente novamente em instantes.');
  recebendo = true;
  try {
    await prepararDiretorios();
    const [disco, [uso]] = await Promise.all([
      fs.statfs(raiz),
      Momento.aggregate([{ $unwind: '$midias' }, { $group: {
        _id: null,
        bytes: { $sum: '$midias.tamanho' },
        pendentes: { $sum: { $cond: [{ $in: ['$midias.estado', ['enviando', 'fila', 'processando']] }, 1, 0] } }
      } }])
    ]);
    const limiteAcervo = Number(process.env.MOMENTOS_ACERVO_MIB || 5120) * MiB;
    if ((uso?.bytes || 0) + bytes > limiteAcervo || disco.bavail * disco.bsize < (1536 * MiB) + bytes)
      throw erro(507, 'O acervo está sem espaço para novos arquivos.');
    if ((uso?.pendentes || 0) >= 6) throw erro(429, 'A fila de mídia está cheia. Aguarde o processamento de um arquivo.');
    const midia = { _id: new Types.ObjectId(), estado: 'enviando', entrada: randomUUID() + extensao,
      tamanho: bytes, bytesOriginais: bytes, alteradoEm, original: nome, autor, tocadoEm: new Date() };
    const atual = await Momento.findOneAndUpdate({
      _id: id, ...podeAnexar, [`midias.${maximo - 1}`]: { $exists: false },
      midias: { $not: { $elemMatch: { autor, original: nome, bytesOriginais: bytes, alteradoEm, estado: { $ne: 'falhou' } } } }
    }, { $push: { midias: midia } }).lean();
    if (!atual) throw erro(409, 'A publicação foi alterada. Confira o estado e tente novamente.');
    res.status(201).json({ midia: midia._id, recebido: 0, concluido: false });
  } finally { recebendo = false; }
}

async function anexarTrecho(req, res) {
  const id = idMomento(req);
  const midia = req.params.midia;
  if (!idValido(midia)) throw erro(404, 'Envio não encontrado.');
  const offset = req.get('Upload-Offset');
  if (!/^\d{1,10}$/.test(offset)) throw erro(400, 'Informe a posição do trecho no upload.');
  if (recebendo) throw erro(429, 'Outro trecho está chegando. Retome o envio em instantes.');
  recebendo = true;
  try {
    const doc = await Momento.findOne({ _id: id, ...podeAnexar, 'midias._id': midia })
      .select('midias').lean();
    const item = doc?.midias.find(arquivo => String(arquivo._id) === midia && arquivo.autor === String(req.user.id));
    if (!item) throw erro(404, 'Envio não encontrado.');
    if (item.estado !== 'enviando') {
      if (item.estado === 'falhou') throw erro(409, 'Remova o arquivo com erro e envie de novo.');
      return res.json({ recebido: item.bytesOriginais, concluido: true });
    }
    await new Promise((resolve, reject) => lerTrecho(req, res, falha => falha ? reject(falha) : resolve()));
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw erro(400, 'Trecho de upload vazio ou inválido.');
    const arquivo = path.join(entrada, item.entrada);
    const recebido = await tamanhoRecebido(arquivo);
    if (Number(offset) !== recebido || recebido + req.body.length > item.bytesOriginais)
      return res.status(409).json({ message: 'A posição do envio mudou. Continue do último trecho recebido.', recebido });
    const disco = await fs.statfs(raiz);
    if (disco.bavail * disco.bsize < 1536 * MiB) throw erro(507, 'O acervo está sem espaço para novos arquivos.');
    await fs.appendFile(arquivo, req.body, { mode: 0o600 });
    const total = recebido + req.body.length;
    const concluido = total === item.bytesOriginais;
    await Momento.updateOne({ _id: id, 'midias._id': midia }, { $set: {
      'midias.$.estado': concluido ? 'fila' : 'enviando', 'midias.$.tocadoEm': new Date()
    } });
    res.json({ recebido: total, concluido });
  } finally { recebendo = false; }
}

async function limparMidia(arquivo) {
  await Promise.all([
    fs.rm(path.join(saida, String(arquivo._id)), { recursive: true, force: true }),
    arquivo.entrada && fs.rm(path.join(entrada, arquivo.entrada), { force: true })
  ]);
}

async function excluirRascunho(req, res) {
  const id = idMomento(req);
  if (recebendo) throw erro(429, 'Aguarde o trecho atual antes de excluir o rascunho.');
  recebendo = true;
  try {
    const doc = await Momento.findOneAndDelete({
      _id: id, estado: 'rascunho', 'midias.estado': { $ne: 'processando' }
    }).lean();
    if (!doc && !await Momento.exists({ _id: id })) throw erro(404, 'Rascunho não encontrado.');
    if (!doc) throw erro(409, 'Só é possível excluir um rascunho fora de processamento.');

    const resultados = await Promise.allSettled([
      ...(doc.midias || []).map(limparMidia),
      LogAcao.create({ autor: String(req.user.nome), acao: `Excluiu o rascunho ${doc.titulo} (${id})` })
    ]);
    for (const item of resultados) {
      if (item.status === 'rejected') console.error('Limpeza de rascunho:', id, item.reason.code || item.reason.name);
    }
    res.sendStatus(204);
  } finally { recebendo = false; }
}

async function removerMidia(req, res) {
  const id = idMomento(req);
  if (recebendo) throw erro(429, 'Aguarde o trecho atual antes de remover o arquivo.');
  if (!idValido(req.params.midia)) throw erro(404, 'Arquivo não encontrado.');
  recebendo = true;
  try {
    const midia = req.params.midia;
    const filtro = { _id: midia, estado: { $ne: 'processando' } };
    const restantePublica = { $gt: [{ $size: { $filter: { input: { $ifNull: ['$midias', []] }, as: 'foto',
      cond: { $and: [{ $ne: ['$$foto._id', new Types.ObjectId(midia)] }, { $eq: ['$$foto.estado', 'pronta'] }] }
    } } }, 0] };
    const antigo = await Momento.findOneAndUpdate({
      _id: id, $or: [podeAnexar.$or[0], { ...podeAnexar.$or[1], $expr: restantePublica }], midias: { $elemMatch: filtro }
    }, { $pull: { midias: { _id: midia } } }).lean();
    if (!antigo) throw erro(409, 'Aguarde o processamento ou retire a publicação do ar antes de remover a última mídia.');
    const arquivo = antigo.midias.find(item => String(item._id) === midia);
    await limparMidia(arquivo);
    res.sendStatus(204);
  } finally { recebendo = false; }
}

async function estado(req, res) {
  const id = idMomento(req);
  const publicar = req.body.estado === 'publicado';
  if (!publicar && req.body.estado !== 'retirado') throw erro(400, 'Estado de publicação inválido.');
  const filtro = publicar ? { estado: { $in: ['rascunho', 'retirado'] }, $or: [
    { 'midias.0': { $exists: true }, 'midias.estado': { $nin: ['enviando', 'fila', 'processando', 'falhou'] },
      $or: [{ lance: { $ne: true } }, { 'midias.duracao': { $lte: 90 } }] },
    { url: { $type: 'string' }, midias: { $exists: false } }
  ] } : { ...publico };
  const valores = publicar ? { estado: 'publicado', publicadoEm: new Date() } : { estado: 'retirado' };
  const atual = await Momento.findOneAndUpdate({ _id: id, ...filtro }, { $set: valores }, { new: true }).lean();
  if (!atual) throw erro(409, publicar ? 'Confira se os arquivos estão prontos e se o Lance tem até 90 segundos.' :
    'A publicação já está fora do ar ou foi alterada.');
  await LogAcao.create({
    autor: `${req.user.role === 'gestao' ? 'Gestão' : 'AGR TV'}: ${req.user.nome}`,
    acao: `${publicar ? 'Publicou' : 'Retirou'} o momento ${atual.titulo} (${id})`
  }).catch(falha => console.error('Registro de Momentos:', falha.message));
  res.json(ficha(atual, true));
}

async function arquivo(req, res) {
  const id = idMomento(req);
  const { midia, parte } = req.params;
  if (!idValido(midia) || !['capa', 'principal'].includes(parte)) throw erro(404, 'Arquivo não encontrado.');
  let filtro = publico;
  if (typeof req.query.previa === 'string') {
    try {
      jwt.verify(req.query.previa, process.env.JWT_SECRET, { audience: 'momento-previa', subject: id,
        algorithms: ['HS256'] });
      filtro = {};
    } catch { throw erro(404, 'Prévia expirada. Abra a publicação novamente.'); }
  }
  const doc = await Momento.findOne({
    _id: id, ...filtro, midias: { $elemMatch: { _id: midia, estado: 'pronta' } }
  }).select('tipo').lean();
  if (!doc) throw erro(404, 'Arquivo não encontrado.');
  const nome = parte === 'capa' ? 'capa.webp' : doc.tipo === 'video' ? 'video.mp4' : 'foto.webp';
  res.set('Cache-Control', req.query.previa ? 'private, no-store' : 'public, max-age=60');
  res.set('X-Content-Type-Options', 'nosniff');
  if (req.get('x-intergil-entrega') === 'nginx') return res.set('X-Accel-Redirect', `/midia-interna/${midia}/${nome}`).end();
  res.sendFile(path.join(saida, midia, nome));
}

module.exports = { catalogo, colecoes, lista, detalhe, criar, abrirAlbum, editar, iniciarEnvio, anexarTrecho, removerMidia, excluirRascunho, estado, arquivo };
