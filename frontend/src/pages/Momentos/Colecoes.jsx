import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaExpand, FaPlay, FaRegImages } from 'react-icons/fa';
import api, { assetURL } from '../../api';

const rota = '/acervo-momentos';
const ordenar = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const danças = [
  { assunto: 'danca', nome: 'Dança geral' },
  { assunto: 'mascote', nome: 'Dança do mascote' }
];

export function CreditosTurmas({ ids = [], catalogo }) {
  const salas = ids.map(id => catalogo?.salas?.find(item => item._id === id)).filter(Boolean);
  if (!salas.length) return null;
  return <ul className="momento-creditos-turmas" aria-label="Turmas participantes">
    {salas.map(sala => <li key={sala._id}><Link to={'/momentos/turmas/' + sala._id}>
      {sala.logo_url && <img src={assetURL(sala.logo_url)} alt="" width="32" height="32" loading="lazy"/>}
      <span>{sala.nome}<small>{sala.turma}</small></span>
    </Link></li>)}
  </ul>;
}

export function PerfisTurmas({ catalogo }) {
  if (!catalogo?.salas.length) return null;
  return <section className="momento-perfis" aria-labelledby="momento-turmas-titulo">
    <div className="momento-perfis-topo">
      <h2 id="momento-turmas-titulo">Turmas</h2>
      <Link to="/momentos/albuns">Todos os álbuns <FaChevronRight aria-hidden/></Link>
    </div>
    <ul className="momento-perfis-lista">
      {catalogo.salas.map(sala => <li key={sala._id}><Link to={'/momentos/turmas/' + sala._id}>
        {sala.logo_url ? <img src={assetURL(sala.logo_url)} alt="" width="64" height="64" loading="lazy"/> :
          <span className="momento-brasao-texto" aria-hidden>{sala.nome.slice(0, 2)}</span>}
        <strong>{sala.nome}</strong><small>{sala.turma}</small>
      </Link></li>)}
    </ul>
  </section>;
}

