import React, { useEffect, useState } from 'react';
import api, { assetURL } from '../../api';
import ArquivoCampo from '../../components/ArquivoCampo';

const documentos = {
  edital: { nome: 'Edital', campo: 'linkEdital' },
  chaveamento: { nome: 'Chaveamento', campo: 'linkChaveamento' }
};

function PublicarDocumento({ tipo, modalidade, formato, publicado, atualizar }) {
  const [arquivos, selecionar] = useState([]);
  const [link, definirLink] = useState('');
  const [ocupado, ocupar] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [retorno, responder] = useState(null);
  const rotulo = documentos[tipo].nome;

  async function salvar(evento) {
    evento.preventDefault();
    if (ocupado || (!arquivos.length && !link.trim())) return;
    ocupar(true);
    responder(null);
    try {
      let resposta;
      if (arquivos.length) {
        const dados = new FormData();
        dados.set('modId', modalidade);
        dados.set('subNome', formato);
        dados.set(tipo, arquivos[0]);
        setProgresso(0);
        resposta = await api.post('/monitor/upload-' + tipo, dados, {
          onUploadProgress: e => { if (e.total) setProgresso(Math.round(e.loaded * 100 / e.total)); }
        });
      } else {
        resposta = await api.post('/monitor/links', { modId: modalidade, subNome: formato, tipoLink: tipo, url: link.trim() });
      }
      const atualizada = resposta.data.modalidade;
      const url = formato === 'Geral' ? atualizada[documentos[tipo].campo]
        : atualizada.submodalidades.find(opcao => opcao.nome === formato)?.[tipo];
      atualizar(modalidade, formato, tipo, url);
      selecionar([]);
      definirLink('');
      responder({ mensagem: rotulo + ' publicado.' });
    } catch (falha) {
      responder({ erro: true, mensagem: falha.response?.data?.message || 'Não foi possível publicar. Tente novamente.' });
    } finally {
      ocupar(false);
      setProgresso(null);
    }
  }

  return <form className="admin-card" onSubmit={salvar}>
    <h3>{rotulo}</h3>
    {publicado && publicado !== '#' && <p>
      <a className="painel-link" href={assetURL(publicado)} target="_blank" rel="noreferrer">Abrir {rotulo.toLowerCase()} publicado</a>
    </p>}
    <div className="painel-campos">
      <ArquivoCampo titulo={`PDF do ${rotulo.toLowerCase()}`} tipo="pdf" arquivos={arquivos} selecionar={selecionar} disabled={ocupado}/>
      <label className="campo-painel">Link externo do {rotulo.toLowerCase()}
        <input type="url" value={link} disabled={ocupado || arquivos.length > 0}
          placeholder="https://" onChange={evento => definirLink(evento.target.value)}/>
      </label>
      <button type="submit" className="painel-primario" disabled={ocupado || (!arquivos.length && !link.trim())}>
        {ocupado ? 'Publicando…' : `Publicar ${rotulo.toLowerCase()}`}
      </button>
    </div>
    {progresso !== null && <progress value={progresso} max={100} aria-label={`Envio de ${rotulo.toLowerCase()}`}/>}
    {retorno && <p className={'painel-retorno' + (retorno.erro ? ' erro' : '')}
      role={retorno.erro ? 'alert' : 'status'}>{retorno.mensagem}</p>}
  </form>;
}

export default function MonitorLinks() {
  const [modalidades, setModalidades] = useState([]);
  const [modId, setModId] = useState('');
  const [formato, setFormato] = useState('Geral');
  const [carregando, carregar] = useState(true);
  const [erro, setErro] = useState('');

  async function buscar() {
    carregar(true);
    setErro('');
    try { setModalidades((await api.get('/monitor/modalidades-para-links')).data); }
    catch (falha) { setErro(falha.response?.data?.message || 'Não foi possível buscar suas modalidades.'); }
    finally { carregar(false); }
  }
  useEffect(() => { buscar(); }, []);

  const modalidade = modalidades.find(item => String(item._id) === modId);
  const alvo = formato === 'Geral' ? modalidade : modalidade?.submodalidades.find(item => item.nome === formato);
  function atualizar(id, destino, tipo, url) {
    setModalidades(lista => lista.map(item => {
      if (String(item._id) !== id) return item;
      if (destino === 'Geral') return { ...item, [documentos[tipo].campo]: url };
      return { ...item, submodalidades: item.submodalidades.map(opcao =>
        opcao.nome === destino ? { ...opcao, [tipo]: url } : opcao) };
    }));
  }

  return <>
    <header className="admin-header-bar"><h2>Editais e chaveamentos</h2></header>
    {carregando && <p role="status">Carregando suas modalidades…</p>}
    {erro && <p role="alert" className="painel-retorno erro">{erro} <button type="button" className="painel-secundario" onClick={buscar}>Tentar novamente</button></p>}
    {!erro && !carregando && !modalidades.length && <p>Nenhuma modalidade foi atribuída à sua monitoria.</p>}
    {!!modalidades.length && <section className="admin-card">
      <h3>Onde publicar</h3>
      <div className="form-grid">
        <label className="campo-painel">Modalidade
          <select value={modId} onChange={e => {
            const id = e.target.value;
            const mod = modalidades.find(item => String(item._id) === id);
            setModId(id);
            setFormato(mod?.permiteGeral === false ? mod.submodalidades[0]?.nome || '' : 'Geral');
          }}>
            <option value="">Selecione sua modalidade</option>
            {modalidades.map(item => <option key={item._id} value={item._id}>{item.nome}</option>)}
          </select>
        </label>
        <label className="campo-painel">Formato de participação
          <select value={formato} disabled={!modalidade} onChange={e => setFormato(e.target.value)}>
            {modalidade?.permiteGeral !== false && <option value="Geral">Geral · toda a modalidade</option>}
            {modalidade?.submodalidades.map(opcao => <option key={opcao.nome}>{opcao.nome}</option>)}
          </select>
        </label>
      </div>
    </section>}
    {alvo && <div className="painel-grade painel-documentos">
      {Object.entries(documentos).map(([tipo, config]) => <PublicarDocumento key={modId + '/' + formato + '/' + tipo}
        tipo={tipo} modalidade={modId} formato={formato} atualizar={atualizar}
        publicado={alvo[formato === 'Geral' ? config.campo : tipo]}/>)}
    </div>}
  </>;
}
