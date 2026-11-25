const express = require('express');
const router = express.Router();

const {
  getHorarios,
  addHorario,
  deleteHorario, editarHorario,
  getModalidadesParaLinks,
  updateLink,
  uploadEdital, uploadChaveamento, escopoMonitor
} = require('../controllers/monitor.controller.js');

const { protect, isMonitor } = require('../middleware/auth.middleware.js');

// === A CORREÇÃO (Linha 16) ===
// Antes: const upload = require(...)
// Agora: Puxa o 'upload' de DENTRO do objeto
const { verificarPDF, uploadGeral } = require('../middleware/upload.middleware');

router.use(protect, isMonitor, escopoMonitor);

// ... (rotas de horários e links continuam iguais) ...
router.route('/horarios').get(getHorarios).post(addHorario);
router.route('/horarios/:modId/:horarioId').put(editarHorario).delete(deleteHorario);
router.get('/modalidades-para-links', getModalidadesParaLinks);
router.post('/links', updateLink);

// ROTA DE UPLOAD (Agora vai funcionar)
router.post(
  '/upload-edital', 
 uploadGeral.single('edital'), verificarPDF,// 'upload' agora é a função certa
  uploadEdital
);
  
router.post('/upload-chaveamento', uploadGeral.single('chaveamento'), verificarPDF, uploadChaveamento);

module.exports = router;
