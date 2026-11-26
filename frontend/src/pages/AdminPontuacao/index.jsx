import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import useDadosPontuacao from '../../components/Pontuacao/useDados';
import EstadoDados from '../../components/Pontuacao/EstadoDados';
import './style.css';

function FormularioPodio({ modalidade, formato, salas, valores, salvar, ocupado }) {
  const [posicoes, definir] = useState(formato.posicoes.map(sala => sala?._id || ''));
  const mudou = posicoes.some((id, i) => id !== (formato.posicoes[i]?._id || ''));
  return <form onSubmit={evento => {
    evento.preventDefault();
    salvar(modalidade, formato, posicoes.map(id => id || null));
  }} className="pontuacao-formato">
    <fieldset disabled={ocupado}>
      <legend>{formato.chave === 'geral' ? modalidade.nome : formato.nome}{formato.principal && <small> Principal</small>}</legend>
      <div className="pontuacao-lugares">
        {valores.map((pontos, indice) => <label className="campo-painel" key={pontos}>
          <span>{indice + 1}º lugar <small>{pontos} pts</small></span>
          <select value={posicoes[indice]} onChange={evento => {
            const id = evento.target.value;
            definir(anterior => anterior.map((item, i) => i === indice ? id : item));
          }}>
            <option value="">Sem colocação</option>
            {salas.map(sala => <option key={sala._id} value={sala._id}
              disabled={posicoes.some((id, i) => i !== indice && id === sala._id)}>{sala.nome} · {sala.turma}</option>)}
          </select>
        </label>)}
      </div>
      <button className="painel-primario" disabled={!mudou || ocupado}>Salvar pódio</button>
    </fieldset>
  </form>;
}

export default function AdminPontuacao() {
  const { config, refreshConfig } = useConfig();
  const { dados, erro, buscar, atualizar } = useDadosPontuacao('/admin/pontuacao');
  const [categoria, escolher] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  const [retorno, responder] = useState(null);

  async function executar(acao) {
    if (ocupado) return;
    definirOcupado(true);
    responder(null);
    try { responder({ texto: await acao() }); }
    catch (falha) { responder({ erro: true, texto: falha.response?.data?.message || 'Não foi possível salvar.' }); }
    finally { definirOcupado(false); }
  }

  function salvar(modalidade, formato, posicoes) {
    return executar(async () => {
      const { data } = await api.put(`/admin/pontuacao/podios/${modalidade._id}`, {
        formato: formato.chave, versao: formato.versao, posicoes
      });
      atualizar(data);
      return `Pódio de ${modalidade.nome} atualizado.`;
    });
  }

  const visivel = config.rankingVisivel !== false;
  const categorias = [...new Set(dados?.modalidades.map(item => item.categoria) || [])].filter(Boolean);
  return <div className="gestao-pontuacao">
    <header className="admin-header-bar"><h2>Pontuação e pódios</h2></header>
    <section className="admin-card pontuacao-config">
      <div><h3>Ranking público</h3><p>{visivel ? 'Visível na home, na tabela e no extrato das salas.' : 'Oculto na home, na tabela e no extrato. Os pódios seguem públicos.'}</p></div>
      <button type="button" className="painel-secundario" disabled={ocupado || config.rankingVisivel === undefined} onClick={() => executar(async () => {
        await api.put('/admin/config', { rankingVisivel: !visivel });
        await refreshConfig();
        return visivel ? 'Ranking ocultado.' : 'Ranking publicado.';
      })}>{visivel ? <FaEyeSlash aria-hidden="true"/> : <FaEye aria-hidden="true"/>} {visivel ? 'Ocultar ranking' : 'Mostrar ranking'}</button>
    </section>
    <div className="pontuacao-feedback" aria-live="polite">
      {retorno && <p role={retorno.erro ? 'alert' : 'status'} className={'painel-retorno' + (retorno.erro ? ' erro' : '')}>{retorno.texto}</p>}
      {retorno?.erro && <button type="button" className="painel-secundario" onClick={buscar}>Atualizar dados</button>}
    </div>
    {!dados ? <EstadoDados erro={erro} buscar={buscar} texto="Não foi possível carregar as modalidades."/> : <>
      <details className="admin-card pontuacao-saldos" open>
        <summary>Pontuação das salas</summary>
        <ul>{[...dados.salas].sort((a,b) => b.pontos-a.pontos || a.turma.localeCompare(b.turma)).map(sala =>
          <li key={sala._id} title={sala.turma}><span>{sala.nome}</span><strong>{sala.pontos} pts</strong></li>)}</ul>
        <Link className="painel-link" to="/admin-salas">Adicionar ou descontar pontos com motivo em Salas</Link>
      </details>
      <div className="pontuacao-filtro painel-linha painel-linha-entre">
        <h3>Pódios por modalidade</h3>
        <label className="campo-painel">Categoria
          <select value={categoria} onChange={e => escolher(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categorias.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {dados.modalidades.filter(mod => !categoria || categoria === mod.categoria).map(modalidade => <details key={modalidade._id} className="admin-card pontuacao-modalidade">
        <summary>
          <img src={assetURL(modalidade.imgCarrossel)} alt="" width="56" height="56" loading="lazy"/>
          <span><strong>{modalidade.nome}</strong><small>{modalidade.categoria} · {modalidade.formatos.filter(item => item.posicoes.some(Boolean)).length} de {modalidade.formatos.length} com resultado</small></span>
        </summary>
        {modalidade.formatos.map(formato => <FormularioPodio key={formato.chave + ':' + formato.versao} modalidade={modalidade}
          formato={formato} salas={dados.salas} valores={dados.pontosPorLugar} salvar={salvar} ocupado={ocupado}/>)}
      </details>)}
    </>}
  </div>;
}
