import React, { useEffect, useRef, useState } from 'react';
import TituloArmorial from '../../components/TituloArmorial';
import api, { assetURL } from '../../api';
import './style.css';

function embedYouTube(url) {
  const u = new URL(url, window.location.origin);
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) :
    /^(www\.)?youtube(-nocookie)?\.com$/.test(u.hostname) ? u.searchParams.get('v') || u.pathname.split('/embed/')[1] : '';
  return /^[\w-]{11}$/.test(id || '') ? 'https://www.youtube-nocookie.com/embed/' + id : null;
}
function Visualizar({ item, fechar }) {
  const ref = useRef(null);
  const [aviso, setAviso] = useState('');
  const url = assetURL(item.url), embed = item.tipo === 'video' && embedYouTube(url);
  useEffect(() => {
    const dialog = ref.current, origem = document.activeElement;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; dialog.close(); origem?.focus(); };
  }, []);
  async function telaCheia() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (ref.current.firstElementChild.requestFullscreen) await ref.current.firstElementChild.requestFullscreen();
      else if (ref.current.querySelector('video')?.webkitEnterFullscreen) ref.current.querySelector('video').webkitEnterFullscreen();
      else setAviso('A mídia já ocupa a área disponível neste navegador.');
    } catch { setAviso('Use o controle de tela cheia do navegador.'); }
  }
  return <dialog ref={ref} className="visor-momento" aria-label={item.titulo} onCancel={fechar}>
    <div className="conteudo-visor"><header><h2>{item.titulo}</h2><button onClick={telaCheia}>Tela cheia</button><button onClick={fechar} autoFocus>Fechar</button></header>
    {item.tipo === 'foto' ? <img src={url} alt={item.titulo}/> : embed ?
      <iframe title={item.titulo} src={embed} allowFullScreen/> :
      <video src={url} controls playsInline autoPlay onError={() => setAviso('Não foi possível reproduzir este vídeo no navegador.')}/>}
    {aviso && <p role="status">{aviso}</p>}</div>
  </dialog>;
}
export default function Momentos() {
  const [itens,setItens] = useState(null), [erro,setErro] = useState(''), [aberto,abrir] = useState(null);
  useEffect(() => { api.get('/momentos').then(r => setItens(r.data)).catch(() => setErro('Falha ao carregar a galeria.')); },[]);
  return <section className="galeria-edicao"><h1><TituloArmorial arte="momentos">Momentos do Intergil</TituloArmorial></h1>
    {erro ? <p role="alert">{erro}</p> : !itens ? <p>Carregando…</p> : !itens.length ? <p>As fotos e os vídeos do evento aparecerão aqui.</p> :
      <div className="grade-momentos">{itens.map(item => <button key={item._id} onClick={() => abrir(item)}>
        {item.tipo === 'foto' ? <img loading="lazy" src={assetURL(item.url)} alt=""/> :
          embedYouTube(assetURL(item.url)) ? <span className="capa-video">▶</span> :
            <video muted playsInline preload="metadata" src={assetURL(item.url)}/>}
        <span><small>{item.tipo === 'foto' ? 'Fotografia' : '▶ Vídeo'}</small>{item.titulo}</span>
      </button>)}</div>}
    {aberto && <Visualizar item={aberto} fechar={() => abrir(null)}/>}
  </section>;
}
