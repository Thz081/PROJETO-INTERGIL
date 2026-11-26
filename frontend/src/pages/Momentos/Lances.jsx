import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowDown, FaArrowLeft, FaArrowUp, FaExpand, FaPlay, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import { CreditosTurmas } from './Colecoes';
import telaCheia from './telaCheia';

function embaralhar(itens) {
  const lista = [...itens];
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export default function Lances({ catalogo }) {
  const [itens, definirItens] = useState([]);
  const [ativo, definirAtivo] = useState(null);
  const [cursor, definirCursor] = useState(null);
  const [proximo, definirProximo] = useState(null);
  const [estado, definirEstado] = useState('carregando');
  const [tentativa, tentar] = useState(0);
  const [som, definirSom] = useState(false);
  const [paginaVisivel, definirVisibilidade] = useState(!document.hidden);
  const [trilhoVisivel, definirTrilhoVisivel] = useState(true);
  const trilho = useRef(null);
  const movimentoReduzido = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const posicao = itens.findIndex(item => item._id === ativo);

  useEffect(() => {
    const controller = new AbortController();
    definirEstado('carregando');
    api.get('/acervo-momentos', { params: { tipo: 'video', lance: '1', antes: cursor }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const lote = embaralhar(data.itens);
        definirItens(atual => cursor ? [...atual, ...lote] : lote);
        definirAtivo(atual => atual || lote[0]?._id || null);
        definirProximo(data.proximo);
        definirEstado('pronto');
      }).catch(() => { if (!controller.signal.aborted) definirEstado('erro'); });
    return () => controller.abort();
  }, [cursor, tentativa]);

  useEffect(() => {
    const acompanhar = () => definirVisibilidade(!document.hidden);
    document.addEventListener('visibilitychange', acompanhar);
    return () => document.removeEventListener('visibilitychange', acompanhar);
  }, []);

  useEffect(() => {
    const area = trilho.current;
    if (!area || !itens.length || !window.IntersectionObserver) return;
    const medirTrilho = new IntersectionObserver(([registro]) => definirTrilhoVisivel(registro.isIntersecting), { threshold: .15 });
    medirTrilho.observe(area);
    const observar = new IntersectionObserver(entries => {
      const atual = entries.find(registro => registro.intersectionRatio >= .64);
      if (atual) definirAtivo(atual.target.dataset.lance);
      else if (entries.some(registro => registro.target.dataset.lance === area.dataset.ativo))
        definirAtivo(null);
    }, { root: area, threshold: [.64] });
    for (const artigo of area.querySelectorAll('[data-lance]')) observar.observe(artigo);
    return () => { observar.disconnect(); medirTrilho.disconnect(); };
  }, [itens]);

  useEffect(() => {
    if (estado === 'pronto' && proximo && posicao >= Math.max(0, itens.length - 2)) definirCursor(proximo);
  }, [estado, proximo, posicao, itens.length]);

  function ir(delta) {
    const indice = Math.min(itens.length - 1, Math.max(0, posicao + delta));
    const alvo = itens[indice]?._id;
    if (!alvo) return;
    if (!window.IntersectionObserver) definirAtivo(alvo);
    const area = trilho.current;
    const slide = area.querySelector('[data-lance="' + alvo + '"]');
    if (slide) area.scrollTo({ top: area.scrollTop + slide.getBoundingClientRect().top - area.getBoundingClientRect().top,
      behavior: movimentoReduzido.current ? 'instant' : 'smooth' });
  }

  return <>
    <Link className="momento-voltar" to="/momentos"><FaArrowLeft aria-hidden/> Momentos</Link>
    <div className="lances-topo">
      <div><h1>Lances do Intergil</h1><p>Role para descobrir outro momento da AGR TV.</p></div>
      {itens.length > 0 && <button type="button" className="arm-botao arm-botao-contorno" aria-pressed={som}
        onClick={() => definirSom(valor => !valor)}>{som ? <FaVolumeUp aria-hidden/> : <FaVolumeMute aria-hidden/>}
        {som ? 'Som ligado' : 'Som desligado'}</button>}
    </div>
    {itens.length > 0 && <div className="lances-layout">
      <div className="lances-trilho" ref={trilho} data-ativo={ativo || ''} tabIndex={0} role="region" aria-label="Vídeos de Lances"
        onKeyDown={evento => {
          if (evento.target !== evento.currentTarget || !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(evento.key)) return;
          evento.preventDefault(); ir(['ArrowDown', 'PageDown'].includes(evento.key) ? 1 : -1);
        }}>
        {itens.map(item => <Lance key={item._id} item={item} ativo={paginaVisivel && trilhoVisivel && ativo === item._id}
          som={som} autoplay={!movimentoReduzido.current} catalogo={catalogo}/>)}
      </div>
      <nav className="lances-navegacao" aria-label="Passar entre lances">
        <button type="button" aria-label="Lance anterior" onClick={() => ir(-1)} disabled={posicao <= 0}><FaArrowUp aria-hidden/></button>
        <button type="button" aria-label="Próximo lance" onClick={() => ir(1)} disabled={posicao === itens.length - 1}><FaArrowDown aria-hidden/></button>
      </nav>
    </div>}
    {estado === 'carregando' && <p className="momentos-estado" role="status">Carregando lances…</p>}
    {estado === 'pronto' && !itens.length && <p className="momentos-estado">Os lances da AGR TV vão aparecer aqui.</p>}
    {estado === 'erro' && <p className="momentos-estado" role="alert">Falha ao carregar os lances.
      {' '}<button className="arm-botao arm-botao-contorno" type="button" onClick={() => tentar(n => n + 1)}>Tentar novamente</button>
    </p>}
  </>;
}

function Lance({ item, ativo, som, autoplay, catalogo }) {
  const palco = useRef(null);
  const video = useRef(null);
  const [aviso, avisar] = useState('');
  const midia = item.midias[0];
  const modalidade = catalogo?.modalidades.find(registro => registro._id === item.modalidade);
  const deitado = midia.largura > midia.altura;

  useEffect(() => {
    if (!ativo) avisar('');
  }, [ativo]);

  return <article className="lance" data-lance={item._id} aria-label={item.titulo}>
    <div className="lance-palco" ref={palco}>
      {ativo ? <video ref={video} src={assetURL(midia.url)} poster={midia.capa ? assetURL(midia.capa) : undefined}
        preload="none" autoPlay={autoplay} muted={!som} playsInline controls aria-label={item.titulo}
        onError={() => avisar('O vídeo está indisponível agora. Passe para outro lance ou abra o registro.')}/> :
        midia.capa && <img src={assetURL(midia.capa)} loading="lazy" alt=""/>}
      {ativo && <button type="button" className="lance-cheia" onClick={async () => {
        try { await telaCheia(palco.current, video.current, deitado); }
        catch { avisar('Use o controle do player ou gire o celular para ampliar.'); }
      }}><FaExpand aria-hidden/> {deitado ? 'Ver na horizontal' : 'Tela cheia'}</button>}
    </div>
    <div className="lance-texto">
      <small>{[modalidade?.nome, item.formato].filter(Boolean).join(' · ') || 'AGR TV'}</small>
      <h2><Link to={'/momentos/' + item._id} state={{ voltar: '/momentos/lances' }}>{item.titulo}</Link></h2>
      {aviso && <p role="status">{aviso}</p>}
      <CreditosTurmas ids={item.salas} catalogo={catalogo}/>
    </div>
  </article>;
}
