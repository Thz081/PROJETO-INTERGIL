const Config = require('../models/config.model');
const fs = require('node:fs');
const { protect } = require('../middleware/auth.middleware');
const { fim } = require('../edicao/regras');
let emManutencao = false;
const arquivoEditalGeral = require('../config/edital-geral');

async function configuracao() {
  const atual = await Config.findOne().sort({ _id: 1 });
  if (atual) return atual;
  return Config.findByIdAndUpdate('000000000000000000002026', { $setOnInsert: { siteName: 'Intergil 2026', logoUrl: '/images/armoriar.png' } },
    { new: true, upsert: true });
}
async function iniciarManutencao() {
  emManutencao = (await configuracao()).manutencao === true;
}

function verificarManutencao(req, res, next) {
  if (!emManutencao || (req.method === 'GET' && req.path === '/config') ||
      (req.method === 'POST' && req.path === '/auth/login-gestao')) return next();
  const indisponivel = () => res.set('Cache-Control', 'no-store').status(503)
    .json({ manutencao: true, message: 'O Intergil está em manutenção. Tente novamente mais tarde.' });
  if (!req.get('authorization')) return indisponivel();
  return protect(req, res, () => req.user.role === 'gestao' ? next() : indisponivel());
}

async function getConfig(req, res) {
  const atual = await configuracao();
  res.set('Cache-Control', 'no-store');
  res.json({ ...atual.toObject(), manutencao: atual.manutencao === true, fimInscricoes: fim, editalDisponivel: fs.existsSync(arquivoEditalGeral) });
}
async function updateConfig(req, res) {
  const atual = await configuracao();
  const { siteName, logoUrl } = req.body;
  if (req.body.rankingVisivel !== undefined) {
    if (typeof req.body.rankingVisivel !== 'boolean') return res.status(400).json({ message: 'Informe se o ranking deve ficar visível.' });
    atual.rankingVisivel = req.body.rankingVisivel;
  }
  if (req.body.manutencao !== undefined) {
    if (typeof req.body.manutencao !== 'boolean')
      return res.status(400).json({ message: 'Informe se o modo manutenção deve ficar ativo.' });
    atual.manutencao = req.body.manutencao;
  }
  if (typeof siteName === 'string' && siteName.trim()) atual.siteName = siteName.trim();
  if (typeof logoUrl === 'string' && logoUrl.trim()) atual.logoUrl = logoUrl.trim();
  await atual.save();
  if (req.body.manutencao !== undefined) emManutencao = atual.manutencao;
  res.json(atual);
}
async function updateLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Selecione uma imagem.' });
  const destino = req.body.destino || 'cartaz';
  if (!['cartaz', 'cabecalho'].includes(destino)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ message: 'Selecione o destino da imagem.' });
  }
  const atual = await configuracao();
  const campo = destino === 'cabecalho' ? 'headerLogoUrl' : 'logoUrl';
  atual[campo] = '/arquivos/' + req.file.filename;
  await atual.save();
  res.json({ logoUrl: atual.logoUrl, headerLogoUrl: atual.headerLogoUrl, config: atual });
}
module.exports = { configuracao, getConfig, updateConfig, updateLogo, iniciarManutencao, verificarManutencao };
