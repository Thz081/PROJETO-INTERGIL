const express = require('express');
const router = express.Router();
const arquivoEditalGeral = require('../config/edital-geral');

// Controllers
const { getModalidades, getModalidadeBySlug, validarInscricao, getRankingSalas, getMomentos } = require('../controllers/modalidade.controller.js');
const { getConfig } = require('../controllers/config.controller');
const hallController = require('../controllers/hall.controller'); // <--- NOVO

// Rotas Públicas
router.get('/modalidades', getModalidades);
router.get('/modalidades/:slug', getModalidadeBySlug); 
router.post('/inscricao', validarInscricao);
router.get('/ranking/salas', getRankingSalas);
router.get('/momentos', getMomentos);
router.get('/config', getConfig);

// Rota Hall Pública
router.get('/hall', hallController.getHall); // <--- NOVO

// Edital Download
router.get('/edital-geral', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.download(arquivoEditalGeral, 'Edital-geral-Intergil-2026.pdf', (erro) => {
    if (!erro) return;
    if (!res.headersSent && erro.status === 404) return res.status(404).send('Edital ainda não publicado.');
    next(erro);
  });
});

module.exports = router;
