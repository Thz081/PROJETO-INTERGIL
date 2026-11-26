const mongoose = require('mongoose');
const Sala = require('../models/sala.model');
const Modalidade = require('../models/modalidade.model');
const Podio = require('../models/podio.model');
const LogAcao = require('../models/logAcao.model');
const { Controle } = require('../edicao/iniciar');
const { formatosDePodio, pontosPorLugar, chaveGeral } = require('../edicao/pontuacao');
const { configuracao } = require('./config.controller');

const camposSala = 'nome turma logo_url pontos';
const vazias = [null, null, null];

function falha(status, message) {
  throw Object.assign(new Error(message), { status });
}

function rota(fn) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try { await fn(req, res); }
    catch (erro) {
      if (erro.status) return res.status(erro.status).json({ message: erro.message });
      next(erro);
    }
  };
}

async function exigirRankingVisivel() {
  if ((await configuracao()).rankingVisivel === false) falha(404, 'Ranking temporariamente oculto.');
}

function validarSalaId(id) {
  if (typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id)) falha(400, 'Selecione uma sala válida.');
}

function registrar(req, acao, session) {
  return LogAcao.create([{ autor: `Gestão: ${req.user.nome}`, acao }], { session });
}

async function consultarResultados(admin = false) {
  const [modalidades, salas, podios] = await Promise.all([
    Modalidade.find().select('nome slug categoria imgCarrossel submodalidades.nome submodalidades.isPrincipal').sort('_id').lean(),
    Sala.find().select(admin ? camposSala : 'nome turma logo_url').sort({ turma: 1 }).lean(),
    Podio.find().select('formato posicoes versao').lean()
  ]);
  const salasPorId = new Map(salas.map(sala => [String(sala._id), {
    _id: sala._id, nome: sala.nome, turma: sala.turma, logo_url: sala.logo_url
  }]));
  const porChave = new Map(podios.map(item => [item._id, item]));
  const lista = modalidades.map(({ submodalidades, ...mod }) => ({
    ...mod,
    formatos: formatosDePodio({ submodalidades }).map(formato => {
      const podio = porChave.get(`${mod._id}:${formato.chave}`);
      return { ...formato, versao: podio?.versao || 0,
        posicoes: (podio?.posicoes || vazias).map(id => id ? salasPorId.get(String(id)) || null : null) };
    })
  }));
  return { pontosPorLugar, modalidades: lista, ...(admin && { salas }) };
}

exports.resultadosPublicos = rota(async (_req, res) => res.json(await consultarResultados()));
exports.gestaoPontuacao = rota(async (_req, res) => res.json(await consultarResultados(true)));

exports.rankingPublico = rota(async (_req, res) => {
  await exigirRankingVisivel();
  res.json(await Sala.find().select(camposSala).sort({ pontos: -1, turma: 1 }).lean());
});

exports.extratoPublico = rota(async (req, res) => {
  await exigirRankingVisivel();
  validarSalaId(req.params.id);
  const sala = await Sala.findById(req.params.id).select(camposSala + ' movimentosPontuacao').lean();
  if (!sala) falha(404, 'Sala não encontrada.');
  const { movimentosPontuacao = [], ...resumo } = sala;
  const movimentos = movimentosPontuacao.map(({ _id, motivo, pontos, registradoEm, colocacao }) => ({
    _id, motivo, pontos, registradoEm, colocacao
  })).sort((a, b) => new Date(b.registradoEm) - new Date(a.registradoEm));
  const adicionados = movimentos.reduce((total, item) => total + Math.max(0, item.pontos), 0);
  const descontados = movimentos.reduce((total, item) => total - Math.min(0, item.pontos), 0);
  res.json({ sala: resumo, adicionados, descontados, movimentos });
});

