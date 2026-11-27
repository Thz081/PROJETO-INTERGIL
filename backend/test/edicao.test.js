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
test('Futmesa aceita individual e dupla visível ao aluno e contabiliza duas modalidades', () => {
  assert.equal(validar(escolhas, ['103-0', '103-1']).total, 2);
  assert.throws(() => validar(escolhas, ['103-0', '103-2']));
  const feminina = ficha(modalidades, { ...aluno, sexo: 'F' });
  assert.equal(validar(feminina, ['103-0', '103-2', '116-0']).total, 3);
  assert.throws(() => validar(feminina, ['103-0', '103-2', '116-0', '117-0']));
  assert.deepEqual(feminina.modalidades.find(mod => mod.slug === 'basquete').opcoes.map(op => op.codigo),
    ['107-2', '107-3']);
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
test('os 27 esportes e jogos oferecem as combinações previstas ao primeiro e ao terceiro ano', () => {
  const juntas = { basquete: 2, 'free-fire': 3, fifa: 2, rpg: 4 };
  const exclusivas = new Set(['kata', 'xadrez']);
  const combinacoes = { ...juntas, corrida: 3, futmesa: 2, kata: 3, xadrez: 2 };
  assert.equal(modalidades.length, 27);
  for (const sexo of ['F', 'M']) {
    for (const turma of ['1° A ADM', '3° B DS']) {
      const opcoes = ficha(modalidades, { sexo, turma });
      assert.equal(opcoes.modalidades.length, 27);
      for (const mod of opcoes.modalidades) {
        assert.equal(mod.opcoes.length, combinacoes[mod.slug] || 1, mod.slug);
        const outros = ['116-0', '117-0', '121-0'].filter(codigo => !mod.opcoes.some(op => op.codigo === codigo));
        const testarOP = codigos => {
          const total = ['futmesa', 'corrida'].includes(mod.slug) ? codigos.length : 1;
          const complemento = outros.slice(0, Math.max(0, opcoes.minimo - total));
          assert.equal(validar(opcoes, [...codigos, ...complemento]).total, Math.max(opcoes.minimo, total), mod.slug);
        };
        for (const opcao of mod.opcoes) testarOP([opcao.codigo]);
        if (mod.opcoes.length > 1) {
          const todos = mod.opcoes.map(opcao => opcao.codigo);
          if (exclusivas.has(mod.slug)) assert.throws(() => validar(opcoes, todos), /limite de escolhas/);
          else testarOP(todos);
        }
      }
    }
  }
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
test('100 m, 200 m e revezamento contam como três provas distintas', () => {
  assert.equal(validar(escolhas, ['112-0','112-2','112-4']).total, 3);
  assert.throws(() => validar(escolhas, ['112-0','112-2','112-4','113-0']), /Escolha de 2 a 3/);
  const terceira = ficha(modalidades, { turma: '3° A ADM', sexo: 'F' });
  assert.equal(validar(terceira, ['112-1','112-3','112-5']).total, 3);
  assert.equal(validar(terceira, ['112-1','112-3','112-5','114-1']).total, 4);
  assert.throws(() => validar(terceira, ['112-0','112-3','112-5']), /não está disponível/);
});
test('modalidades livres e limite do UNO', () => {
  const op = slug => escolhas.modalidades.find(m => m.slug === slug).opcoes[0];
  assert.equal(op('dama').limite,null);
  assert.equal(op('uno').limite,4);
});
test('turmas únicas e encerramento à meia-noite em Pernambuco', () => {
  assert.equal(new Set(salas.map(s => s.turma)).size,12);
  assert.equal(new Set(salas.map(s => s.logo_url)).size,12);
  assert.equal(new Date(fim).toISOString(), '2026-12-03T03:00:00.000Z');
});
