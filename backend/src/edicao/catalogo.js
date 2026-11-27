// IDs e posições das opções são persistidos nas inscrições desta edição.
const opcao = (nome, max_inscritos = null, genero = 'X') => ({ nome, max_inscritos, genero });
const porSexo = (vagas, prefixo = '') => [
  opcao(prefixo + 'Masculino', vagas, 'M'), opcao(prefixo + 'Feminino', vagas, 'F')
];
const turma = (ano, letra, curso) => `${ano}° ${letra} ${curso}`;
const nomes = ['Wardens', 'Zenith', 'Olympus', 'Ragnarok', 'Spartta', 'Electra',
  'Arcânia', 'Valhalla', 'Midgard', 'Atlantis', 'Monarcas', 'Ardharia'];
const salas = nomes.map((nome, i) => ({
  nome, turma: turma(1 + Math.floor(i / 4), i % 2 ? 'B' : 'A', i % 4 < 2 ? 'ADM' : 'DS'),
  logo_url: '/images/turmas/' + nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() + '.png', pontos: 0
}));

const quadra = 'Esportes de quadra';
const tabuleiro = 'Jogos de tabuleiro';
const digitais = 'Jogos digitais';
const freeFireMapaAberto = { ...opcao('Mapa aberto', 5), isPrincipal: true };
function modalidade(_id, nome, slug, categoria, submodalidades, maxEscolhas = 1) {
  const imagem = '/images/gravuras/' + slug + '.webp';
  return { _id, nome, slug, categoria, submodalidades, maxEscolhas, max_inscritos: null,
    imgCarrossel: imagem, imgDetalhe: `/images/gravuras/banners/${slug}.webp` };
}
const modalidades = [
  modalidade(101, 'Futsal', 'futsal', quadra, porSexo(8)),
  modalidade(102, 'Quadrado', 'quadrado', quadra, porSexo(2)),
  modalidade(103, 'Futmesa', 'futmesa', quadra, [opcao('Individual', 2), ...porSexo(2, 'Dupla · ')], 2),
  modalidade(104, 'Vôlei', 'volei', quadra, porSexo(10)),
  modalidade(105, 'Vôleimesa', 'voleimesa', quadra, porSexo(4)),
  modalidade(106, 'Vôlei quase de praia', 'volei-quase-de-praia', quadra, porSexo(4)),
  modalidade(107, 'Basquete', 'basquete', quadra, [opcao('5×5 masculino', 8, 'M'), ...porSexo(4, '3×3 · '), opcao('5×5 feminino', 8, 'F')], 2),
  modalidade(108, 'Queimado', 'queimado', quadra, [opcao('Misto', 12)]),
  modalidade(109, 'Ping-pong', 'ping-pong', 'Esportes de oposição', porSexo(2)),
  modalidade(110, 'Badminton', 'badminton', 'Esportes de oposição', porSexo(4)),
  modalidade(111, 'Bocha', 'bocha', 'Esportes de precisão', [opcao('Individual', 2)]),
  modalidade(112, 'Corrida', 'corrida', 'Atletismo', [...porSexo(2, '100 m · '), ...porSexo(2, '200 m · '),
    ...porSexo(4, 'Revezamento 800 m · ')], 3),
  modalidade(113, 'Arremesso de peso', 'arremesso-de-peso', 'Esportes de marca', porSexo(null)),
  modalidade(114, 'Calistenia', 'calistenia', 'Ginástica', porSexo(null)),
  modalidade(115, 'Kata', 'kata', 'Lutas', ['Karatê', 'Judô', 'Taekwondo'].map(n => opcao(n))),
  modalidade(116, 'UNO', 'uno', tabuleiro, [opcao('Individual', 4)]),
  modalidade(117, 'Dama', 'dama', tabuleiro, [opcao('Individual')]),
  modalidade(118, 'Dominó', 'domino', tabuleiro, [opcao('Dupla', 2)]),
  modalidade(119, 'Xadrez', 'xadrez', tabuleiro, [opcao('Iniciante'), opcao('Intermediário')]),
  modalidade(120, 'Cubo mágico', 'cubo-magico', 'Jogos matemáticos', [opcao('3×3 · nível definido no dia')]),
  modalidade(121, 'Sudoku', 'sudoku', 'Jogos matemáticos', [opcao('Individual')]),
  modalidade(122, 'Just Dance', 'just-dance', digitais, [opcao('Individual', 5)]),
  modalidade(123, 'Street Fight', 'street-fight', digitais, [opcao('Individual', 2)]),
  modalidade(124, 'Mobile Legends: Bang Bang', 'mobile-legends', digitais, [opcao('Equipe', 5)]),
  modalidade(125, 'Free Fire', 'free-fire', digitais, [opcao('4×4', 4), opcao('X1', 1), freeFireMapaAberto], 3),
  modalidade(126, 'FIFA', 'fifa', digitais, [opcao('X1', 2), opcao('X2', 2)], 2),
  modalidade(127, 'RPG', 'rpg', 'Jogos de imaginação', ['RPG de mesa', 'Card Game', 'Cosplay', 'PVP'].map(n => opcao(n)), 4)
];
const categoriasModalidades = [...new Set(modalidades.map(modalidade => modalidade.categoria)), 'Outras modalidades'];
module.exports = { modalidades, salas, categoriasModalidades, freeFireMapaAberto };
