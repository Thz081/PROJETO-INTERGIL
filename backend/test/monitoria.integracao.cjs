const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Aluno = require('/app/src/models/aluno.model');
const Monitor = require('/app/src/models/monitor.model');

const matricula = '99001001';
const senha = 'senha-sintetica-monitoria';
const turma = '1° A DS';
const nome = 'Aluno sintético da monitoria';

async function chamar(caminho, metodo = 'GET', corpo, token) {
  const resposta = await fetch('http://127.0.0.1:3001/api' + caminho, {
    method: metodo,
    headers: { ...(corpo && { 'Content-Type': 'application/json' }), ...(token && { Authorization: 'Bearer ' + token }) },
    body: corpo && JSON.stringify(corpo)
  });
  return { status: resposta.status, dados: await resposta.json() };
}

async function testar() {
  assert.match(process.env.MONGO_URI || '', /^mongodb:\/\/mongo:27017\/intergil2026\?/);
  await mongoose.connect(process.env.MONGO_URI);
  assert.equal(await Aluno.countDocuments(), 0, 'Execute em um Compose isolado com banco novo.');
  const aluno = await Aluno.create({ nome, turma, n_inscricao: matricula, sexo: 'M', data_nascimento: '01/01/2010' });
  const fora = await Monitor.create({ nome: 'Monitor externo sintético', matricula: '99001002',
    senha: await bcrypt.hash(senha, 4), modalidadesIds: [107] });
  const vinculo = [{ matricula, turma, nome, modalidades: [
    { slug: 'mobile-legends' }, { slug: 'basquete', formatos: ['3×3 · Masculino', '3×3 · Feminino'] }
  ] }];
  const vincular = (fichas, ...opcoes) => execFileSync(process.execPath, ['src/edicao/vincular-monitores.js', ...opcoes], {
    input: JSON.stringify(fichas), stdio: ['pipe', 'pipe', 'pipe']
  });
  assert.throws(() => vincular([{ ...vinculo[0], turma: '1° B DS' }], '--aplicar'), /mesmo aluno ativo/);
  vincular(vinculo);
  assert.equal(await Monitor.exists({ matricula }), null);
  vincular(vinculo, '--aplicar');
  vincular(vinculo, '--aplicar');
  assert.equal(await Monitor.countDocuments({ matricula }), 1);
  assert.equal((await Monitor.findOne({ matricula }).lean()).senha, undefined);

  const entrarMonitor = (usuario = matricula, credencial = senha) =>
    chamar('/auth/login-monitor', 'POST', { matricula: usuario, senha: credencial });
  assert.equal((await entrarMonitor()).status, 401);
  const verificar = await chamar('/auth/primeiro-acesso/verificar', 'POST', { n_inscricao: matricula, data_nascimento: '01/01/2010' });
  assert.equal(verificar.status, 200);
  assert.equal((await chamar('/auth/primeiro-acesso/ativar', 'POST', {
    comprovante: verificar.dados.comprovante, email: 'monitor@example.test', senha
  })).status, 201);
  const sessaoAluno = await chamar('/auth/login', 'POST', { login: matricula, senha });
  assert.equal(sessaoAluno.status, 200);
  assert.equal((await chamar('/monitor/horarios', 'GET', undefined, sessaoAluno.dados.token)).status, 403);
  assert.equal((await entrarMonitor(matricula, 'outra-senha')).status, 401);
  const acesso = await entrarMonitor();
  assert.equal(acesso.status, 200);
  const token = acesso.dados.token;
  const documentos = await chamar('/monitor/modalidades-para-links', 'GET', undefined, token);
  assert.deepEqual(documentos.dados.map(item => item._id), [107, 124]);
  const basquete = documentos.dados[0];
  assert.equal(basquete.permiteGeral, false);
  assert.deepEqual(basquete.submodalidades.map(item => item.nome), ['3×3 · Masculino', '3×3 · Feminino']);
  const horario = { modId: 107, data: '03/12/2026', horario: '15h', local: 'Quadra de teste' };
  const externo = await entrarMonitor(fora.matricula);
  assert.equal(externo.status, 200);
  const geral = await chamar('/monitor/horarios', 'POST', { ...horario, categoria: 'Geral' }, externo.dados.token);
  assert.equal(geral.status, 201);
  const horarioGeral = geral.dados.horarios.find(item => item.local === horario.local)._id;
  assert.equal((await chamar('/monitor/horarios/107/' + horarioGeral, 'DELETE', undefined, token)).status, 404);
  assert.equal((await chamar('/monitor/horarios', 'POST', { ...horario, categoria: 'Geral' }, token)).status, 403);
  const formato = await chamar('/monitor/horarios', 'POST', { ...horario, categoria: '3×3 · Masculino' }, token);
  assert.equal(formato.status, 201);
  const horarioFormato = formato.dados.horarios.find(item => item.local === horario.local)._id;
  assert.equal((await chamar('/monitor/horarios/107/' + horarioFormato, 'PUT', {
    ...horario, categoria: '3×3 · Feminino'
  }, token)).status, 200);
  assert.equal((await chamar('/monitor/horarios/107/' + horarioFormato, 'DELETE', undefined, token)).status, 200);
  for (const [modId, subNome, esperado] of [[107, 'Geral', 403], [107, '5×5 masculino', 403],
    [107, '3×3 · Feminino', 200], [124, 'Geral', 200], [101, 'Geral', 403]]) {
    assert.equal((await chamar('/monitor/links', 'POST', {
      modId, subNome, tipoLink: 'edital', url: 'https://example.test/edital.pdf'
    }, token)).status, esperado);
  }
  await Aluno.updateOne({ _id: aluno._id }, { $inc: { versaoAcesso: 1 } });
  assert.equal((await chamar('/monitor/horarios', 'GET', undefined, token)).status, 401);
  assert.equal((await entrarMonitor()).status, 200);
  await Aluno.updateOne({ _id: aluno._id }, { $set: { ativo: false } });
  assert.equal((await entrarMonitor()).status, 401);
  console.log('Vínculo por turma, primeiro acesso, senha compartilhada, monitor externo e limites de modalidade e formato conferidos.');
}

testar().catch(erro => { console.error(erro); process.exitCode = 1; }).finally(() => mongoose.disconnect());
