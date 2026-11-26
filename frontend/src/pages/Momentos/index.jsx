import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaExpand, FaInstagram, FaPlay, FaRegImages } from 'react-icons/fa';
import TituloArmorial from '../../components/TituloArmorial';
import api, { assetURL } from '../../api';
import './style.css';

const rota = '/acervo-momentos';
const tipos = { foto: 'Álbum', video: 'Vídeo' };
const assuntos = { evento: 'Evento', modalidade: 'Modalidade', mascote: 'Dança de mascote', danca: 'Dança geral' };
const instagram = 'https://www.instagram.com/agr.tv_/';
const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Fortaleza' });

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

function Capa({ item, destaque = false }) {
  const capa = item.midias[0]?.capa;
  const Icone = item.tipo === 'video' ? FaPlay : FaRegImages;
  return <div className="momento-capa">
    {capa && <img src={assetURL(capa)} loading={destaque ? 'eager' : 'lazy'} alt=""
      decoding="async" onError={e => { e.currentTarget.hidden = true; }}/>}
    <span className="momento-tipo"><Icone aria-hidden/>{item.tipo === 'video' ? (item.lance ? 'Lance' : 'Vídeo') :
      item.midias.length + (item.midias.length === 1 ? ' foto' : ' fotos')}</span>
  </div>;
}

export default function Momentos() {
  const { id } = useParams();
  const [busca, definirBusca] = useSearchParams();
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
    {id ? <Detalhe key={id} id={id} busca={busca} catalogo={catalogo}/> : <>
      <div className="momentos-topo">
        <div><h1><TituloArmorial arte="momentos">Momentos do Intergil</TituloArmorial></h1>
          <p>Fotos e vídeos dos jogos, das danças e da torcida.</p></div>
        <a href={instagram} target="_blank" rel="noreferrer"><FaInstagram aria-hidden/> Cobertura da AGR TV</a>
      </div>
      <Acervo key={busca.toString()} busca={busca} definirBusca={definirBusca} catalogo={catalogo}/>
      {falhaCatalogo && <p role="status">Não foi possível carregar os filtros. <button type="button"
        className="arm-botao arm-botao-contorno" onClick={() => definirTentativaCatalogo(n => n + 1)}>Tentar novamente</button></p>}
    </>}
  </section>;
}

function Acervo({ busca, definirBusca, catalogo }) {
  const [itens, definirItens] = useState([]);
  const [proximo, definirProximo] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [erro, definirErro] = useState('');
  const [tentativa, tentar] = useState(0);
  const [cursor, definirCursor] = useState(null);
  const tipo = busca.get('tipo') === 'video' ? 'video' : 'foto';
  const lance = busca.get('lance') === '1';
  const assunto = busca.get('assunto') || '';
  const modalidade = busca.get('modalidade') || '';
  const sala = busca.get('sala') || '';
  const search = busca.toString();

  useEffect(() => {
    const controller = new AbortController();
    definirCarregando(true); definirErro('');
    api.get(rota, { params: { tipo, assunto, modalidade, sala, lance: lance ? '1' : '', antes: cursor }, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          definirItens(anteriores => cursor ? [...anteriores, ...data.itens] : data.itens);
          definirProximo(data.proximo); definirCarregando(false);
        }
      }).catch(() => {
        if (!controller.signal.aborted) { definirErro('Não foi possível carregar os momentos.'); definirCarregando(false); }
      });
    return () => controller.abort();
  }, [search, cursor, tentativa]);

  function mudar(opcoes) {
    const proxima = new URLSearchParams(busca);
    for (const [chave, valor] of Object.entries(opcoes)) {
      if (valor) proxima.set(chave, valor);
      else proxima.delete(chave);
    }
    definirBusca(proxima, { preventScrollReset: true });
  }

  const volta = search ? '?' + search : '';
  const destaque = !cursor && !lance && !assunto && !modalidade && !sala && itens[0]?.midias[0]?.capa ? itens[0]._id : null;
  return <>
    <div className="momentos-abas" role="group" aria-label="Tipo de publicação">
      <button type="button" aria-pressed={tipo === 'foto'} onClick={() => mudar({ tipo: '', lance: '' })}>Álbuns de fotos</button>
      <button type="button" aria-pressed={tipo === 'video' && !lance} onClick={() => mudar({ tipo: 'video', lance: '' })}>Vídeos</button>
      <button type="button" aria-pressed={lance} onClick={() => mudar({ tipo: 'video', lance: '1' })}><FaPlay aria-hidden/> Lances</button>
    </div>
    <div className="momentos-filtros">
      <label>Assunto
        <select value={assunto} onChange={e => mudar({ assunto: e.target.value, modalidade: '' })}>
          <option value="">Todos</option>
          {Object.entries(assuntos).map(([chave, nome]) => <option key={chave} value={chave}>{nome}</option>)}
        </select>
      </label>
      <label>Modalidade
        <select value={modalidade} disabled={!catalogo || Boolean(assunto && assunto !== 'modalidade')}
          onChange={e => mudar({ modalidade: e.target.value, assunto: e.target.value ? 'modalidade' : assunto })}>
          <option value="">Todas</option>
          {catalogo?.modalidades.map(item => <option key={item._id} value={item._id}>{item.nome}</option>)}
        </select>
      </label>
      <label>Turma
        <select value={sala} disabled={!catalogo} onChange={e => mudar({ sala: e.target.value })}>
          <option value="">Todas</option>
          {catalogo?.salas.map(item => <option key={item._id} value={item._id}>{item.turma} · {item.nome}</option>)}
        </select>
      </label>
    </div>

    {itens.length > 0 && <ul className={'grade-momentos' + (lance ? ' grade-lances' : '')}>
      {itens.map(item => <li key={item._id} className={item._id === destaque ? 'momento-destaque' : ''}>
        <Link to={'/momentos/' + item._id + volta} state={lance ? { lances: itens.map(clip => clip._id) } : null} className="momento-card">
          <Capa item={item} destaque={item._id === destaque}/>
          <div className="momento-card-texto">
            <small>{rotulo(item, catalogo)}{item.publicadoEm && ' · ' + dataCurta.format(Date.parse(item.publicadoEm))}</small>
            <h2>{item.titulo}</h2>
            {item.tema && <p>{item.tema}</p>}
          </div>
        </Link>
      </li>)}
    </ul>}
    {carregando && <p className="momentos-estado" role="status">Carregando momentos…</p>}
    {erro && <div className="momentos-estado" role="alert"><p>{erro}</p>
      <button className="arm-botao arm-botao-contorno" type="button" onClick={() => tentar(n => n + 1)}>Tentar novamente</button></div>}
    {!carregando && !erro && itens.length === 0 && <p className="momentos-estado">
      {assunto || modalidade || sala ? 'Nenhuma publicação para esses filtros.' :
        lance ? 'Os lances da AGR TV vão aparecer aqui.' : tipo === 'foto' ? 'Os álbuns de fotos vão aparecer aqui.' : 'Os vídeos vão aparecer aqui.'}
    </p>}
    {proximo && !erro && <button className="arm-botao arm-botao-contorno" type="button" disabled={carregando}
      onClick={() => definirCursor(proximo)}>Carregar mais</button>}
  </>;
}

