const express = require('express');
const {
    loginGestao,
    loginMonitor
} = require('../controllers/auth.controller');

const router = express.Router();

// Rota de login para alunos
const acesso = require('../controllers/acesso-aluno');
router.post('/login', acesso.loginAluno);
router.post('/primeiro-acesso/verificar', acesso.verificar);
router.post('/primeiro-acesso/ativar', acesso.ativar);

// Rota de login para a equipe de gestão
router.post('/login-gestao', loginGestao);

// Rota de login para monitores
router.post('/login-monitor', loginMonitor);

module.exports = router;
