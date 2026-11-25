const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const { Controle } = require('./iniciar');
const Aluno = require('../models/aluno.model');
const { chaveTurma } = require('./regras');

function conectarVagas(server) {
  const wss = new WebSocketServer({ server, path: '/api/vagas/ao-vivo', maxPayload: 4096 });
  wss.on('connection', socket => {
    const prazo = setTimeout(() => socket.close(1008), 5000);
    socket.on('error', () => socket.terminate());
    socket.once('close', () => clearTimeout(prazo));
    socket.once('message', async raw => {
      try {
        const { token } = JSON.parse(raw);
        const user = jwt.verify(token, process.env.JWT_SECRET);
        if (user.role !== 'aluno' || user.versaoAcesso == null) throw new Error();
        const aluno = await Aluno.findOne({ _id: user.id, ativo: { $ne: false }, versaoAcesso: user.versaoAcesso }).select('turma');
        if (!aluno?.turma || socket.readyState !== WebSocket.OPEN) throw new Error();
        socket.turma = chaveTurma(aluno.turma);
        clearTimeout(prazo);
        socket.send('atualizar');
      } catch { socket.close(1008, 'Sessão inválida'); }
    });
  });
  // O change stream só publica transações confirmadas e funciona com mais de uma API.
  const stream = Controle.watch([{ $match: { 'documentKey._id': 'vagas', operationType: 'update' } }]);
  stream.on('change', evento => {
    const turma = evento.updateDescription.updatedFields.aviso?.split('|')[1];
    for (const socket of wss.clients) {
      if (socket.readyState === WebSocket.OPEN && socket.turma && socket.turma === turma)
        socket.send('atualizar');
    }
  });
  stream.on('error', err => { console.error('Falha no canal de vagas:', err.message); process.exit(1); });
}
module.exports = conectarVagas;
