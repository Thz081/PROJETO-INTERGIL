import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaDownload, FaArrowLeft, FaArrowRight, FaStream } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import './style.css';

function LinkDocumento({ url, children }) {
  if (!url || url === '#') return null;
  return <a className="arm-botao arm-botao-contorno" href={assetURL(url)} target="_blank" rel="noreferrer">
    {url.toLowerCase().endsWith('.pdf') ? <FaDownload aria-hidden="true"/> : <FaStream aria-hidden="true"/>}{children}
  </a>;
}

export default function ModalidadeDetalhe() {
  const { slug } = useParams();
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

  const voltar = <Link to="/#modalidades" className="modalidade-voltar"><FaArrowLeft aria-hidden="true"/> Modalidades</Link>;
  if (resultado?.slug !== slug || resultado?.tentativa !== tentativa) return <section className="modalidade-armoriar"><p role="status">Carregando modalidade…</p></section>;
  if (resultado.erro || !resultado.modalidade) return <section className="modalidade-armoriar">
    {voltar}<h1>{resultado.erro ? 'Falha ao carregar' : 'Modalidade não encontrada'}</h1>
    {resultado.erro && <button type="button" className="arm-botao" onClick={() => tentar(tentativa + 1)}>Tentar novamente</button>}
  </section>;

  const { modalidade, vizinhas } = resultado;
  const capaPadrao = `/images/gravuras/${modalidade.slug}.webp`;
  const bannerPadrao = `/images/gravuras/banners/${modalidade.slug}.webp`;
  const banner = !modalidade.imgDetalhe || modalidade.imgDetalhe === capaPadrao ? bannerPadrao : modalidade.imgDetalhe;
  const fechada = Date.now() >= Date.parse('2026-12-02T00:00:00-03:00');
  return <article className="modalidade-armoriar">
    {voltar}
    <div className="modalidade-topo">
      <div>
        <p className="arm-sobrelinha">{modalidade.categoria || 'Modalidade'}</p>
        <h1>{modalidade.nome}</h1>
      </div>
      <div className="modalidade-acoes">
        <Link className="arm-botao" to={fechada ? '/meu-perfil' : '/inscricao'}>
          {fechada ? 'Ver minha inscrição' : 'Inscrever-se'}<FaArrowRight aria-hidden="true"/>
        </Link>
        <LinkDocumento url={modalidade.linkEdital}>Edital da modalidade</LinkDocumento>
        <LinkDocumento url={modalidade.linkChaveamento}>Chaveamento</LinkDocumento>
      </div>
    </div>
    <img key={banner} className="modalidade-banner" width="1040" height="585" alt="" src={assetURL(banner)}
      onError={e => {
        if (!e.currentTarget.src.endsWith('/moldura-armorial.webp')) e.currentTarget.src = '/images/marca/moldura-armorial.webp';
      }}/>
    {!!modalidade.submodalidades?.length && <section className="modalidade-opcoes">
      <h2>Formatos de participação</h2>
      <ul>{modalidade.submodalidades.map(opcao => <li key={opcao.nome}>
        <div><strong>{opcao.nome}</strong>
          <span>{opcao.max_inscritos == null ? 'Livre' : `${opcao.max_inscritos} por turma`}</span>
        </div>
        <div className="modalidade-acoes">
          <LinkDocumento url={opcao.edital}>Edital</LinkDocumento><LinkDocumento url={opcao.chaveamento}>Chaveamento</LinkDocumento>
        </div>
      </li>)}</ul>
    </section>}
    {!!vizinhas.length && <nav className="modalidade-vizinhas" aria-label="Outras modalidades">
      <Link to={'/modalidade/' + vizinhas[0].slug}><FaArrowLeft aria-hidden="true"/> {vizinhas[0].nome}</Link>
      <Link to={'/modalidade/' + vizinhas[1].slug}>{vizinhas[1].nome} <FaArrowRight aria-hidden="true"/></Link>
    </nav>}
  </article>;
}
