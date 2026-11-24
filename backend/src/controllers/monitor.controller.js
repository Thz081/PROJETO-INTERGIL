// Arquivo: InterDoZero/src/controllers/monitor.controller.js
// VERSÃO 3.0 - 100% COMPLETO (COM 'require' E TODAS AS 5 FUNÇÕES)

const Modalidade = require('../models/modalidade.model.js');
const LogAcao = require('../models/logAcao.model.js');
const mongoose = require('mongoose'); 

// --- FUNÇÃO HELPER (A mesma do Admin, para os Logs) ---
const getAutorLog = (req) => {
  const nomeAutor = req.user.nome || 'Usuário Desconhecido';
  const roleAutor = req.user.role || 'desconhecido';
  
  let roleFormatada = '';
  if (roleAutor === 'gestao') roleFormatada = 'Gestão';
  else if (roleAutor === 'monitor') roleFormatada = 'Monitor';
  else roleFormatada = roleAutor.charAt(0).toUpperCase() + roleAutor.slice(1);
  
  return `${roleFormatada}: ${nomeAutor}`;
};

// ===================================
// === 1. CONTROLLER DE HORÁRIOS (GET) ===
// ===================================
const getHorarios = async (req, res) => {
  try {
    // Busca 'submodalidades' também (para o dropdown cascata)
    const modalidades = await Modalidade.find().select('nome horarios submodalidades');
    res.status(200).json(modalidades);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar horários.', error: error.message });
  }
};

// ===================================
// === 2. CONTROLLER DE HORÁRIOS (POST) ===
// ===================================
const addHorario = async (req, res) => {
  try {
    // 'categoria' agora é o NOME (ex: "5x5 (Masculino)")
    const { modId, categoria, data, horario, local } = req.body;
    if (!modId || !categoria || !data || !horario || !local) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    const modalidade = await Modalidade.findById(modId);
    if (!modalidade) {
      return res.status(404).json({ message: 'Modalidade não encontrada.' });
    }
    const novoHorario = {
      _id: new mongoose.Types.ObjectId(),
      categoria, data, horario, local
    };
    modalidade.horarios.push(novoHorario);
    await modalidade.save();
    
    await LogAcao.create({
        autor: getAutorLog(req),
        acao: `Adicionou horário [${categoria}] na modalidade [${modalidade.nome}]`
    });
    res.status(201).json(modalidade);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar horário.', error: error.message });
  }
};

// ===================================
// === 3. CONTROLLER DE HORÁRIOS (DELETE) ===
// ===================================
const editarHorario = async (req, res) => {
  const { categoria, data, horario, local } = req.body;
  if (![categoria,data,horario,local].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ message: 'Preencha os dados do horário.' });
  const atualizado = await Modalidade.findOneAndUpdate({ _id: req.params.modId, 'horarios._id': req.params.horarioId },
    { $set: { 'horarios.$.categoria': categoria, 'horarios.$.data': data, 'horarios.$.horario': horario, 'horarios.$.local': local } }, { new: true });
  if (!atualizado) return res.sendStatus(404);
  await LogAcao.create({ autor: getAutorLog(req), acao: 'Editou horário de ' + atualizado.nome });
  res.json(atualizado);
};

const deleteHorario = async (req, res) => {
  try {
    const { modId, horarioId } = req.params;
    const modalidade = await Modalidade.findById(modId);
    if (!modalidade) {
      return res.status(404).json({ message: 'Modalidade não encontrada.' });
    }
    const horario = modalidade.horarios.find(h => h._id.toString() === horarioId);
    const categoriaLog = horario ? horario.categoria : 'horário desconhecido';

    modalidade.horarios.pull({ _id: horarioId });
    await modalidade.save();

    await LogAcao.create({
        autor: getAutorLog(req),
        acao: `Apagou horário [${categoriaLog}] da modalidade [${modalidade.nome}]`
    });
    res.status(200).json({ message: 'Horário apagado com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao apagar horário.', error: error.message });
  }
};

// ===================================
// === 4. CONTROLLER DE LINKS (GET) ===
// (A que estava faltando)
// ===================================
const getModalidadesParaLinks = async (req, res) => {
  try {
    const modalidades = await Modalidade.find().select('nome submodalidades');
    res.status(200).json(modalidades);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar modalidades.', error: error.message });
  }
};

// ===================================
// === 5. CONTROLLER DE LINKS (POST/UPDATE) ===
// (A que estava faltando)
// ===================================
async function gravarLink(req, res, tipo, url) {
  const { modId, subNome = 'Geral' } = req.body;
  const modalidade = await Modalidade.findById(modId);
  if (!modalidade) return res.status(404).json({ message: 'Modalidade não encontrada.' });
  if (!['edital', 'chaveamento'].includes(tipo)) return res.sendStatus(400);
  if (subNome === 'Geral') modalidade[tipo === 'edital' ? 'linkEdital' : 'linkChaveamento'] = url;
  else {
    const opcao = modalidade.submodalidades.find(s => s.nome === subNome);
    if (!opcao) return res.status(404).json({ message: 'Opção não encontrada.' });
    opcao[tipo] = url;
  }
  await modalidade.save();
  await LogAcao.create({ autor: getAutorLog(req), acao: `Atualizou ${tipo} de ${modalidade.nome} · ${subNome}` });
  res.json({ modalidade });
}
async function updateLink(req,res) {
  const url = req.body.url || '#';
  if (url !== '#' && !/^https?:\/\//i.test(url)) return res.status(400).json({ message: 'Informe um link HTTP ou HTTPS.' });
  return gravarLink(req,res,req.body.tipoLink,url);
}
async function uploadEdital(req,res) {
  if (!req.file) return res.status(400).json({ message: 'Selecione um PDF.' });
  return gravarLink(req,res,'edital','/arquivos/' + req.file.filename);
}

// === EXPORTA TUDO (TODAS AS 5) ===
module.exports = {
  getHorarios,
  addHorario,
  deleteHorario,
  editarHorario,
  getModalidadesParaLinks,
  updateLink,
  uploadEdital
};