exports.lancarPontos = rota(async (req, res) => {
  const { salaId, pontos, motivo, operacao } = req.body || {};
  validarSalaId(salaId);
  if (!Number.isSafeInteger(pontos) || pontos === 0) falha(400, 'Informe um número inteiro de pontos diferente de zero.');
  const descricao = typeof motivo === 'string' ? motivo.trim() : '';
  if (!descricao || descricao.length > 240) falha(400, 'Informe o motivo da pontuação em até 240 caracteres.');
  if (operacao !== undefined && (typeof operacao !== 'string' || !/^[a-z0-9-]{1,72}$/i.test(operacao)))
    falha(400, 'Identificador de lançamento inválido.');

  const salaAtualizada = await mongoose.connection.transaction(async session => {
    const sala = await Sala.findById(salaId).session(session);
    if (!sala) falha(404, 'Sala não encontrada.');
    sala.movimentosPontuacao ||= [];
    const anterior = operacao && sala.movimentosPontuacao.find(item => item.operacao === operacao);
    if (anterior) {
      if (anterior.pontos !== pontos || anterior.motivo !== descricao) falha(409, 'Este lançamento já foi usado com outros dados.');
    } else {
      if (!Number.isSafeInteger(sala.pontos + pontos)) falha(400, 'A pontuação final é grande demais.');
      sala.pontos += pontos;
      sala.movimentosPontuacao.push({ pontos, motivo: descricao, operacao });
      await sala.save({ session });
      await registrar(req, `${sala.nome} recebeu ${pontos > 0 ? '+' : ''}${pontos} pontos · ${descricao}`, session);
    }
    return { _id: sala._id, nome: sala.nome, turma: sala.turma, pontos: sala.pontos, logo_url: sala.logo_url };
  });
  res.json(salaAtualizada);
});

exports.salvarPodio = rota(async (req, res) => {
  const modalidadeId = Number(req.params.id);
  const { formato, posicoes, versao } = req.body || {};
  if (!Number.isSafeInteger(modalidadeId) || typeof formato !== 'string' || !Array.isArray(posicoes) ||
      posicoes.length !== 3 || !Number.isSafeInteger(versao) || versao < 0)
    falha(400, 'Informe a modalidade, o formato e as três posições do pódio.');
  const vencedoras = posicoes.filter(id => id !== null);
  vencedoras.forEach(validarSalaId);
  if (new Set(vencedoras.map(id => id.toLowerCase())).size !== vencedoras.length)
    falha(400, 'Cada sala pode ocupar apenas uma posição neste pódio.');

  const novasPosicoes = posicoes.map(id => id?.toLowerCase() ?? null);
  await mongoose.connection.transaction(async session => {
    // A mesma escrita usada por alterações de catálogo protege os formatos durante o lançamento.
    await Controle.updateOne({ _id: 'vagas' }, { $inc: { versao: 1 } }, { session });
    const modalidade = await Modalidade.findById(modalidadeId).session(session).lean();
    if (!modalidade) falha(404, 'Modalidade não encontrada.');
    if (!formatosDePodio(modalidade).some(item => item.chave === formato)) falha(400, 'Selecione um formato dessa modalidade.');
    const id = `${modalidadeId}:${formato}`;
    const anterior = await Podio.findById(id).session(session).lean();
    const antigasPosicoes = (anterior?.posicoes || vazias).map(posicao => posicao ? String(posicao) : null);
    if (antigasPosicoes.every((posicao, i) => posicao === novasPosicoes[i])) return;
    if ((anterior?.versao || 0) !== versao) falha(409, 'Este pódio mudou. Atualize a tela antes de editar novamente.');
    const ids = [...new Set([...antigasPosicoes, ...novasPosicoes].filter(Boolean))];
    const salas = await Sala.find({ _id: { $in: ids } }).session(session);
    if (salas.length !== ids.length) falha(400, 'Uma das salas selecionadas não existe mais.');
    for (const sala of salas) {
      const indice = novasPosicoes.indexOf(String(sala._id));
      if (indice === antigasPosicoes.indexOf(String(sala._id))) continue;
      const movimentos = sala.movimentosPontuacao || [];
      const antigo = movimentos.find(item => item.podio === id);
      const pontos = pontosPorLugar[indice] || 0;
      if (!Number.isSafeInteger(sala.pontos - (antigo?.pontos || 0) + pontos)) falha(400, 'A pontuação final é grande demais.');
      sala.pontos = sala.pontos - (antigo?.pontos || 0) + pontos;
      sala.movimentosPontuacao = movimentos.filter(item => item.podio !== id);
      if (pontos) sala.movimentosPontuacao.push({ podio: id, colocacao: indice + 1, pontos,
        motivo: formato === chaveGeral ? modalidade.nome : `${modalidade.nome} · ${formato}` });
      await sala.save({ session });
    }
    await Podio.updateOne({ _id: id }, { $set: { modalidadeId, formato, posicoes: novasPosicoes, versao: versao + 1 } }, { upsert: true, session });
    await registrar(req, `Atualizou o pódio de ${modalidade.nome}${formato === chaveGeral ? '' : ` · ${formato}`}.`, session);
  });
  res.json(await consultarResultados(true));
});
