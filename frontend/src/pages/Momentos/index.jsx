import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaExpand, FaInstagram, FaPlay, FaRegImages } from 'react-icons/fa';
import TituloArmorial from '../../components/TituloArmorial';
import api, { assetURL } from '../../api';
import Colecoes, { CreditosTurmas, PerfisTurmas } from './Colecoes';
import Lances from './Lances';
import abrirTelaCheia from './telaCheia';
import './style.css';

const rota = '/acervo-momentos';
const tipos = { foto: 'Álbum', video: 'Vídeo' };
const assuntos = { evento: 'Evento', modalidade: 'Modalidade', mascote: 'Dança de mascote', danca: 'Dança geral' };
const instagram = 'https://www.instagram.com/agr.tv_/';

function embedYouTube(url) {
  const u = new URL(url, window.location.origin);
  const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) :
    /^(www\.)?youtube(-nocookie)?\.com$/.test(u.hostname) ? u.searchParams.get('v') || u.pathname.split('/embed/')[1] : '';
  return /^[\w-]{11}$/.test(id || '') ? 'https://www.youtube-nocookie.com/embed/' + id : null;
}

function rotulo(item, catalogo) {
  const modalidade = catalogo?.modalidades.find(mod => mod._id === item.modalidade);
  return modalidade?.nome || assuntos[item.assunto];
}

function Capa({ item }) {
  const capa = item.midias[0]?.capa;
  const Icone = item.tipo === 'video' ? FaPlay : FaRegImages;
  return <div className="momento-capa">
    {capa && <img src={assetURL(capa)} alt=""
      decoding="async" onError={e => { e.currentTarget.hidden = true; }}/>}
    <span className="momento-tipo"><Icone aria-hidden/>{item.tipo === 'video' ? (item.lance ? 'Lance' : 'Vídeo') :
      item.midias.length + (item.midias.length === 1 ? ' foto' : ' fotos')}</span>
  </div>;
}

export default function Momentos() {
  const { id, sala } = useParams();
  const { pathname } = useLocation();
  const lances = pathname === '/momentos/lances';
  const albuns = Boolean(sala) || pathname === '/momentos/albuns';
  const [catalogo, definirCatalogo] = useState(null);
  const [falhaCatalogo, definirFalhaCatalogo] = useState(false);
  const [tentarCatalogo, definirTentativaCatalogo] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api.get(rota + '/catalogo', { signal: controller.signal })
      .then(({ data }) => { definirCatalogo(data); definirFalhaCatalogo(false); })
      .catch(() => { if (!controller.signal.aborted) definirFalhaCatalogo(true); });
    return () => controller.abort();
  }, [tentarCatalogo]);

  return <section className="galeria-edicao">
    {lances ? <Lances catalogo={catalogo}/> : albuns ? <Colecoes key={sala || 'geral'} catalogo={catalogo}
      salaId={sala} Visor={Visor}/> : id ? <Detalhe key={id} id={id} catalogo={catalogo}/> : <>
      <div className="momentos-topo">
        <div><h1><TituloArmorial arte="momentos">Momentos do Intergil</TituloArmorial></h1>
          <p>Fotos e vídeos dos jogos, das danças e da torcida.</p></div>
        <a href={instagram} target="_blank" rel="noreferrer"><FaInstagram aria-hidden/> Cobertura da AGR TV</a>
      </div>
      <PerfisTurmas catalogo={catalogo}/>
      {!catalogo && !falhaCatalogo && <p className="momentos-estado" role="status">Carregando turmas…</p>}
    </>}
    {falhaCatalogo && <p role="status">Não foi possível carregar o catálogo de turmas e modalidades. <button type="button"
        className="arm-botao arm-botao-contorno" onClick={() => definirTentativaCatalogo(n => n + 1)}>Tentar novamente</button></p>}
  </section>;
}

