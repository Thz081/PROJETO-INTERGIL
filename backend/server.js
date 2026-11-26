const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); 
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });
const connectDB = require('./src/config/db.js');

// Rotas
const authRoutes = require('./src/routes/auth.routes.js');
const apiRoutes = require('./src/routes/api.routes.js');
const adminRoutes = require('./src/routes/admin.routes.js');
const monitorRoutes = require('./src/routes/monitor.routes.js');
const inscricaoRoutes = require('./src/routes/inscricao.routes.js');
const momentosRoutes = require('./src/routes/momentos.routes.js');

const { iniciar } = require('./src/edicao/iniciar');
const conectarVagas = require('./src/edicao/vagasSocket');
const app = express();

// 1. LIBERA GERAL (CORS)
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '3mb' }));

// 2. CONFIGURAÇÃO CORRETA DO CAMINHO DE UPLOADS
// O server.js está na raiz do BACKEND, e a pasta uploads também.
// Então é só juntar __dirname (pasta atual) com 'uploads'.
const uploadsPath = path.join(__dirname, 'uploads');

// Debug: Mostra no terminal onde ele está procurando
if (fs.existsSync(uploadsPath)) {
    console.log(`✅ Pasta de uploads encontrada em: ${uploadsPath}`);
} else {
    console.error(`❌ ERRO CRÍTICO: Pasta uploads NÃO achada em: ${uploadsPath}`);
    console.log("👉 Verifique se a pasta 'uploads' está ao lado do 'server.js'");
    // Tenta criar se não existir pra não quebrar
    try {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log("🔧 Pasta uploads criada automaticamente.");
    } catch (e) {
        console.error("Não foi possível criar a pasta.");
    }
}

const servirArquivos = express.static(uploadsPath, {
  setHeaders(res, arquivo) {
    if (path.extname(arquivo).toLowerCase() === '.mp4') res.type('video/mp4');
  }
});
app.use(['/uploads', '/arquivos', '/api/uploads', '/api/arquivos'], servirArquivos);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monitor', monitorRoutes);
app.use('/api/inscricoes', inscricaoRoutes);
app.use('/api/acervo-momentos', momentosRoutes.publico);
app.use('/api/equipe/momentos', momentosRoutes.equipe);
app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'O arquivo excede o limite de tamanho.' });
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Erro ao processar a solicitação.' });
});
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await connectDB({ dbName: 'intergil2026' });
    await require('./src/models/momento.model').init();
    await iniciar();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
    });
    conectarVagas(server);
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err.message);
    process.exit(1);
  }
}

start();
