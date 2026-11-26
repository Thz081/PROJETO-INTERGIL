const test = require('node:test');
const assert = require('node:assert/strict');
const { ficha, validar, fim } = require('../src/edicao/regras');
const { modalidades, salas } = require('../src/edicao/catalogo');
const { formatosDePodio, movimentosIniciais } = require('../src/edicao/pontuacao');
const aluno = { turma: '1° A ADM', sexo: 'M' };
const escolhas = ficha(modalidades, aluno);
test('as quatro opções de imaginação e os formatos de basquete e Free Fire ocupam três modalidades', () => {
  assert.equal(validar(escolhas, ['127-0','127-1','127-2','127-3','107-0','107-1','125-0','125-1']).total, 3);
});
test('futsal, quadrado e futmesa ocupam três vagas no limite anual', () => {
  assert.equal(validar(escolhas, ['101-0','102-0','103-0']).total, 3);
  assert.throws(() => validar(escolhas, ['101-0','102-0','103-0','117-0']));
});
test('FIFA oferece duas vagas para o X1 e duas para a dupla, com contagem única', () => {
  const fifa = escolhas.modalidades.find(mod => mod.slug === 'fifa');
  assert.deepEqual(fifa.opcoes.map(opcao => [opcao.nome, opcao.limite]), [['X1', 2], ['X2', 2]]);
  assert.equal(validar(escolhas, ['126-0', '126-1', '117-0']).total, 2);
});
test('Free Fire mostra Mapa aberto primeiro e aceita os três formatos com contagem única', () => {
  const freeFire = escolhas.modalidades.find(mod => mod.slug === 'free-fire');
  assert.deepEqual(freeFire.opcoes.map(opcao => [opcao.codigo, opcao.limite]), [['125-2',5],['125-0',4],['125-1',1]]);
  assert.equal(freeFire.opcoes[0].principal,true);
  assert.equal(validar(escolhas, ['125-0','125-1','125-2','117-0']).total, 2);
  assert.equal(formatosDePodio(modalidades.find(mod => mod.slug === 'free-fire'))[0].nome, 'Mapa aberto');
});
test('bônus iniciais identificam a origem dos pontos de todas as salas oficiais', () => {
  const saldos = Object.fromEntries(salas.map(sala => [sala.nome, movimentosIniciais(sala).reduce((soma,m) => soma+m.pontos,0)]));
  assert.deepEqual([saldos.Olympus,saldos.Ardharia,saldos.Monarcas,saldos.Valhalla],[800,800,500,500]);
  assert.equal(Object.values(saldos).filter(pontos => pontos === 300).length,8);
  assert.equal(Object.values(saldos).reduce((soma,pontos) => soma+pontos,0),5000);
});
test('sexo, exclusividade do kata, códigos duplicados e mínimo do terceiro ano', () => {
  for (const lista of [['101-1','117-0'],['115-0','115-1','117-0'],['117-0','117-0'],['116','117-0']])
    assert.throws(() => validar(escolhas, lista));
  assert.throws(() => validar(ficha(modalidades, { ...aluno, turma:'3° B DS' }), ['117-0','116-0']));
});
test('corridas juntas, modalidades livres e limite do UNO', () => {
  assert.equal(validar(escolhas,['112-0','112-2','112-4','113-0','114-0']).total,3);
  const op = slug => escolhas.modalidades.find(m => m.slug === slug).opcoes[0];
  assert.equal(op('dama').limite,null);
  assert.equal(op('uno').limite,4);
});
test('turmas únicas e encerramento à meia-noite em Pernambuco', () => {
  assert.equal(new Set(salas.map(s => s.turma)).size,12);
  assert.equal(new Set(salas.map(s => s.logo_url)).size,12);
  assert.equal(new Date(fim).toISOString(), '2026-12-02T03:00:00.000Z');
});