export default function Colecoes({ catalogo, salaId, Visor }) {
  const [busca] = useSearchParams();
  const sala = catalogo?.salas.find(item => item._id === salaId);
  const [dados, definirDados] = useState(null);
  const [erro, definirErro] = useState(false);
  const [tentativa, tentar] = useState(0);
  const perfil = salaId ? '/momentos/turmas/' + salaId : '/momentos/albuns';
  const aba = ['videos', 'dancas'].includes(busca.get('aba')) ? busca.get('aba') : 'fotos';
  const tipo = aba === 'videos' ? 'video' : 'foto';
  const id = busca.get('album');
  const modalidade = catalogo?.modalidades.find(item => String(item._id) === id);
  const formato = modalidade?.submodalidades?.find(item => item.nome === busca.get('formato'))?.nome;
  const dança = aba === 'dancas' && danças.find(item => item.assunto === id);
  const exibirModalidade = aba !== 'dancas' && modalidade;

  useEffect(() => {
    if (!catalogo || (salaId && !sala) || exibirModalidade || dança) return;
    const controller = new AbortController();
    definirErro(false);
    api.get(rota + '/colecoes', { params: { sala: salaId }, signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) definirDados(data);
    }).catch(() => { if (!controller.signal.aborted) definirErro(true); });
    return () => controller.abort();
  }, [catalogo, salaId, sala, exibirModalidade, dança, tentativa]);

  function link(alvo, album, sub) {
    const proximos = new URLSearchParams({ aba: alvo });
    if (album) proximos.set('album', album);
    if (sub) proximos.set('formato', sub);
    return perfil + '?' + proximos.toString();
  }

  const voltar = <Link to="/momentos" className="momento-voltar"><FaArrowLeft aria-hidden/> Momentos</Link>;
  if (!catalogo) return <>{voltar}<p className="momentos-estado" role="status">Carregando catálogo…</p></>;
  if (salaId && !sala) return <>{voltar}<h1>Turma não encontrada</h1></>;

  return <>
    {voltar}
    <header className="momento-perfil-topo">
      {sala?.logo_url && <img src={assetURL(sala.logo_url)} alt="" width="92" height="92"/>}
      <div>{sala && <p>{sala.turma}</p>}<h1>{sala?.nome || 'Álbuns do Intergil'}</h1></div>
    </header>
    <nav className="momentos-abas" aria-label="Coleções de Momentos">
      {[['fotos', 'Álbuns de fotos'], ['videos', 'Vídeos'], ['dancas', 'Danças']].map(([valor, nome]) =>
        <Link key={valor} to={link(valor)} aria-current={aba === valor ? 'page' : undefined}>{nome}</Link>)}
      {!sala && <Link to="/momentos/lances"><FaPlay aria-hidden/> Lances</Link>}
    </nav>

    {exibirModalidade || dança ? <>
      <Link className="momento-voltar momento-colecao-voltar" to={link(aba)}><FaArrowLeft aria-hidden/> Voltar aos álbuns</Link>
      <ConteudoColecao key={[salaId, aba, id, formato].join('/')} catalogo={catalogo} Visor={Visor} voltar={link(aba, id, formato)}
        titulo={dança?.nome || [modalidade.nome, formato].filter(Boolean).join(' · ')}
        filtros={{ assunto: dança?.assunto || 'modalidade', tipo: dança ? undefined : tipo,
          sala: salaId, modalidade: exibirModalidade?._id, formato }}/>
    </> : <>
      {erro && <p className="momentos-estado" role="alert">Não foi possível carregar as capas.
        {' '}<button className="arm-botao arm-botao-contorno" type="button" onClick={() => tentar(n => n + 1)}>Tentar novamente</button>
      </p>}
      {!dados && !erro && <p className="momentos-estado" role="status">Carregando álbuns…</p>}
      {aba === 'dancas' ? <ul className="momento-colecoes-grade">
        {danças.map(item => {
          const encontrados = (dados || []).filter(registro => registro.assunto === item.assunto);
          return <li key={item.assunto}><CartaoColecao nome={item.nome} to={link(aba, item.assunto)}
            capa={encontrados.find(registro => registro.capa)?.capa}
            total={dados ? encontrados.reduce((soma, registro) => soma + registro.total, 0) : null}/></li>;
        })}
      </ul> : <ul className="momento-colecoes-grade">
        {[...catalogo.modalidades].sort((a, b) => ordenar.compare(a.nome, b.nome)).map(item => {
          const encontrados = (dados || []).filter(registro => registro.assunto === 'modalidade' &&
            registro.modalidade === item._id && registro.tipo === tipo);
          const formatos = [...(item.submodalidades || [])].sort((a, b) => ordenar.compare(a.nome, b.nome));
          return <li key={item._id}>
            <CartaoColecao nome={item.nome} contexto={item.categoria} to={link(aba, item._id)}
              capa={encontrados.find(registro => registro.capa)?.capa || item.imgCarrossel}
              total={dados ? encontrados.reduce((soma, registro) => soma + registro.total, 0) : null} tipo={tipo}/>
            {formatos.length > 0 && <ul className="momento-formatos" aria-label={'Formatos de ' + item.nome}>
              {formatos.map(({ nome }) => <li key={nome}><Link to={link(aba, item._id, nome)}>
                <span>{nome}</span><small>{dados && (encontrados.find(registro => registro.formato === nome)?.total || 0)}</small>
              </Link></li>)}
            </ul>}
          </li>;
        })}
      </ul>}
    </>}
  </>;
}

function CartaoColecao({ nome, contexto, capa, total, to, tipo }) {
  return <Link className="momento-colecao-cartao" to={to}>
    {capa && <img src={assetURL(capa)} alt="" width="72" height="72" loading="lazy" onError={e => { e.currentTarget.hidden = true; }}/>}
    <span>{contexto && <small>{contexto}</small>}<strong>{nome}</strong>
      {total != null && <small>{!total ? 'Sem registros' : tipo === 'foto' ? total + (total === 1 ? ' foto' : ' fotos') :
        tipo === 'video' ? total + (total === 1 ? ' vídeo' : ' vídeos') : total + (total === 1 ? ' registro' : ' registros')}</small>}
    </span><FaChevronRight aria-hidden/>
  </Link>;
}

