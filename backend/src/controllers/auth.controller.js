const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Gestao = require('../models/gestao.model');
const Monitor = require('../models/monitor.model');
const Aluno = require('../models/aluno.model');

const JWT_SECRET = process.env.JWT_SECRET;

// === LOGIN GESTÃO ===
const loginGestao = async (req, res) => {
    try {
        const { nome, senha } = req.body;
        if (typeof nome !== 'string' || typeof senha !== 'string' || !nome || !senha) return res.status(400).json({ message: "Campos obrigatórios." });
        
        const admin = await Gestao.findOne({ nome });
        if (!admin) return res.status(401).json({ message: "Credenciais inválidas." });
        
        const isMatch = await bcrypt.compare(senha, admin.senha);
        if (!isMatch) return res.status(401).json({ message: "Credenciais inválidas." });
        
        const payload = { id: admin._id, nome: admin.nome, role: admin.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        
        res.status(200).json({ token, user: payload });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

// === LOGIN MONITOR ===
const loginMonitor = async (req, res) => {
    try {
        const { matricula, senha } = req.body;
        if (typeof matricula !== 'string' || !matricula.trim() || typeof senha !== 'string' || !senha || Buffer.byteLength(senha) > 72)
            return res.status(400).json({ message: 'Informe sua matrícula ou usuário e sua senha.' });

        const monitor = await Monitor.findOne({ matricula: matricula.trim() }).lean();
        const aluno = monitor?.alunoId && await Aluno.findOne({
            _id: monitor.alunoId, n_inscricao: monitor.matricula, ativo: { $ne: false }
        }).select('+senhaHash nome versaoAcesso').lean();
        const hash = monitor?.alunoId ? aluno?.senhaHash : monitor?.senha;
        if (!hash || !await bcrypt.compare(senha, hash))
            return res.status(401).json({ message: 'Confira a matrícula ou o usuário e a senha. Se você é aluno e ainda não cadastrou uma senha, use o Primeiro acesso no portal do aluno.' });

        const user = { id: monitor._id, nome: aluno?.nome || monitor.nome, role: 'monitor' };
        if (monitor.agrTv) {
            user.agrTv = true;
            user.temModalidades = (monitor.modalidadesIds?.length ?? Number(Boolean(monitor.modalidadeId))) > 0;
        }
        const sessao = aluno ? { ...user, alunoId: String(aluno._id), versaoAcesso: aluno.versaoAcesso } : user;
        const token = jwt.sign(sessao, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

module.exports = {
    loginGestao,
    loginMonitor
};
