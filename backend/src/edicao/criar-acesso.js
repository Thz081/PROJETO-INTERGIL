// Executar dentro do contêiner. A senha gerada só é entregue ao operador local.
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const Gestao = require('../models/gestao.model');
const Monitor = require('../models/monitor.model');

(async () => {
  const [tipo, login, nome] = process.argv.slice(2);
  if (!login || !['gestao','monitor'].includes(tipo)) throw new Error('Uso: criar-acesso.js gestao|monitor login [nome]');
  await connectDB({ dbName: 'intergil2026' });
  const modelo = tipo === 'gestao' ? Gestao : Monitor;
  const busca = tipo === 'gestao' ? { nome: login } : { matricula: login };
  if (await modelo.exists(busca)) throw new Error('Acesso já cadastrado.');
  const senha = crypto.randomBytes(18).toString('base64url');
  await modelo.create({ ...busca, nome: nome || login, senha: await bcrypt.hash(senha, 12) });
  console.log('Login: ' + login + '\nSenha: ' + senha);
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
