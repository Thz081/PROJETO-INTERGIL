const test = require('node:test');
const assert = require('node:assert/strict');
const { ficha, validar, fim } = require('../src/edicao/regras');
const { modalidades, salas } = require('../src/edicao/catalogo');
const aluno = { turma: '1° A ADM', sexo: 'M' };
const escolhas = ficha(modalidades, aluno);
test('as quatro opções de imaginação e os formatos de basquete e Free Fire ocupam três modalidades', () => {
  assert.equal(validar(escolhas, ['127-0','127-1','127-2','127-3','107-0','107-1','125-0','125-1']).total, 3);
});
test('futsal, quadrado e futmesa ocupam três vagas no limite anual', () => {
  assert.equal(validar(escolhas, ['101-0','102-0','103-0']).total, 3);
  assert.throws(() => validar(escolhas, ['101-0','102-0','103-0','117-0']));
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
