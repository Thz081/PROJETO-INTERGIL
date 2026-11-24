const mongoose = require('mongoose');

const alunoSchema = new mongoose.Schema(
    {
        email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
        senhaHash: { type: String, select: false },
        versaoAcesso: { type: Number, default: 0 },
        ativo: { type: Boolean, default: true },
        nome: { type: String, required: true },
        n_inscricao: { type: String, required: true, unique: true }, // Matrícula
        data_nascimento: { type: String },
        turma: { type: String },
        sexo: { type: String, enum: ['M', 'F'] },
        
        // === AQUI ESTÁ ELE DE VOLTA ===
        role: { type: String, default: 'aluno' }, 

        inscricoes: { type: [String], default: [] },
        
        // O Fantasma do Pré-Gil
        preGil: {
            futsal: { type: Number, default: 0 },
            volei: { type: Number, default: 0 },
            basquete: { type: Number, default: 0 }
        }
    },
    {
        timestamps: true,
        collection: 'alunos',
    }
);

const Aluno = mongoose.model('Aluno', alunoSchema);
module.exports = Aluno;