function Detalhe({ id, catalogo }) {
  const { state } = useLocation();
  const [item, definirItem] = useState(null);
  const [erro, definirErro] = useState('');
  const [tentativa, tentar] = useState(0);
  const [indice, definirIndice] = useState(0);
  const [aberto, abrir] = useState(false);
  const destaColecao = /^\/momentos\/(?:albuns|lances|turmas\/[a-f0-9]{24})(?:\?|$)/.test(state?.voltar || '');
  const volta = destaColecao ? state.voltar : '/momentos';

  useEffect(() => {
    const controller = new AbortController();
    api.get(rota + '/' + id, { signal: controller.signal }).then(({ data }) => definirItem(data))
      .catch(falha => { if (!controller.signal.aborted) definirErro(falha.response?.status === 404 ?
        'Esta publicação não está disponível.' : 'Não foi possível carregar este momento.'); });
    return () => controller.abort();
  }, [id, tentativa]);

  const midia = item?.midias[indice];
  return <>
    <Link to={volta} className="momento-voltar"><FaArrowLeft aria-hidden/> Voltar a Momentos</Link>
    {erro ? <div className="momentos-estado" role="alert"><p>{erro}</p>
      <button type="button" className="arm-botao arm-botao-contorno" onClick={() => { definirErro(''); tentar(n => n + 1); }}>Tentar novamente</button></div> :
      !item ? <p className="momentos-estado" role="status">Carregando publicação…</p> :
      <article className="momento-detalhe">
        <header>
          <p className="momento-contexto">{rotulo(item, catalogo)}{item.formato && ' · ' + item.formato}</p>
          <h1>{item.titulo}</h1>
          {item.tema && <p className="momento-tema">{item.tema}</p>}
          <CreditosTurmas ids={item.salas} catalogo={catalogo}/>
        </header>
        {midia && <button className="momento-abrir" type="button" onClick={() => abrir(true)}>
          <Capa item={{ ...item, midias: [midia] }}/>
          <span>{item.tipo === 'foto' ? <FaExpand aria-hidden/> : <FaPlay aria-hidden/>}
            {item.tipo === 'foto' ? 'Abrir foto ' + (indice + 1) : 'Reproduzir vídeo'}</span>
        </button>}
        {item.midias.length > 1 && <ul className="momento-miniaturas" aria-label="Fotos do álbum">
          {item.midias.map((foto, i) => <li key={foto._id}><button type="button" aria-pressed={i === indice}
            aria-label={'Foto ' + (i + 1)} onClick={() => definirIndice(i)}><img src={assetURL(foto.capa || foto.url)} alt="" loading="lazy"/></button></li>)}
        </ul>}
        {item.legenda && <p className="momento-legenda">{item.legenda}</p>}
        <p className="momento-creditos">{tipos[item.tipo]} · <a href={instagram} target="_blank" rel="noreferrer">AGR TV</a></p>
      </article>}
    {aberto && midia && <Visor item={item} indice={indice} definirIndice={definirIndice} fechar={() => abrir(false)}/>}
  </>;
}

function Visor({ item, indice, definirIndice, fechar }) {
  const ref = useRef(null);
  const origemToque = useRef(null);
  const [aviso, avisar] = useState('');
  const midia = item.midias[indice];
  const url = assetURL(midia.url);
  const embed = item.tipo === 'video' && embedYouTube(url);
  const total = item.midias.length;
  const mover = n => definirIndice(i => Math.max(0, Math.min(total - 1, i + n)));

  useEffect(() => {
    const dialogo = ref.current, origem = document.activeElement;
    const overflow = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      if (dialogo.open) dialogo.close();
      origem?.focus();
    };
  }, []);

  async function telaCheia() {
    try {
      const video = ref.current.querySelector('video');
      await abrirTelaCheia(ref.current.firstElementChild, video, Boolean(video && midia.largura > midia.altura));
    } catch { avisar('Use o botão de tela cheia no player.'); }
  }

  return <dialog className="visor-momento" ref={ref} aria-label={item.titulo} onCancel={e => { e.preventDefault(); fechar(); }}
    onKeyDown={e => { if (total > 1 && ['ArrowLeft', 'ArrowRight'].includes(e.key)) mover(e.key === 'ArrowRight' ? 1 : -1); }}>
    <div className="conteudo-visor">
      <header><h2>{item.titulo}</h2><button type="button" onClick={telaCheia}>Tela cheia</button><button type="button" onClick={fechar} autoFocus>Fechar</button></header>
      {item.tipo === 'foto' ? <img src={url} alt={item.titulo + ' · foto ' + (indice + 1)}
        onTouchStart={e => { origemToque.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          const distancia = origemToque.current - e.changedTouches[0].clientX;
          if (origemToque.current != null && Math.abs(distancia) > 55) mover(distancia > 0 ? 1 : -1);
          origemToque.current = null;
        }}/> : embed ? <iframe title={item.titulo} src={embed} allowFullScreen/> :
        <video src={url} poster={midia.capa ? assetURL(midia.capa) : undefined} controls playsInline autoPlay
          onError={() => avisar('Não foi possível reproduzir. Feche e abra de novo em instantes.')}/>}
      {total > 1 && <nav aria-label="Fotos do álbum">
        <button type="button" disabled={indice === 0} aria-label="Foto anterior" onClick={() => mover(-1)}><FaChevronLeft aria-hidden/></button>
        <span aria-live="polite">{indice + 1} de {total}</span>
        <button type="button" disabled={indice === total - 1} aria-label="Próxima foto" onClick={() => mover(1)}><FaChevronRight aria-hidden/></button>
      </nav>}
      {aviso && <p role="status">{aviso}</p>}
    </div>
  </dialog>;
}
