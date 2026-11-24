const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware'); // Importante!
const { criarInscricao, getMinhaInscricao, deleteMinhaInscricao, getContagemTurma, getOpcoes} = require('../controllers/inscricao.controller');

// Todas as rotas aqui precisam de login (protect)
router.use(protect, (req, res, next) => req.user.role === 'aluno' ? next() : res.sendStatus(403));
router.get('/opcoes', getOpcoes);
router.post('/', criarInscricao);
router.get('/me', getMinhaInscricao);
router.delete('/me', deleteMinhaInscricao);
router.get('/contagem', getContagemTurma);

module.exports = router;