// Arquivo: InterDoZero/src/middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const Aluno = require('../models/aluno.model');

// Middleware 1: Apenas checa se o token é válido
const protect = async (req, res, next) => {
  const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ message: 'Entre para continuar.' });
  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET);
    if (dados.aud || !['aluno','gestao','monitor'].includes(dados.role)) throw new Error();
    if (dados.role === 'aluno' && (dados.versaoAcesso == null || !await Aluno.exists({
      _id: dados.id, versaoAcesso: dados.versaoAcesso, ativo: { $ne: false }, senhaHash: { $type: 'string' }
    }))) throw new Error();
    req.user = dados;
  } catch { return res.status(401).json({ message: 'Sessão expirada. Entre novamente.' }); }
  next();
};

// Middleware 2: Checa se é Admin (Gestão)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'gestao') {
    next(); // É admin, pode passar
  } else {
    res.status(403).json({ message: 'Acesso negado. Requer privilégios de Gestão.' });
  }
};

// Middleware 3: Checa se é Monitor
const isMonitor = (req, res, next) => {
    if (req.user && req.user.role === 'monitor') {
      next(); // É monitor, pode passar
    } else {
      res.status(403).json({ message: 'Acesso negado. Requer privilégios de Monitor.' });
    }
  };

module.exports = { protect, isAdmin, isMonitor };