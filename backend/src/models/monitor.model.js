const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: true,
        },
        matricula: {
            type: String,
            required: true,
            unique: true,
        },
        senha: {
            type: String,
            required() { return !this.alunoId; },
        },
        alunoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Aluno' },
        agrTv: { type: Boolean, default: false },
        modalidadeId: {
            type: String,
        },
        modalidadesIds: {
            type: [Number],
            default: undefined,
            validate: {
                validator: ids => ids.length <= 3 && ids.every(id => Number.isSafeInteger(id) && id > 0) &&
                    new Set(ids).size === ids.length,
                message: 'Atribua até três modalidades distintas.'
            }
        },
        restricoesFormato: [{
            _id: false,
            modalidadeId: { type: Number, required: true },
            formatos: { type: [String], required: true }
        }],
        role: {
            type: String,
            default: 'monitor',
        },
    },
    {
        timestamps: true,
        collection: 'monitores',
    }
);

const Monitor = mongoose.model('Monitor', monitorSchema);

module.exports = Monitor;
