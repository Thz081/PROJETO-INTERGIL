const fim = '2026-12-02T00:00:00-03:00';

const chaveTurma = nome => String(nome || '').toUpperCase().replace(/[^1-3ABDSM]/g, '');
function opcoesDaModalidade(mod, aluno) {
  const opcoes = mod.submodalidades.length ? mod.submodalidades : [null];
  return opcoes.flatMap((sub, indice) => {
    if (sub && (sub.inscricao === false || (sub.genero && sub.genero !== 'X' && sub.genero !== aluno.sexo))) return [];
    const codigo = sub ? `${mod._id}-${indice}` : String(mod._id);
    return [{ codigo, grupo: mod.slug, nome: sub?.nome || mod.nome, limite: sub?.max_inscritos ?? mod.max_inscritos ?? null }];
  });
}
function ficha(mods, aluno) {
  const terceiro = /^3/.test(aluno.turma?.trim());
  const creditos = Object.entries(aluno.preGil || {}).filter(([slug, valor]) =>
    ['futsal','volei','basquete'].includes(slug) && Number(valor) > 0).map(([slug]) => slug);
  return {
    fim, creditos, minimo: terceiro ? 3 : 2, maximo: terceiro ? 4 : 3,
    modalidades: mods.map(mod => ({
      nome: mod.nome, slug: mod.slug, categoria: mod.categoria || 'Outras modalidades',
      maxEscolhas: mod.maxEscolhas || 1,
      opcoes: opcoesDaModalidade(mod, aluno)
    })).filter(mod => mod.opcoes.length)
  };
}
function recusar(message) { throw Object.assign(new Error(message), { status: 400 }); }
function validar(ficha, codigos) {
  if (!Array.isArray(codigos) || !codigos.length || codigos.length !== new Set(codigos).size)
    recusar('Selecione opções válidas, sem repetir.');
  const grupos = new Set(ficha.creditos);
  const escolhas = [];
  for (const mod of ficha.modalidades) {
    const itens = mod.opcoes.filter(op => codigos.includes(op.codigo));
    if (itens.length > mod.maxEscolhas) recusar(`Confira o limite de escolhas em ${mod.nome}.`);
    for (const op of itens) {
      grupos.add(op.grupo);
      escolhas.push({ ...op, slug: mod.slug });
    }
  }
  if (escolhas.length !== codigos.length) recusar('Uma das opções não está disponível para este aluno.');
  if (grupos.size < ficha.minimo || grupos.size > ficha.maximo)
    recusar(`Escolha de ${ficha.minimo} a ${ficha.maximo} modalidades.`);
  return { escolhas, total: grupos.size };
}
module.exports = { fim, ficha, validar, recusar, chaveTurma };