function Detalhe({ id, busca, catalogo }) {
  const { state } = useLocation();
  const navegar = useNavigate();
  const [item, definirItem] = useState(null);
  const [erro, definirErro] = useState('');
  const [tentativa, tentar] = useState(0);
  const [indice, definirIndice] = useState(0);
  const [aberto, abrir] = useState(Boolean(state?.reproduzir));
  const volta = '/momentos' + (busca.size ? '?' + busca.toString() : item?.tipo === 'video' ? '?tipo=video' : '');

  useEffect(() => {
    const controller = new AbortController();
    api.get(rota + '/' + id, { signal: controller.signal }).then(({ data }) => definirItem(data))
      .catch(falha => { if (!controller.signal.aborted) definirErro(falha.response?.status === 404 ?
        'Esta publicação não está disponível.' : 'Não foi possível carregar este momento.'); });
    return () => controller.abort();
  }, [id, tentativa]);

  const turmas = item?.salas.map(sala => catalogo?.salas.find(turma => turma._id === sala)).filter(Boolean);
  const midia = item?.midias[indice];
  const lances = state?.lances || [];
  const posicao = lances.indexOf(id);
  function trocarLance(n) {
    const destino = lances[posicao + n];
    if (destino) navegar('/momentos/' + destino + '?' + busca.toString(), {
      replace: true, state: { lances, reproduzir: true }
    });
  }
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
          {turmas.length > 0 && <ul className="momento-turmas">{turmas.map(turma => <li key={turma._id}>{turma.turma} · {turma.nome}</li>)}</ul>}
        </header>
        {midia && <button className="momento-abrir" type="button" onClick={() => abrir(true)}>
          <Capa item={{ ...item, midias: [midia] }} destaque/>
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
    {aberto && midia && <Visor item={item} indice={indice} definirIndice={definirIndice} fechar={() => abrir(false)}
      anteriorLance={posicao > 0 ? () => trocarLance(-1) : null}
      proximoLance={posicao >= 0 && posicao < lances.length - 1 ? () => trocarLance(1) : null}/>}
  </>;
}

function Visor({ item, indice, definirIndice, fechar, anteriorLance, proximoLance }) {
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
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (video?.webkitEnterFullscreen && /iPhone|iPad/.test(navigator.userAgent)) video.webkitEnterFullscreen();
      else if (ref.current.firstElementChild.requestFullscreen) await ref.current.firstElementChild.requestFullscreen();
      else avisar('A mídia já ocupa o espaço disponível neste navegador.');
    } catch { avisar('Use o botão de tela cheia no player.'); }
  }

  return <dialog className="visor-momento" ref={ref} aria-label={item.titulo} onCancel={e => { e.preventDefault(); fechar(); }}
    onKeyDown={e => { if (total > 1 && ['ArrowLeft', 'ArrowRight'].includes(e.key)) mover(e.key === 'ArrowRight' ? 1 : -1); }}>
    <div className="conteudo-visor" onTouchStart={e => {
      if (item.lance && !e.target.closest('button')) origemToque.current = e.touches[0].clientY;
    }} onTouchEnd={e => {
      if (!item.lance || origemToque.current == null) return;
      const distancia = origemToque.current - e.changedTouches[0].clientY;
      origemToque.current = null;
      if (Math.abs(distancia) > 65) (distancia > 0 ? proximoLance : anteriorLance)?.();
    }}>
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
      {item.lance && (anteriorLance || proximoLance) && <nav aria-label="Lances">
        <button type="button" disabled={!anteriorLance} onClick={anteriorLance}>Lance anterior</button>
        <button type="button" disabled={!proximoLance} onClick={proximoLance}>Próximo lance</button>
      </nav>}
      {aviso && <p role="status">{aviso}</p>}
    </div>
  </dialog>;
}
