const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Gestao = require('/app/src/models/gestao.model');

let token;
async function chamar(url, metodo = 'GET', dados, protegido = false) {
  const resposta = await fetch('http://127.0.0.1:3001/api' + url, { method: metodo,
    headers: { ...(protegido && { Authorization: 'Bearer ' + token }), ...(dados && { 'Content-Type': 'application/json' }) },
    body: dados && JSON.stringify(dados) });
  return [resposta.status, await resposta.json()];
}

async function testar() {
  assert.match(process.env.MONGO_URI || '', /^mongodb:\/\/mongo:27017\/intergil2026\?/);
  await mongoose.connect(process.env.MONGO_URI);
  const [, inicial] = await chamar('/ranking/salas');
  assert.equal(inicial.reduce((pontos,sala) => pontos+sala.pontos,0), 5000, 'Use uma base de homologação recém-criada.');
  const porNome = Object.fromEntries(inicial.map(sala => [sala.nome, sala]));
  const { Olympus, Monarcas, Valhalla, Ardharia } = porNome;
  assert.deepEqual([Olympus.pontos, Monarcas.pontos, Valhalla.pontos, Ardharia.pontos],[800,500,500,800]);
  const caminho = '/ranking/salas/' + Olympus._id;
  const extrato = async () => (await chamar(caminho))[1];
  assert.deepEqual(new Set((await extrato()).movimentos.map(item => item.motivo)), new Set(['Taça das Casas 2026.2','Entrega da camisa do Intergil']));
  assert.equal((await chamar('/admin/pontuacao'))[0],401);

  const senha = 'pontuacao-ficticia-teste';
  const nome = 'Gestão teste de pontuação';
  await Gestao.create({ nome, senha: await bcrypt.hash(senha,4), role: 'gestao' });
  const [login, sessao] = await chamar('/auth/login-gestao', 'POST', { nome, senha });
  assert.equal(login,200);
  token = sessao.token;
  const salvar = (posicoes, versao, formato = 'Feminino') =>
    chamar('/admin/pontuacao/podios/101','PUT',{formato,posicoes,versao},true);
  const vencedor = [Olympus._id, Monarcas._id, Valhalla._id];
  assert.equal((await salvar([Olympus._id, Olympus._id, null],0))[0],400);
  assert.equal((await salvar(vencedor,0,'Qualquer'))[0],400);
  const [salvo,pontos] = await salvar(vencedor,0);
  assert.equal(salvo,200);
  assert.equal(pontos.salas.find(sala => sala._id === Olympus._id).pontos,1300);
  assert.equal((await salvar(vencedor,0))[0],200);
  assert.equal((await extrato()).sala.pontos,1300);
  assert.equal((await salvar([Ardharia._id, Monarcas._id, Valhalla._id],0))[0],409);
  assert.equal((await salvar([Monarcas._id, Olympus._id, null],1))[0],200);
  assert.equal((await extrato()).sala.pontos,1100);
  const [,resultados] = await chamar('/resultados/modalidades');
  const futsal = resultados.modalidades.find(mod => mod.slug === 'futsal');
  assert.equal(futsal.formatos.find(op => op.chave === 'Feminino').posicoes[1].nome,'Olympus');
  assert(futsal.formatos.find(op => op.chave === 'Masculino').posicoes.every(p => p === null));
  assert.equal(futsal.formatos.find(op => op.chave === 'Feminino').posicoes[1].pontos,undefined);
  assert.deepEqual(resultados.modalidades.find(mod => mod.slug === 'free-fire').formatos.map(op => op.nome),['Mapa aberto','4×4','X1']);

  const ajustar = (pontos, motivo, operacao) => chamar('/admin/pontos','PUT',{salaId:Olympus._id,pontos,motivo,operacao},true);
  assert.equal((await ajustar(-50,'   '))[0],400);
  assert.equal((await ajustar(50))[0],400);
  assert.equal((await ajustar(-50,'Desconto de homologação','desconto-sintetico'))[0],200);
  assert.equal((await ajustar(-50,'Desconto de homologação','desconto-sintetico'))[0],200);
  const detalhado = await extrato();
  assert.deepEqual([detalhado.adicionados,detalhado.descontados,detalhado.sala.pontos],[1100,50,1050]);
  assert(detalhado.movimentos.some(item => item.motivo === 'Desconto de homologação'));

  assert.equal((await chamar('/admin/config','PUT',{rankingVisivel:false},true))[0],200);
  assert.equal((await chamar('/ranking/salas'))[0],404);
  assert.equal((await chamar(caminho))[0],404);
  assert.equal((await chamar('/resultados/modalidades'))[0],200);
  assert.equal((await chamar('/admin/pontuacao','GET',undefined,true))[0],200);
  assert.equal((await chamar('/admin/config','PUT',{rankingVisivel:true},true))[0],200);
  assert.equal((await extrato()).sala.pontos,1050);
  assert.equal((await chamar('/admin/config', 'PUT', { manutencao: true }))[0], 401);
  assert.equal((await chamar('/admin/config', 'PUT', { manutencao: 'sim' }, true))[0], 400);
  assert.equal((await chamar('/config'))[1].manutencao, false);
  assert.equal((await chamar('/admin/config', 'PUT', { manutencao: true }, true))[0], 200);
  try {
    assert.equal((await chamar('/config'))[1].manutencao, true);
    assert.equal((await chamar('/auth/login-gestao', 'POST', { nome, senha }))[0], 200);
    assert.equal((await chamar('/auth/login-monitor', 'POST', {}))[0], 503);
    assert.equal((await chamar('/inscricoes', 'POST', {}))[0], 503);
    assert.equal((await chamar('/modalidades'))[0], 503);
    assert.equal((await chamar('/modalidades', 'GET', undefined, true))[0], 200);
    assert.equal((await chamar('/admin/pontuacao', 'GET', undefined, true))[0], 200);
  } finally { assert.equal((await chamar('/admin/config', 'PUT', { manutencao: false }, true))[0], 200); }
  assert.equal((await chamar('/config'))[1].manutencao, false);
  assert.equal((await chamar('/modalidades'))[0], 200);
  console.log('Bônus iniciais, pódios por formato, correções, versão concorrente, motivos e ocultação conferidos.');
}

testar().catch(erro => { console.error(erro); process.exitCode = 1; }).finally(() => mongoose.disconnect());
