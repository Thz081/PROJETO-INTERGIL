export const normalizar = texto => String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const turmaDe = aluno => aluno.turma?.replace(/[ºª]/g, '°').trim().replace(/\s+/g, ' ') || 'Sem turma';

const ordenacao = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const dataLocal = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza' });
const cabecalhoGeral = ['Turma', 'Aluno', 'Matrícula', 'Situação', 'Modalidades', 'Total de modalidades', 'Data'];
const cabecalhoMonitoria = ['Turma', 'Aluno', 'Modalidade', 'Formato'];

const codigosDoAluno = aluno => [...new Set((aluno.inscricao?.modalidades || []).map(String))];
const slugArquivo = texto => normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function prepararCatalogo(modalidades) {
  const porCodigo = new Map();
  const lista = modalidades.map(mod => {
    const id = String(mod._id);
    porCodigo.set(id, { codigo: id, modalidadeId: id, modalidade: mod.nome });
    const formatos = (mod.submodalidades || []).map((opcao, indice) => {
      const codigo = id + '-' + indice;
      const formato = opcao.nome;
      porCodigo.set(codigo, { codigo, modalidadeId: id, modalidade: mod.nome, formato });
      return { codigo, formato };
    });
    return { id, nome: mod.nome, formatos };
  }).sort((a, b) => ordenacao.compare(a.nome, b.nome));
  return { lista, porCodigo };
}

export function nomeDaEscolha(codigo, catalogo) {
  const escolha = catalogo.porCodigo.get(String(codigo));
  if (!escolha) return 'Modalidade ' + codigo;
  return [escolha.modalidade, escolha.formato].filter(Boolean).join(' · ');
}

export function escolhasDaModalidade(aluno, modalidade, codigoFormato, catalogo) {
  if (!modalidade) return [];
  return codigosDoAluno(aluno).flatMap(codigo => {
    if (codigoFormato && codigo !== codigoFormato) return [];
    const escolha = catalogo.porCodigo.get(codigo);
    if (escolha?.modalidadeId === modalidade.id) return [escolha];
    if (!escolha && codigo.startsWith(modalidade.id + '-')) return [{
      codigo, modalidadeId: modalidade.id, modalidade: modalidade.nome, formato: 'Formato não identificado (' + codigo + ')'
    }];
    return [];
  });
}

function ordenarLinhas(linhas) {
  return linhas.sort((a, b) => ordenacao.compare(a.Turma, b.Turma) || ordenacao.compare(a.Aluno, b.Aluno));
}

function linhasGerais(alunos, catalogo) {
  return ordenarLinhas(alunos.map(aluno => {
    const data = aluno.inscricao?.data_inscricao && new Date(aluno.inscricao.data_inscricao);
    return {
      Turma: turmaDe(aluno), Aluno: aluno.nome, Matrícula: String(aluno.n_inscricao ?? ''),
      Situação: aluno.inscricao ? 'Inscrito' : 'Pendente',
      Modalidades: codigosDoAluno(aluno).map(codigo => nomeDaEscolha(codigo, catalogo)).join(', '),
      'Total de modalidades': aluno.inscricao?.pontuacaoTotal ?? '',
      Data: data && Number.isFinite(data.getTime()) ? dataLocal.format(data) : ''
    };
  }));
}

function nomeDaAba(nome, usadas) {
  const base = nome.replace(/[\[\]:*?/\\]/g, ' ').trim().replace(/^'+|'+$/g, '') || 'Lista';
  let candidato = base.slice(0, 31).replace(/'+$/, '');
  for (let numero = 2; usadas.has(candidato.toLowerCase()); numero += 1) {
    const sufixo = ' (' + numero + ')';
    candidato = base.slice(0, 31 - sufixo.length) + sufixo;
  }
  usadas.add(candidato.toLowerCase());
  return candidato;
}

export function gerarRelatorio(XLSX, { alunos, catalogo, geral, turmas, modalidade, formato, turmaAtiva }) {
  const livro = XLSX.utils.book_new();
  const usadas = new Set();
  const monitoria = Boolean(modalidade && !geral);
  const header = monitoria ? cabecalhoMonitoria : cabecalhoGeral;
  const larguras = monitoria ? [16, 44, 32, 32] : [16, 42, 14, 14, 64, 22, 16];

  function adicionar(nome, dados) {
    const aba = XLSX.utils.json_to_sheet(dados, { header: [...header] });
    aba['!cols'] = larguras.map(wch => ({ wch }));
    if (dados.length) aba['!autofilter'] = { ref: aba['!ref'] };
    XLSX.utils.book_append_sheet(livro, aba, nomeDaAba(nome, usadas));
  }

  if (monitoria) {
    const porFormato = new Map(modalidade.formatos.map(item => [item.formato, []]));
    const linhas = ordenarLinhas(alunos.flatMap(aluno => escolhasDaModalidade(aluno, modalidade, formato, catalogo)
      .map(escolha => ({
        Turma: turmaDe(aluno), Aluno: aluno.nome, Modalidade: escolha.modalidade, Formato: escolha.formato || 'Geral'
      }))));
    adicionar('Inscritos', linhas);
    if (!formato) {
      for (const linha of linhas) {
        if (!porFormato.has(linha.Formato)) porFormato.set(linha.Formato, []);
        porFormato.get(linha.Formato).push(linha);
      }
      if (porFormato.size > 1) {
        for (const [nome, grupo] of porFormato) adicionar(nome, grupo);
      }
    }
  } else {
    const linhas = linhasGerais(alunos, catalogo);
    if (!geral && turmas.length === 1) adicionar(turmas[0], linhas);
    else {
      adicionar(geral ? 'Todos os alunos' : 'Seleção', linhas);
      if (geral) {
        adicionar('Inscritos', linhas.filter(linha => linha.Situação === 'Inscrito'));
        adicionar('Pendentes', linhas.filter(linha => linha.Situação === 'Pendente'));
      }
      for (const turma of turmas) adicionar(turma, linhas.filter(linha => linha.Turma === turma));
    }
  }

  const nomeFormato = modalidade?.formatos.find(item => item.codigo === formato)?.formato;
  const sufixo = [modalidade?.nome, nomeFormato, turmaAtiva].filter(Boolean).map(slugArquivo).filter(Boolean).join('_');
  const arquivo = geral ? 'Relatorio_Intergil_2026.xlsx' : 'Intergil_2026_' + (sufixo || 'selecao') + '.xlsx';
  return { livro, arquivo };
}
