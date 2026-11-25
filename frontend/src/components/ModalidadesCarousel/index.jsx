import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { assetURL } from '../../api';
import './style.css';

const todas = 'Todas as categorias';
const categoriaDe = modalidade => modalidade.categoria || 'Outras modalidades';

export default function ModalidadesCarousel({ modalidades, estado, recarregar }) {
  const [busca, definirBusca] = useSearchParams();
  const [posicao, definirPosicao] = useState({ anterior: false, proxima: false });
  const trilho = useRef(null);
  const id = useId();
  const categorias = [...new Set(modalidades.map(categoriaDe))];
  const filtro = busca.get('categoria');
  const categoria = categorias.includes(filtro) ? filtro : todas;
  const exibidas = categoria === todas ? modalidades : modalidades.filter(modalidade => categoriaDe(modalidade) === categoria);

  useEffect(() => {
    const elemento = trilho.current;
    if (!elemento) return;
    const atualizar = () => definirPosicao({
      anterior: elemento.scrollLeft > 2,
      proxima: elemento.scrollLeft < elemento.scrollWidth - elemento.clientWidth - 2
    });
    atualizar();
    elemento.addEventListener('scroll', atualizar, { passive: true });
    const tamanho = new ResizeObserver(atualizar);
    tamanho.observe(elemento);
    return () => {
      elemento.removeEventListener('scroll', atualizar);
      tamanho.disconnect();
    };
  }, [categoria, estado, modalidades]);

  function mover(sentido) {
    const elemento = trilho.current;
    const primeiro = elemento.firstElementChild;
    if (!primeiro) return;
    const passo = primeiro.offsetWidth + (parseFloat(getComputedStyle(elemento).columnGap) || 0);
    elemento.scrollBy({ left: sentido * passo, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  return <section id="modalidades" className="carrossel-jogos" aria-labelledby={id + '-titulo'}>
    <div className="carrossel-cabecalho">
      <h2 id={id + '-titulo'}>Modalidades</h2>
      {modalidades.length > 0 && <div className="carrossel-controles">
        <div className="carrossel-filtro"><label htmlFor={id + '-categoria'}>Categoria</label>
          <select id={id + '-categoria'} value={categoria} onChange={e => {
            const valor = e.target.value;
            trilho.current?.scrollTo({ left: 0, behavior: 'instant' });
            definirBusca(parametros => {
              const proxima = new URLSearchParams(parametros);
              if (valor === todas) proxima.delete('categoria');
              else proxima.set('categoria', valor);
              return proxima;
            }, { replace: true, preventScrollReset: true });
          }}>
            {[todas, ...categorias].map(opcao => <option key={opcao}>{opcao}</option>)}
          </select>
        </div>
        <div className="carrossel-setas">
          <button type="button" aria-label="Modalidades anteriores" aria-controls={id + '-trilho'}
            disabled={!posicao.anterior} onClick={() => mover(-1)}><FaArrowLeft aria-hidden="true"/></button>
          <button type="button" aria-label="Próximas modalidades" aria-controls={id + '-trilho'}
            disabled={!posicao.proxima} onClick={() => mover(1)}><FaArrowRight aria-hidden="true"/></button>
        </div>
      </div>}
    </div>
    {estado === 'carregando' && <p className="carrossel-status" role="status">Carregando modalidades…</p>}
    {estado === 'erro' && <div className="carrossel-status" role="alert">
      <p>Não foi possível carregar as modalidades.</p><button type="button" onClick={recarregar}>Tentar novamente</button>
    </div>}
    {estado === 'pronto' && !exibidas.length && <p className="carrossel-status">As modalidades serão publicadas aqui.</p>}
    {exibidas.length > 0 && <ul className="carrossel-trilho" id={id + '-trilho'} ref={trilho}>
      {exibidas.map((modalidade, index) => <li key={modalidade._id || modalidade.slug}>
        <Link to={`/modalidade/${modalidade.slug}`} state={{ buscaCarrossel: busca.toString() }} className="carrossel-card">
          <img src={assetURL(modalidade.imgCarrossel || modalidade.imageUrl)} alt="" width="300" height="300"
            loading={index < 4 ? 'eager' : 'lazy'} onError={e => {
              if (!e.currentTarget.src.endsWith('/armoriar.png')) e.currentTarget.src = '/images/armoriar.png';
            }}/>
          <div className="carrossel-legenda">
            <div><small>{categoriaDe(modalidade)}</small><strong>{modalidade.nome}</strong></div>
            <FaArrowUpRightFromSquare aria-hidden="true"/>
          </div>
        </Link>
      </li>)}
    </ul>}
  </section>;
}
