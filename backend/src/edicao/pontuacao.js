const { chaveTurma } = require('./regras');

const pontosPorLugar = [500, 300, 100];
const chaveGeral = 'geral';
const vencedorasTaca = new Set(['1ADS', '3ADS', '2BDS']);
const semCamisa = new Set(['3ADS', '2BDS']);

function formatosDePodio(modalidade) {
  const opcoes = modalidade.submodalidades || [];
  if (opcoes.length < 2) return [{ chave: chaveGeral, nome: 'Geral' }];
  return opcoes.map(({ nome, isPrincipal }) => ({ chave: nome, nome, principal: isPrincipal === true }))
    .sort((a, b) => Number(b.principal) - Number(a.principal));
}

function movimentosIniciais(sala) {
  const turma = chaveTurma(sala.turma);
  const movimentos = [];
  if (sala.pontos) movimentos.push({ motivo: 'Saldo anterior ao registro de motivos', pontos: sala.pontos });
  if (vencedorasTaca.has(turma)) movimentos.push({ motivo: 'Taça das Casas 2026.2', pontos: 500 });
  if (!semCamisa.has(turma)) movimentos.push({ motivo: 'Entrega da camisa do Intergil', pontos: 300 });
  if (turma === '3BDS') movimentos.push({ motivo: 'Evento de vôlei', pontos: 500 });
  return movimentos;
}

module.exports = { pontosPorLugar, formatosDePodio, chaveGeral, movimentosIniciais };
