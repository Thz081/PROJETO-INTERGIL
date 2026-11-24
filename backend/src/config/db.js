// Arquivo: InterDoZero/src/config/db.js
// VERSÃO 1.1 - LIMPA E CORRIGIDA

const mongoose = require('mongoose');

const connectDB = async (options = {}) => {
    const uri = process.env.MONGO_URI?.trim();
    if (!uri) {
        throw new Error('MONGO_URI não definida. Crie o arquivo backend/.env com a URI do MongoDB Atlas.');
    }

    try {
        await mongoose.connect(uri, options);
        
        console.log(`Conectado ao MongoDB em ${mongoose.connection.host}`);
        

    } catch (err) {
        throw new Error(`Erro ao conectar ao MongoDB: ${err.message}`);
    }
};

module.exports = connectDB;
