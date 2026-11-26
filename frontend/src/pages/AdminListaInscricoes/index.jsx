import React, { useEffect, useMemo, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import { escolhasDaModalidade, gerarRelatorio, nomeDaEscolha, normalizar, prepararCatalogo, turmaDe } from './relatorios';
import './style.css';

export default function AdminListaInscricoes() {
  const [alunos, setAlunos] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [salas, setSalas] = useState({});
  const [buscando, buscar] = useState(true);
  const [erro, setErro] = useState('');
  const [situacao, setSituacao] = useState('todos');
  const [turmaAtiva, setTurmaAtiva] = useState('');
  const [modalidadeAtiva, setModalidadeAtiva] = useState('');
  const [formatoAtivo, setFormatoAtivo] = useState('');
  const [texto, setTexto] = useState('');
  const [exportando, exportar] = useState('');

  async function carregar() {
    buscar(true);
    setErro('');
    try {
      const [lista, catalogo, turmas] = await Promise.all([
        api.get('/admin/alunos'), api.get('/modalidades'), api.get('/admin/salas')
      ]);
      setAlunos(lista.data);
      setSalas(Object.fromEntries(turmas.data.map(sala => [turmaDe(sala), sala])));
      setModalidades(catalogo.data);
    } catch (falha) {
      setErro(falha.response?.data?.message || 'Não foi possível carregar a lista de alunos.');
    } finally { buscar(false); }
  }

  useEffect(() => { carregar(); }, []);

  const catalogo = useMemo(() => prepararCatalogo(modalidades), [modalidades]);
  const modalidade = catalogo.lista.find(item => item.id === modalidadeAtiva);
  const situacaoFiltro = modalidade ? 'inscritos' : situacao;
  const inscritos = alunos.filter(aluno => aluno.inscricao).length;
  const busca = normalizar(texto.trim());
  const grupos = new Map();
  for (const aluno of alunos) {
    const turma = turmaDe(aluno);
    if ((turmaAtiva && turma !== turmaAtiva) ||
        (situacaoFiltro === 'inscritos' && !aluno.inscricao) ||
        (situacaoFiltro === 'pendentes' && aluno.inscricao)) continue;
    if (busca && !normalizar(aluno.nome + ' ' + aluno.n_inscricao).includes(busca)) continue;
    if (modalidade && !escolhasDaModalidade(aluno, modalidade, formatoAtivo, catalogo).length) continue;
    if (!grupos.has(turma)) grupos.set(turma, []);
    grupos.get(turma).push(aluno);
  }
  const nomesDasTurmas = [...new Set([...Object.keys(salas), ...alunos.map(turmaDe)])].sort();
  const alunosSelecionados = [...grupos.values()].flat();
  const rotulosDaInscricao = aluno => modalidade
    ? escolhasDaModalidade(aluno, modalidade, formatoAtivo, catalogo).map(escolha => [escolha.modalidade, escolha.formato].filter(Boolean).join(' · '))
    : aluno.inscricao?.modalidades.map(codigo => nomeDaEscolha(codigo, catalogo));

  async function exportarExcel(geral) {
    exportar(geral ? 'geral' : 'selecao');
    setErro('');
    try {
      const XLSX = await import('xlsx');
      const { livro, arquivo } = gerarRelatorio(XLSX, {
        alunos: geral ? alunos : alunosSelecionados, catalogo, geral,
        turmas: geral ? nomesDasTurmas : [...grupos.keys()], modalidade, formato: formatoAtivo, turmaAtiva
      });
      XLSX.writeFile(livro, arquivo);
    } catch { setErro('Não foi possível gerar o Excel. Tente novamente.'); }
    finally { exportar(''); }
  }

  return <>
    <header className="admin-header-bar painel-linha painel-linha-entre">
      <h2>Inscrições por turma</h2>
      <button type="button" className="painel-secundario" onClick={() => exportarExcel(true)} disabled={buscando || Boolean(exportando) || !alunos.length}>
        <FaFileExcel aria-hidden="true"/> {exportando === 'geral' ? 'Gerando Excel…' : 'Baixar Excel geral'}
      </button>
    </header>

    {erro && <p role="alert" className="painel-retorno erro">{erro}{!alunos.length && <>
      {' '}<button type="button" className="painel-secundario" onClick={carregar}>Tentar novamente</button>
    </>}</p>}

    <section className="admin-card lista-gestao">
      <div className="lista-gestao-totais" aria-label="Totais de inscrição">
        <span><strong>{alunos.length}</strong> alunos ativos</span>
        <span><strong>{inscritos}</strong> inscritos</span>
        <span><strong>{alunos.length - inscritos}</strong> pendentes</span>
      </div>
      <div className="painel-grade">
        <label className="campo-painel">Turma
          <select value={turmaAtiva} onChange={e => setTurmaAtiva(e.target.value)}>
            <option value="">Todas as turmas</option>
            {nomesDasTurmas.map(nome => <option key={nome} value={nome}>{nome}{salas[nome] ? ' · ' + salas[nome].nome : ''}</option>)}
          </select>
        </label>
        <label className="campo-painel">Situação
          <select value={situacaoFiltro} disabled={Boolean(modalidade)} onChange={e => setSituacao(e.target.value)}>
            <option value="todos">Todos os alunos</option>
            <option value="inscritos">Inscritos</option>
            <option value="pendentes">Pendentes</option>
          </select>
        </label>
        <label className="campo-painel">Buscar por nome ou matrícula
          <input type="search" value={texto} onChange={e => setTexto(e.target.value)} />
        </label>
        <label className="campo-painel">Modalidade
          <select value={modalidadeAtiva} onChange={e => { setModalidadeAtiva(e.target.value); setFormatoAtivo(''); }}>
            <option value="">Todas as modalidades</option>
            {catalogo.lista.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>
        </label>
        <label className="campo-painel">Formato / submodalidade
          <select value={formatoAtivo} disabled={!modalidade?.formatos.length} onChange={e => setFormatoAtivo(e.target.value)}>
            <option value="">{modalidade && !modalidade.formatos.length ? 'Geral' : 'Todos os formatos'}</option>
            {modalidade?.formatos.map(item => <option key={item.codigo} value={item.codigo}>{item.formato}</option>)}
          </select>
        </label>
      </div>
      <div className="painel-linha painel-linha-entre lista-gestao-exportacao">
        <small>{alunosSelecionados.length} {alunosSelecionados.length === 1 ? 'aluno na seleção' : 'alunos na seleção'}</small>
        <button type="button" className="painel-secundario" onClick={() => exportarExcel(false)}
          disabled={buscando || Boolean(exportando) || !alunosSelecionados.length}>
          <FaFileExcel aria-hidden="true"/> {exportando === 'selecao' ? 'Gerando Excel…' :
            modalidade ? 'Baixar lista para monitoria' : 'Baixar Excel da seleção'}
        </button>
      </div>
    </section>

    <div className="lista-gestao-turmas">
      {buscando && <p role="status">Carregando alunos…</p>}
      {!buscando && !grupos.size && !erro && <p>Nenhum aluno para os filtros selecionados.</p>}
      {[...grupos].map(([turma, lista]) => <details className="admin-card lista-gestao-turma" key={turma}
        open={turmaAtiva === turma || Boolean(modalidade) || busca.length > 0 || undefined}>
        <summary>
          <img src={assetURL(salas[turma]?.logo_url)} alt="" width="40" height="40"/>
          <strong>{turma}{salas[turma] && ' · ' + salas[turma].nome}</strong>
          <small>{lista.length} alunos · {lista.filter(aluno => aluno.inscricao).length} inscritos</small>
        </summary>
        <div className="painel-tabela-scroll" tabIndex={0} role="region" aria-label={`Alunos de ${turma}`}>
          <table className="lista-gestao-tabela">
            <thead><tr><th>Aluno</th><th>Matrícula</th><th>Situação</th><th>Modalidades</th></tr></thead>
            <tbody>{lista.map(aluno => <tr key={aluno._id}>
              <th scope="row">{aluno.nome}</th><td>{aluno.n_inscricao}</td>
              <td>{aluno.inscricao ? 'Inscrito' : 'Pendente'}</td>
              <td>{rotulosDaInscricao(aluno)?.join(', ') || '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </details>)}
    </div>
  </>;
}
