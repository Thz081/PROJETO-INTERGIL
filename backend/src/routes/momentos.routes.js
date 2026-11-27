const express = require('express');
const controller = require('../controllers/momentos.controller');
const { protect } = require('../middleware/auth.middleware');
const { escopoMonitor } = require('../controllers/monitor.controller');

const publico = express.Router();
publico.get('/', (req, res) => controller.lista(req, res));
publico.get('/catalogo', controller.catalogo);
publico.get('/colecoes', controller.colecoes);
publico.get('/:id', (req, res) => controller.detalhe(req, res));
publico.get('/:id/arquivo/:midia/:parte', controller.arquivo);

const equipe = express.Router();
equipe.use(protect, async (req, res, next) => {
  if (req.user.role === 'gestao') return next();
  if (req.user.role !== 'monitor') return res.status(403).json({ message: 'Acesso reservado à equipe de Momentos.' });
  return escopoMonitor(req, res, () => req.monitorAgrTv ? next() :
    res.status(403).json({ message: 'Acesso reservado à equipe de Momentos.' }));
});
equipe.route('/').get((req, res) => controller.lista(req, res, true)).post(controller.criar);
equipe.post('/colecoes', controller.abrirAlbum);
equipe.route('/:id').get((req, res) => controller.detalhe(req, res, true)).patch(controller.editar).delete(controller.excluirRascunho);
equipe.patch('/:id/estado', controller.estado);
equipe.post('/:id/envios', controller.iniciarEnvio);
equipe.put('/:id/envios/:midia', controller.anexarTrecho);
equipe.delete('/:id/arquivos/:midia', controller.removerMidia);

module.exports = { publico, equipe };
