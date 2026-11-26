import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import { assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import EstadoDados from '../../components/Pontuacao/EstadoDados';
import useDadosPontuacao from '../../components/Pontuacao/useDados';
import Equipe from '../../components/Pontuacao/Equipe';
import TituloArmorial from '../../components/TituloArmorial';
import '../../components/Pontuacao/style.css';

export default function Resultados() {
  const { dados, erro, buscar } = useDadosPontuacao('/resultados/modalidades');
  const { config } = useConfig();
  const [categoria, escolher] = useState('');
  const categorias = [...new Set(dados?.modalidades.map(item => item.categoria) || [])].filter(Boolean);

  return <section className="pontuacao-publica">
    <header className="pontuacao-publica-topo">
      <div><p className="arm-sobrelinha">Resultados do Intergil</p>
        <h1><TituloArmorial arte="modalidades">Modalidades</TituloArmorial></h1></div>
      {config.rankingVisivel && <Link className="arm-botao arm-botao-contorno" to="/ranking">Ver ranking geral <FaArrowRight aria-hidden="true"/></Link>}
    </header>
    {!dados ? <EstadoDados erro={erro} buscar={buscar} texto="Não foi possível carregar os resultados."/> : <>
      <label className="pontuacao-categoria">Categoria
        <select value={categoria} onChange={e => escolher(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <div className="pontuacao-resultados">
        {dados.modalidades.filter(item => !categoria || item.categoria === categoria).map(mod => {
          const temResultado = mod.formatos.some(formato => formato.posicoes.some(Boolean));
          return <details key={mod._id} className="pontuacao-cartao" open={temResultado || undefined}>
            <summary>
              <img src={assetURL(mod.imgCarrossel)} alt="" width="64" height="64" loading="lazy"/>
              <div><p>{mod.categoria}</p><h2>{mod.nome}</h2><small>{temResultado ? 'Ver colocações' : 'Aguardando resultados'}</small></div>
            </summary>
            {mod.formatos.map(formato => <section className="pontuacao-podio" key={formato.chave}>
              {formato.chave !== 'geral' && <h3>{formato.nome}{formato.principal && <small> · Principal</small>}</h3>}
              <ol aria-label={`Pódio de ${mod.nome}${formato.chave === 'geral' ? '' : ' · '+formato.nome}`}>
                {formato.posicoes.map((sala, i) => <li key={i}>
                  <span className="pontuacao-posicao">{i + 1}º</span>
                  {sala ? <Equipe sala={sala} link={config.rankingVisivel === true}/> : <span>Aguardando resultado</span>}
                  <strong>{dados.pontosPorLugar[i]} pts</strong>
                </li>)}
              </ol>
            </section>)}
          </details>;
        })}
      </div>
    </>}
  </section>;
}
