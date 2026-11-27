import React, { useEffect, useState } from 'react';
import TituloArmorial from '../../components/TituloArmorial';
import { useLocation, useParams, Link } from 'react-router-dom';
import { FaDownload, FaArrowLeft, FaArrowRight, FaStream } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import './style.css';

function LinkDocumento({ url, titulo, formato }) {
  if (!url || url === '#') return <span className="modalidade-documento-pendente">
    <strong>{titulo}</strong><small>Aguardando publicação</small>
  </span>;
  const href = assetURL(url);
  const baixar = /\.pdf(?:[?#]|$)/i.test(url) && new URL(href, window.location.origin).origin === window.location.origin;
  const texto = (baixar ? 'Baixar ' : 'Abrir ') + titulo.toLocaleLowerCase('pt-BR');
  return <a className="arm-botao arm-botao-contorno" href={href}
    download={baixar || undefined} target={baixar ? undefined : '_blank'} rel={baixar ? undefined : 'noreferrer'}
    aria-label={formato ? `${texto} · ${formato}` : undefined}>
    {baixar ? <FaDownload aria-hidden="true"/> : <FaStream aria-hidden="true"/>}{texto}
  </a>;
}

export default function ModalidadeDetalhe() {
  const { slug } = useParams();
  const { config } = useConfig();
  const { state } = useLocation();
  const [resultado, definirResultado] = useState(null);
  const [tentativa, tentar] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.get('/modalidades', { signal: controller.signal }).then(({ data: lista }) => {
      const indice = lista.findIndex(modalidade => modalidade.slug === slug);
      definirResultado({ slug, tentativa, modalidade: lista[indice], vizinhas: indice < 0 || lista.length < 2 ? [] :
        [lista[(indice + lista.length - 1) % lista.length], lista[(indice + 1) % lista.length]] });
    }).catch(() => { if (!controller.signal.aborted) definirResultado({ slug, tentativa, erro: true }); });
    return () => controller.abort();
  }, [slug, tentativa]);

  const voltar = <Link to={{ pathname: '/', search: state?.buscaCarrossel || '', hash: '#modalidades' }} className="modalidade-voltar"><FaArrowLeft aria-hidden="true"/> Modalidades</Link>;
  if (resultado?.slug !== slug || resultado?.tentativa !== tentativa) return <section className="modalidade-armoriar"><p role="status">Carregando modalidade…</p></section>;
  if (resultado.erro || !resultado.modalidade) return <section className="modalidade-armoriar">
    {voltar}<h1>{resultado.erro ? 'Falha ao carregar' : 'Modalidade não encontrada'}</h1>
    {resultado.erro && <button type="button" className="arm-botao" onClick={() => tentar(tentativa + 1)}>Tentar novamente</button>}
  </section>;

  const { modalidade, vizinhas } = resultado;
  const capaPadrao = `/images/gravuras/${modalidade.slug}.webp`;
  const bannerPadrao = `/images/gravuras/banners/${modalidade.slug}.webp`;
  const banner = !modalidade.imgDetalhe || modalidade.imgDetalhe === capaPadrao ? bannerPadrao : modalidade.imgDetalhe;
  const fechada = Date.now() >= Date.parse(config.fimInscricoes);
  return <article className="modalidade-armoriar">
    {voltar}
    <div className="modalidade-topo">
      <div>
        <p className="arm-sobrelinha">{modalidade.categoria || 'Modalidade'}</p>
        <h1><TituloArmorial arte={`jogo-${modalidade.slug}`}>{modalidade.nome}</TituloArmorial></h1>
      </div>
      <div className="modalidade-acoes">
        <Link className="arm-botao" to={fechada ? '/meu-perfil' : '/inscricao'}>
          {fechada ? 'Ver minha inscrição' : 'Inscrever-se'}<FaArrowRight aria-hidden="true"/>
        </Link>
        <a className="arm-botao arm-botao-contorno" href="#modalidade-documentos">Edital e chaveamento</a>
        <Link className="arm-botao arm-botao-contorno" to={`/momentos/albuns?album=${modalidade._id}`}>
          Ver cobertura
        </Link>
      </div>
    </div>
    <img key={banner} className="modalidade-banner" width="1040" height="585" alt="" src={assetURL(banner)}
      onError={e => {
        if (!e.currentTarget.src.endsWith('/moldura-armorial.webp')) e.currentTarget.src = '/images/marca/moldura-armorial.webp';
      }}/>
    <section className="modalidade-opcoes" id="modalidade-documentos">
      <h2>Edital e chaveamento</h2>
      <div className="modalidade-acoes">
        <LinkDocumento url={modalidade.linkEdital} titulo="Edital geral da modalidade"/>
        <LinkDocumento url={modalidade.linkChaveamento} titulo="Chaveamento geral"/>
      </div>
    </section>
    {!!modalidade.submodalidades?.length && <section className="modalidade-opcoes">
      <h2>Formatos de participação</h2>
      <ul>{[...modalidade.submodalidades].sort((a, b) => Number(!!b.isPrincipal) - Number(!!a.isPrincipal)).map(opcao => <li key={opcao.nome}>
        <div><strong>{opcao.nome}</strong>
          <span>{opcao.isPrincipal && 'Principal · '}{opcao.max_inscritos == null ? 'Livre' : `${opcao.max_inscritos} por turma`}</span>
        </div>
        <div className="modalidade-acoes">
          <LinkDocumento url={opcao.edital} titulo="Edital" formato={opcao.nome}/>
          <LinkDocumento url={opcao.chaveamento} titulo="Chaveamento" formato={opcao.nome}/>
        </div>
      </li>)}</ul>
    </section>}
    {!!vizinhas.length && <nav className="modalidade-vizinhas" aria-label="Outras modalidades">
      <Link to={'/modalidade/' + vizinhas[0].slug} state={state}><FaArrowLeft aria-hidden="true"/> {vizinhas[0].nome}</Link>
      <Link to={'/modalidade/' + vizinhas[1].slug} state={state}>{vizinhas[1].nome} <FaArrowRight aria-hidden="true"/></Link>
    </nav>}
  </article>;
}
