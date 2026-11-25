import React, { useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import './style.css';

const normalizar = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const turmaDe = aluno => aluno.turma?.replace(/[ºª]/g, '°').trim().replace(/\s+/g, ' ') || 'Sem turma';
const dataLocal = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife' });

export default function AdminListaInscricoes() {
  const [alunos, setAlunos] = useState([]);
  const [mapa, setMapa] = useState({});
  const [salas, setSalas] = useState({});
  const [buscando, buscar] = useState(true);
  const [erro, setErro] = useState('');
  const [situacao, setSituacao] = useState('todos');
  const [turmaAtiva, setTurmaAtiva] = useState('');
  const [texto, setTexto] = useState('');
  const [exportando, exportar] = useState(false);

  async function carregar() {
    buscar(true);
    setErro('');
    try {
      const [lista, modalidades, turmas] = await Promise.all([
        api.get('/admin/alunos'), api.get('/modalidades'), api.get('/admin/salas')
      ]);
      setAlunos(lista.data);
      setSalas(Object.fromEntries(turmas.data.map(sala => [turmaDe(sala), sala])));
      setMapa(Object.fromEntries(modalidades.data.flatMap(modalidade => [
        [modalidade._id, modalidade.nome],
        ...(modalidade.submodalidades || []).map((opcao, i) => [
          `${modalidade._id}-${i}`,
          opcao.nome === 'Individual' ? modalidade.nome : modalidade.nome + ' · ' + opcao.nome
        ])
      ])));
    } catch (falha) {
      setErro(falha.response?.data?.message || 'Não foi possível carregar a lista de alunos.');
    } finally { buscar(false); }
  }

  useEffect(() => { carregar(); }, []);

  const inscritos = alunos.filter(aluno => aluno.inscricao).length;
  const busca = normalizar(texto.trim());
  const grupos = new Map();
  for (const aluno of alunos) {
    const turma = turmaDe(aluno);
    if ((turmaAtiva && turma !== turmaAtiva) ||
        (situacao === 'inscritos' && !aluno.inscricao) ||
        (situacao === 'pendentes' && aluno.inscricao)) continue;
    if (busca && !normalizar(aluno.nome + ' ' + aluno.n_inscricao).includes(busca)) continue;
    if (!grupos.has(turma)) grupos.set(turma, []);
    grupos.get(turma).push(aluno);
  }
  const nomesDasTurmas = [...new Set([...Object.keys(salas), ...alunos.map(turmaDe)])].sort();
  const nomeDaModalidade = codigo => mapa[codigo] || `Modalidade ${codigo}`;

  async function exportarExcel() {
    exportar(true);
    setErro('');
    try {
      const XLSX = await import('xlsx');
      const linhas = alunos.map(aluno => ({
        Turma: turmaDe(aluno), Aluno: aluno.nome, Matrícula: aluno.n_inscricao,
        Situação: aluno.inscricao ? 'Inscrito' : 'Pendente',
        Modalidades: aluno.inscricao?.modalidades.map(nomeDaModalidade).join(', ') || '',
        'Total de modalidades': aluno.inscricao?.pontuacaoTotal ?? '',
        Data: aluno.inscricao?.data_inscricao ? dataLocal.format(new Date(aluno.inscricao.data_inscricao)) : ''
      }));
      const livro = XLSX.utils.book_new();
      for (const [aba, dados] of [
        ['Todos os alunos', linhas], ['Inscritos', linhas.filter(l => l.Situação === 'Inscrito')],
        ['Pendentes', linhas.filter(l => l.Situação === 'Pendente')]
      ]) {
        const folha = XLSX.utils.json_to_sheet(dados, { header: [
          'Turma', 'Aluno', 'Matrícula', 'Situação', 'Modalidades', 'Total de modalidades', 'Data'
        ] });
        folha['!cols'] = [16, 42, 14, 14, 64, 22, 16].map(wch => ({ wch }));
        XLSX.utils.book_append_sheet(livro, folha, aba);
      }
      XLSX.writeFile(livro, 'Relatorio_Intergil_2026.xlsx');
    } catch { setErro('Não foi possível gerar o Excel. Tente novamente.'); }
    finally { exportar(false); }
  }

  return <>
    <header className="admin-header-bar painel-linha painel-linha-entre">
      <h2>Inscrições por turma</h2>
      <button type="button" className="painel-secundario" onClick={exportarExcel} disabled={buscando || exportando || !alunos.length}>
        <FaFileExcel aria-hidden="true"/> {exportando ? 'Gerando Excel…' : 'Baixar Excel'}
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
          <select value={situacao} onChange={e => setSituacao(e.target.value)}>
            <option value="todos">Todos os alunos</option>
            <option value="inscritos">Inscritos</option>
            <option value="pendentes">Pendentes</option>
          </select>
        </label>
        <label className="campo-painel">Buscar por nome ou matrícula
          <input type="search" value={texto} onChange={e => setTexto(e.target.value)} />
        </label>
      </div>
    </section>

    <div className="lista-gestao-turmas">
      {buscando && <p role="status">Carregando alunos…</p>}
      {!buscando && !grupos.size && !erro && <p>Nenhum aluno para os filtros selecionados.</p>}
      {[...grupos].map(([turma, lista]) => <details className="admin-card lista-gestao-turma" key={turma}
        open={turmaAtiva === turma || busca.length > 0 || undefined}>
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
              <td>{aluno.inscricao?.modalidades.map(nomeDaModalidade).join(', ') || '—'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </details>)}
    </div>
  </>;
}