function ConteudoColecao({ catalogo, Visor, titulo, filtros, voltar }) {
  const [itens, definirItens] = useState([]);
  const [proximo, definirProximo] = useState(null);
  const [estado, definirEstado] = useState('carregando');
  const [cursor, definirCursor] = useState(null);
  const [tentativa, tentar] = useState(0);
  const [indice, definirIndice] = useState(0);
  const [aberto, abrir] = useState(false);
  const origem = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    definirEstado('carregando');
    api.get(rota, { params: { ...filtros, antes: cursor }, signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      definirItens(anteriores => cursor ? [...anteriores, ...data.itens] : data.itens);
      definirProximo(data.proximo); definirEstado('pronto');
    }).catch(() => { if (!controller.signal.aborted) definirEstado('erro'); });
    return () => controller.abort();
  }, [cursor, tentativa]);

  const fotos = itens.filter(item => item.tipo === 'foto').flatMap(item => item.midias.map(midia => ({ ...midia, item })));
  const videos = itens.filter(item => item.tipo === 'video');
  const ativa = fotos[indice];
  const mover = delta => definirIndice(atual => Math.max(0, Math.min(fotos.length - 1, atual + delta)));
  return <section className="momento-conteudo-colecao">
    <h2>{titulo}</h2>
    {ativa && <div className="momento-carrossel-fotos">
      <div className="momento-carrossel-palco" onPointerDown={evento => {
        if (evento.button !== 0) return;
        origem.current = { x: evento.clientX, y: evento.clientY };
        evento.currentTarget.setPointerCapture?.(evento.pointerId);
      }} onPointerUp={evento => {
        if (!origem.current) return;
        const dx = evento.clientX - origem.current.x;
        const dy = evento.clientY - origem.current.y;
        origem.current = null;
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? 1 : -1);
      }} onPointerCancel={() => { origem.current = null; }}>
        <img src={assetURL(ativa.url)} alt={ativa.item.titulo + ' · foto ' + (indice + 1)} draggable="false"
          onError={e => { e.currentTarget.hidden = true; }} key={ativa._id}/>
      </div>
      <div className="momento-carrossel-controles">
        <button type="button" aria-label="Foto anterior" onClick={() => mover(-1)} disabled={indice === 0}><FaChevronLeft aria-hidden/></button>
        <span aria-live="polite">{indice + 1} de {fotos.length} fotos carregadas</span>
        <button type="button" aria-label="Próxima foto" onClick={() => mover(1)} disabled={indice + 1 === fotos.length}><FaChevronRight aria-hidden/></button>
        <button type="button" className="momento-cheia" onClick={() => abrir(true)}><FaExpand aria-hidden/> Tela cheia</button>
      </div>
      <p className="momento-legenda">{ativa.item.legenda || ativa.item.titulo}</p>
      <CreditosTurmas ids={ativa.item.salas} catalogo={catalogo}/>
    </div>}
    {videos.length > 0 && <ul className="grade-momentos">
      {videos.map(item => <li key={item._id}><Link className="momento-card" to={'/momentos/' + item._id} state={{ voltar }}>
        <div className="momento-capa">
          {item.midias[0]?.capa && <img src={assetURL(item.midias[0].capa)} alt="" loading="lazy"/>}
          <span className="momento-tipo"><FaPlay aria-hidden/> Vídeo</span>
        </div>
        <div className="momento-card-texto"><h3>{item.titulo}</h3>{item.tema && <p>{item.tema}</p>}</div>
      </Link><CreditosTurmas ids={item.salas} catalogo={catalogo}/></li>)}
    </ul>}
    {estado === 'carregando' && <p role="status" className="momentos-estado">Carregando registros…</p>}
    {estado === 'pronto' && !itens.length && <p className="momentos-estado">
      <FaRegImages aria-hidden/> As publicações deste álbum vão aparecer aqui.
    </p>}
    {estado === 'erro' && <p role="alert" className="momentos-estado">Falha ao carregar o álbum.
      {' '}<button type="button" className="arm-botao arm-botao-contorno" onClick={() => tentar(n => n + 1)}>Tentar novamente</button>
    </p>}
    {proximo && estado === 'pronto' && <button type="button" className="arm-botao arm-botao-contorno"
      onClick={() => definirCursor(proximo)}>Carregar mais</button>}
    {aberto && ativa && <Visor item={{ titulo, tipo: 'foto', midias: fotos }} indice={indice}
      definirIndice={definirIndice} fechar={() => abrir(false)}/>}
  </section>;
}
