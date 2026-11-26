const mongoose = require('mongoose');
const movimentoSchema = new mongoose.Schema({
    motivo: { type: String, required: true },
    pontos: { type: Number, required: true },
    registradoEm: { type: Date, default: Date.now },
    operacao: String,
    podio: String,
    colocacao: Number
});
const salaSchema = mongoose.Schema({
    nome: { type: String, required: true },
    turma: { type: String, required: true }, // <-- TEM QUE SER 'turma'
    logo_url: { type: String },
    pontos: { type: Number, default: 0 },
    movimentosPontuacao: { type: [movimentoSchema], default: undefined },
    instagram: { type: String, default: '#' }
});
module.exports = mongoose.model('Sala', salaSchema);
