// Arquivo: InterDoZero/src/routes/admin.routes.js
// VERSÃO 3.4 - COM HALL DA FAMA CORRIGIDO

const express = require('express');
const router = express.Router();

// Middlewares de Autenticação
const { protect, isAdmin } = require('../middleware/auth.middleware.js');

// Middlewares de Upload
const { verificarPDF, uploadGeral, uploadMomento, uploadLogo } = require('../middleware/upload.middleware.js');

// Controllers Antigos
const {
  getSalasAdmin,
  createSala,
  updateSala,
  deleteSala,
  updatePontos,
  getLogs,
  getAllInscricoes,
  uploadEditalGeral,
  getAllMomentosAdmin,
  createMomento,
  deleteMomento
} = require('../controllers/admin.controller');

const { updateConfig, updateLogo } = require('../controllers/config.controller');
const gestaoController = require('../controllers/gestao.controller.js');

// === >>> O IMPORT QUE FALTOU <<< ===
const hallController = require('../controllers/hall.controller.js'); 

// Proteção Global
router.use(protect, isAdmin);

router.post('/edital-modalidade', uploadGeral.single('edital'), verificarPDF, require('../controllers/monitor.controller').uploadEdital);
router.post('/importar-alunos', require('../controllers/importacao.controller'));
router.post('/salas/:id/logo', uploadLogo.single('logo'), async (req, res) => {
  if (!req.file) return res.sendStatus(400);
  const sala = await require('../models/sala.model').findByIdAndUpdate(req.params.id, { logo_url: '/arquivos/' + req.file.filename }, { new: true });
  res.status(sala ? 200 : 404).json(sala);
});

// === ROTAS DE SALAS ===
router.route('/salas')
  .get(getSalasAdmin)
  .post(createSala);

router.route('/salas/:id')
  .put(updateSala)
  .delete(deleteSala);

// === ROTAS DE PONTUAÇÃO E LOGS ===
router.put('/pontos', updatePontos);
router.get('/logs', getLogs);
router.get('/inscricoes', getAllInscricoes);

// === ROTA DO EDITAL GERAL ===
router.post(
  '/upload-edital-geral',
  uploadGeral.single('editalGeral'), verificarPDF,
  uploadEditalGeral
);

// === ROTA DE MOMENTOS (GALERIA) ===
router.route('/momentos')
  .get(getAllMomentosAdmin)
  .post(
    uploadMomento.single('arquivoMomento'),
    createMomento
  );

router.route('/momentos/:id')
  .delete(deleteMomento);

// === ROTAS DE CONFIGURAÇÃO DO SITE ===
router.put('/config', updateConfig); 

router.put(
    '/config/logo', 
    uploadLogo.single('logo'), 
    updateLogo
);

router.post(
    '/modalidades', 
    uploadLogo.fields([
        { name: 'imgCarrossel', maxCount: 1 }, // Campo 1
        { name: 'imgDetalhe', maxCount: 1 }    // Campo 2
    ]), 
    gestaoController.createModalidade
);

// Adicionando rota de UPDATE (Editar) que vamos precisar na Fase 3
router.put(
    '/modalidades/:id',
    uploadLogo.fields([
        { name: 'imgCarrossel', maxCount: 1 },
        { name: 'imgDetalhe', maxCount: 1 }
    ]),
    gestaoController.updateModalidade // Vamos criar essa função agora
);

router.delete('/modalidades/:id', gestaoController.deleteModalidade);

// === HALL DA FAMA (NOVO) ===
// Agora vai funcionar porque importamos o hallController lá em cima!
router.get('/hall', hallController.getHall);
router.post(
    '/hall', 
    uploadLogo.single('logo'), // <--- O SALVADOR (Aceita Imagem)
    hallController.createEntry
);
router.delete('/hall/:id', hallController.deleteEntry);

module.exports = router;