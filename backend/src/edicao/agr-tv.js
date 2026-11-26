const fs = require('node:fs');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const Aluno = require('../models/aluno.model');
const Monitor = require('../models/monitor.model');

async function executar() {
  const [acao, acesso, ...partes] = process.argv.slice(2);
  const nome = partes.join(' ').trim();
  if (!acesso || !['vincular', 'criar', 'retirar'].includes(acao))
    throw new Error('Use vincular <matrícula>, criar <usuário> <nome> ou retirar <matrícula ou usuário>.');
  await connectDB({ dbName: 'intergil2026' });
  if (acao === 'retirar') {
    const resultado = await Monitor.updateOne({ matricula: acesso }, { $set: { agrTv: false } });
    if (!resultado.matchedCount) throw new Error('Conta não encontrada.');
  } else if (acao === 'vincular') {
    const aluno = await Aluno.findOne({ n_inscricao: acesso, ativo: { $ne: false } }).select('nome').lean();
    if (!aluno) throw new Error('Confira a matrícula do aluno ativo.');
    const existente = await Monitor.findOne({ matricula: acesso }).select('alunoId').lean();
    if (existente?.alunoId && String(existente.alunoId) !== String(aluno._id))
      throw new Error('Esta matrícula já está associada a outro aluno.');
    await Monitor.updateOne({ matricula: acesso }, {
      $set: { alunoId: aluno._id, agrTv: true }, $setOnInsert: { nome: aluno.nome }
    }, { upsert: true });
  } else {
    if (!/^[a-z][a-z0-9._-]{2,39}$/.test(acesso) || !nome || nome.length > 100)
      throw new Error('Informe um usuário nominal em minúsculas e um nome válido.');
    const senha = fs.readFileSync(0, 'utf8').replace(/\r?\n$/, '');
    if (senha.length < 12 || Buffer.byteLength(senha) > 72)
      throw new Error('Forneça a senha pela entrada padrão, de 12 caracteres a 72 bytes.');
    await Monitor.create({ nome, matricula: acesso, senha: await bcrypt.hash(senha, 12), agrTv: true });
  }
  console.log('Atribuição da AGR TV atualizada.');
}

executar().then(() => process.exit(0), erro => {
  console.error(erro.code === 11000 ? 'Este usuário já existe.' : erro.message);
  process.exit(1);
});
