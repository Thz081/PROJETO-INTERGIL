import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';

const vazio = { modId: '', categoria: 'Geral', data: '', horario: '', local: '' };

export default function MonitorHorarios() {
  const [modalidades, setModalidades] = useState([]);
  const [ficha, preencher] = useState(vazio);
  const [edicao, editar] = useState(null);
  const [filtro, filtrar] = useState('');
  const [buscando, buscar] = useState(true);
  const [ocupado, ocupar] = useState(false);
  const [retorno, responder] = useState(null);
  const form = useRef(null);
  const campoData = useRef(null);

  async function carregar() {
    buscar(true);
    try { setModalidades((await api.get('/monitor/horarios')).data); }
    catch (falha) { responder({ erro: true, texto: falha.response?.data?.message || 'Não foi possível buscar os horários.' }); }
    finally { buscar(false); }
  }
  useEffect(() => { carregar(); }, []);
  const atualizar = (campo, valor) => preencher(anterior => ({ ...anterior, [campo]: valor }));

  function cancelar() {
    editar(null);
    preencher(vazio);
  }

  async function executar(acao, texto) {
    if (ocupado) return;
    ocupar(true);
    responder(null);
    try {
      await acao();
      responder({ texto });
      await carregar();
    } catch (falha) {
      responder({ erro: true, texto: falha.response?.data?.message || 'Não foi possível alterar o horário.' });
    } finally { ocupar(false); }
  }

  function salvar(evento) {
    evento.preventDefault();
    executar(async () => {
      if (edicao) await api.put(`/monitor/horarios/${ficha.modId}/${edicao}`, ficha);
      else await api.post('/monitor/horarios', ficha);
      cancelar();
    }, edicao ? 'Horário atualizado.' : 'Horário adicionado.');
  }

  function carregarHorario(modalidade, horario) {
    const { categoria, data, horario: hora, local } = horario;
    preencher({ modId: String(modalidade._id), categoria, data, horario: hora, local });
    editar(horario._id);
    form.current.scrollIntoView({ block: 'start' });
    campoData.current.focus({ preventScroll: true });
  }

  const modalidadeAtiva = modalidades.find(mod => String(mod._id) === ficha.modId);
  const formatos = [...new Set([
    ...(modalidadeAtiva?.permiteGeral === false ? [] : ['Geral']),
    ...(modalidadeAtiva?.submodalidades.map(opcao => opcao.nome) || []),
    ...(edicao ? [ficha.categoria] : [])
  ])];
  const listadas = filtro ? modalidades.filter(mod => String(mod._id) === filtro) : modalidades;
  const total = listadas.reduce((soma, mod) => soma + mod.horarios.length, 0);

  return <>
    <header className="admin-header-bar"><h2>Horários dos jogos</h2></header>
    {buscando && <p role="status">Buscando horários…</p>}
    {!buscando && !modalidades.length && <p>Nenhuma modalidade foi atribuída à sua monitoria.</p>}
    {retorno?.erro && !modalidades.length && <p role="alert" className="painel-retorno erro">{retorno.texto}
      {' '}<button type="button" className="painel-secundario" onClick={carregar}>Tentar novamente</button></p>}
    {!!modalidades.length && <>
      <section className="admin-card modalidade-editor" ref={form}>
        <div className="painel-linha painel-linha-entre">
          <h3>{edicao ? 'Editar horário' : 'Adicionar horário'}</h3>
          {edicao && <button type="button" className="painel-secundario" onClick={cancelar}>Cancelar edição</button>}
        </div>
        <form onSubmit={salvar} className="form-grid">
          <label className="campo-painel">Modalidade
            <select value={ficha.modId} required disabled={Boolean(edicao)} onChange={e => {
              const modId = e.target.value;
              const mod = modalidades.find(item => String(item._id) === modId);
              preencher({ ...ficha, modId, categoria: mod?.permiteGeral === false ? mod.submodalidades[0]?.nome || '' : 'Geral' });
            }}>
              <option value="">Selecione</option>
              {modalidades.map(mod => <option key={mod._id} value={mod._id}>{mod.nome}</option>)}
            </select>
          </label>
          <label className="campo-painel">Formato de participação
            <select value={ficha.categoria} required disabled={!ficha.modId} onChange={e => atualizar('categoria', e.target.value)}>
              {formatos.map(nome => <option key={nome}>{nome}</option>)}
            </select>
          </label>
          <label className="campo-painel">Data
            <input ref={campoData} value={ficha.data} required placeholder="Ex. 02/12/2026" onChange={e => atualizar('data', e.target.value)}/>
          </label>
          <label className="campo-painel">Horário
            <input value={ficha.horario} required placeholder="Ex. 14h" onChange={e => atualizar('horario', e.target.value)}/>
          </label>
          <label className="campo-painel">Local
            <input value={ficha.local} required placeholder="Ex. Quadra 1" onChange={e => atualizar('local', e.target.value)}/>
          </label>
          <button className="painel-primario" disabled={ocupado}>{ocupado ? 'Salvando…' : 'Salvar horário'}</button>
        </form>
        {retorno && <p role={retorno.erro ? 'alert' : 'status'} className={'painel-retorno' + (retorno.erro ? ' erro' : '')}>{retorno.texto}</p>}
      </section>
      <section className="admin-card">
        <div className="painel-linha painel-linha-entre">
          <h3>Agenda cadastrada · {total}</h3>
          <label className="campo-painel">Filtrar agenda
            <select value={filtro} onChange={e => filtrar(e.target.value)}>
              <option value="">Todas as minhas modalidades</option>
              {modalidades.map(mod => <option key={mod._id} value={mod._id}>{mod.nome}</option>)}
            </select>
          </label>
        </div>
        {!total && !buscando && <p>Nenhum horário cadastrado neste filtro.</p>}
        {listadas.filter(mod => mod.horarios.length).map(mod => <section className="painel-agenda" key={mod._id}>
          <h4>{mod.nome}</h4>
          <div className="painel-tabela-scroll" role="region" tabIndex={0} aria-label={`Horários de ${mod.nome}`}>
            <table className="admin-tabela">
              <thead><tr><th>Formato</th><th>Data</th><th>Horário</th><th>Local</th><th>Ações</th></tr></thead>
              <tbody>{mod.horarios.map(h => <tr key={h._id}>
                <td>{h.categoria}</td><td>{h.data}</td><td>{h.horario}</td><td>{h.local}</td>
                <td><div className="painel-linha">
                  <button type="button" className="painel-secundario" disabled={ocupado}
                    onClick={() => carregarHorario(mod, h)}>Editar</button>
                  <button type="button" className="painel-secundario" disabled={ocupado} onClick={() => {
                    if (window.confirm(`Excluir o horário de ${mod.nome} em ${h.data}?`))
                      executar(() => api.delete(`/monitor/horarios/${mod._id}/${h._id}`), 'Horário excluído.');
                  }}>Excluir</button>
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>)}
      </section>
    </>}
  </>;
}
