const Config = require('../models/config.model');
const fs = require('node:fs');
const path = require('node:path');

async function configuracao() {
  const atual = await Config.findOne().sort({ _id: 1 });
  if (atual) return atual;
  return Config.findByIdAndUpdate('000000000000000000002026', { $setOnInsert: { siteName: 'Intergil 2026', logoUrl: '/images/armoriar.png' } },
    { new: true, upsert: true });
}
async function getConfig(req, res) {
  const atual = await configuracao();
  res.json({ ...atual.toObject(), editalDisponivel: fs.existsSync(path.join(__dirname, '../../uploads/EDITAL_GERAL_2026.pdf')) });
}
async function updateConfig(req, res) {
  const atual = await configuracao();
  const { siteName, logoUrl } = req.body;
  if (typeof siteName === 'string' && siteName.trim()) atual.siteName = siteName.trim();
  if (typeof logoUrl === 'string' && logoUrl.trim()) atual.logoUrl = logoUrl.trim();
  res.json(await atual.save());
}
async function updateLogo(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Selecione uma imagem.' });
  const atual = await configuracao();
  atual.logoUrl = '/arquivos/' + req.file.filename;
  await atual.save();
  res.json({ logoUrl: atual.logoUrl, config: atual });
}
module.exports = { getConfig, updateConfig, updateLogo };
