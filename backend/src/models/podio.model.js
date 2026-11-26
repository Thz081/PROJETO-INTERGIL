const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: String,
  modalidadeId: { type: Number, required: true, index: true },
  formato: { type: String, required: true },
  posicoes: { type: [mongoose.Schema.Types.ObjectId], required: true },
  versao: { type: Number, required: true }
}, { timestamps: true, collection: 'podios' });

module.exports = mongoose.model('Podio', schema);
