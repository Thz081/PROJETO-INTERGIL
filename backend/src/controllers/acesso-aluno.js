const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Aluno = require('../models/aluno.model');
const emailNormal = valor => typeof valor === 'string' ? valor.trim().toLowerCase() : '';

function sessao(aluno) {
  const user = { id: aluno.id, nome: aluno.nome, n_inscricao: aluno.n_inscricao, sexo: aluno.sexo,
    turma: aluno.turma, role: 'aluno', versaoAcesso: aluno.versaoAcesso || 0 };
  return { user, token: jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' }) };
}
async function verificar(req, res) {
  const { n_inscricao, data_nascimento } = req.body;
  if (typeof n_inscricao !== 'string' || typeof data_nascimento !== 'string') return res.sendStatus(400);
  const aluno = await Aluno.findOne({ n_inscricao: n_inscricao.trim(), data_nascimento, ativo: { $ne: false } }).select('+senhaHash');
  if (!aluno) return res.status(401).json({ message: 'Confira a matrícula e a data de nascimento.' });
  if (aluno.senhaHash) return res.status(409).json({ message: 'Primeiro acesso já concluído. Entre com sua senha.' });
  const comprovante = jwt.sign({ id: aluno.id, versao: aluno.versaoAcesso || 0 }, process.env.JWT_SECRET,
    { audience: 'primeiro-acesso', expiresIn: '10m' });
  res.json({ comprovante });
}
async function ativar(req, res) {
  const { comprovante, senha } = req.body;
  const email = emailNormal(req.body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return res.status(400).json({ message: 'Informe um e-mail válido.' });
  if (typeof senha !== 'string' || [...senha].length < 6 || Buffer.byteLength(senha) > 72)
    return res.status(400).json({ message: 'A senha precisa ter pelo menos 6 caracteres e até 72 bytes.' });
  let dados;
  try { dados = jwt.verify(comprovante, process.env.JWT_SECRET, { audience: 'primeiro-acesso' }); }
  catch { return res.status(401).json({ message: 'Validação expirada. Confirme a matrícula novamente.' }); }
  try {
    const aluno = await Aluno.findOneAndUpdate({ _id: dados.id, senhaHash: null, ativo: { $ne: false },
      versaoAcesso: dados.versao }, { $set: { email, senhaHash: await bcrypt.hash(senha,12) } }, { new: true });
    if (!aluno) return res.status(409).json({ message: 'Primeiro acesso indisponível. Volte para entrar.' });
    res.status(201).json(sessao(aluno));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    throw err;
  }
}
async function loginAluno(req,res) {
  const login = emailNormal(req.body.login);
  const { senha } = req.body;
  if (!login || typeof senha !== 'string' || Buffer.byteLength(senha) > 72) return res.status(400).json({ message: 'Informe e-mail ou matrícula e senha.' });
  const aluno = await Aluno.findOne({ [login.includes('@') ? 'email' : 'n_inscricao']: login, ativo: { $ne: false } }).select('+senhaHash');
  if (!aluno?.senhaHash || !await bcrypt.compare(senha, aluno.senhaHash))
    return res.status(401).json({ message: 'Confira o login e a senha. Para cadastrar sua senha, use Primeiro acesso.' });
  res.json(sessao(aluno));
}
module.exports = { verificar, ativar, loginAluno };
