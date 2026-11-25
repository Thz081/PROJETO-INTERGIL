// Executar dentro do contêiner. A senha gerada só é entregue ao operador local.
const crypto = require('node:crypto');
const { readFileSync } = require('node:fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const Gestao = require('../models/gestao.model');
const Monitor = require('../models/monitor.model');

(async () => {
  const argumentos = process.argv.slice(2);
  const senhaPorEntrada = argumentos.includes('--senha-stdin');
  const [tipo, login, nome] = argumentos.filter(arg => arg !== '--senha-stdin');
  if (!login || !['gestao','monitor'].includes(tipo)) throw new Error('Uso: criar-acesso.js gestao|monitor login [nome]');
  await connectDB({ dbName: 'intergil2026' });
  const modelo = tipo === 'gestao' ? Gestao : Monitor;
  const busca = tipo === 'gestao' ? { nome: login } : { matricula: login };
  if (await modelo.exists(busca)) throw new Error('Acesso já cadastrado.');
  const senha = senhaPorEntrada ? readFileSync(0, 'utf8').replace(/\r?\n$/, '') : crypto.randomBytes(18).toString('base64url');
  if ([...senha].length < 6 || Buffer.byteLength(senha) > 72) throw new Error('A senha precisa ter pelo menos seis caracteres e até 72 bytes.');
  await modelo.create({ ...busca, nome: tipo === 'gestao' ? login : nome || login, senha: await bcrypt.hash(senha, 12) });
  console.log('Login: ' + login + (senhaPorEntrada ? '' : '\nSenha: ' + senha));
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
