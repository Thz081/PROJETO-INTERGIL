const mongoose = require('mongoose');

const midiaSchema = new mongoose.Schema({
  entrada: String,
  estado: { type: String, enum: ['enviando', 'fila', 'processando', 'pronta', 'falhou'], required: true },
  tamanho: Number,
  duracao: Number,
  largura: Number,
  altura: Number,
  erro: String,
  iniciadoEm: Date,
  processamento: String,
  tocadoEm: Date,
  original: String,
  autor: String,
  alteradoEm: Number,
  bytesOriginais: Number
});

const momentoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'O título é obrigatório.'],
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  // Tipo: 'video' ou 'foto' (ajuda no frontend a decidir se bota um <iframe> ou <img>)
  tipo: {
    type: String,
    enum: ['video', 'foto'],
    default: 'video'
  },
  // Ordem: 1 (Abertura), 2 (Melhores Momentos), 3 (Resultados)
  ordem: {
    type: Number,
    default: 99
  },
  estado: { type: String, enum: ['rascunho', 'publicado', 'retirado'] },
  assunto: { type: String, enum: ['evento', 'modalidade', 'mascote', 'danca'] },
  legenda: String,
  tema: String,
  modalidade: Number,
  formato: String,
  salas: { type: [mongoose.Schema.Types.ObjectId], default: undefined },
  lance: Boolean,
  albumChave: String,
  autor: String,
  publicadoEm: Date,
  midias: { type: [midiaSchema], default: undefined }
}, { timestamps: true });

momentoSchema.index({ tipo: 1, estado: 1, _id: -1 });
momentoSchema.index({ 'midias.estado': 1 });
momentoSchema.index({ salas: 1, assunto: 1, modalidade: 1, tipo: 1, _id: -1 });
momentoSchema.index({ lance: 1, _id: -1 });
momentoSchema.index({ albumChave: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Momento', momentoSchema);
