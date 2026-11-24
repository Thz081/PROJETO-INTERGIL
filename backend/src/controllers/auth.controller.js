const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Gestao = require('../models/gestao.model');
const Monitor = require('../models/monitor.model');

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
        if (typeof matricula !== 'string' || typeof senha !== 'string' || !matricula || !senha) return res.status(400).json({ message: "Campos obrigatórios." });
        
        const monitor = await Monitor.findOne({ matricula });
        if (!monitor) return res.status(401).json({ message: "Credenciais inválidas." });
        
        const isMatch = await bcrypt.compare(senha, monitor.senha);
        if (!isMatch) return res.status(401).json({ message: "Credenciais inválidas." });
        
        const payload = { id: monitor._id, nome: monitor.nome, role: monitor.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
        
        res.status(200).json({ token, user: payload });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
};

module.exports = {
    loginGestao,
    loginMonitor
};