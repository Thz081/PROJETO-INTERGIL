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
            required: true,
        },
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
