import React, { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaChevronRight } from 'react-icons/fa';
import { useConfig } from '../../context/ConfigContext';
import TituloArmorial from '../TituloArmorial';
import Equipe from '../Pontuacao/Equipe';
import EstadoDados from '../Pontuacao/EstadoDados';
import useDadosPontuacao from '../Pontuacao/useDados';
import '../Pontuacao/style.css';
import './style.css';

let ultimaSalaAberta;

export default function Leaderboard({ completo = false }) {
  const { hash, key } = useLocation();
  const navegacao = useNavigationType();
  const restaurado = useRef(null);
  const { config, estadoConfig, refreshConfig } = useConfig();
  const { dados, erro, buscar } = useDadosPontuacao(config.rankingVisivel === true ? '/ranking/salas' : null);
  useEffect(() => {
    if (!completo || !dados || restaurado.current === key) return;
    const id = hash.startsWith('#sala-') ? hash.slice(1) :
      navegacao === 'POP' && ultimaSalaAberta?.key === key ? ultimaSalaAberta.id : null;
    const linha = id && document.getElementById(id);
    if (linha) {
      restaurado.current = key;
      linha.querySelector('a')?.focus({ preventScroll: true });
      linha.scrollIntoView({ block: 'center' });
    }
  }, [completo, dados, hash, key, navegacao]);
  if (!completo && (config.rankingVisivel !== true || erro?.response?.status === 404)) return null;
  const titulo = completo ? 'RANKING GERAL' : 'RANKING 2026';
  const Titulo = completo ? 'h1' : 'h2';
  const salas = completo ? dados : dados?.slice(0, 6);

  return <section className={'leaderboard-container' + (completo ? ' leaderboard-completo' : '')} aria-labelledby="ranking-titulo">
    <header className="leaderboard-cabecalho">
      <Titulo id="ranking-titulo"><TituloArmorial arte={completo ? 'ranking-geral' : 'ranking-2026'}>{titulo}</TituloArmorial></Titulo>
      {completo && salas && <p id="ranking-ajuda">Selecione uma sala para ver a origem dos pontos.</p>}
    </header>
    {config.rankingVisivel === false ? <p>Ranking temporariamente oculto.</p> : estadoConfig === 'erro' && config.rankingVisivel === undefined ?
      <EstadoDados erro={{}} buscar={refreshConfig} texto="Não foi possível consultar o ranking."/> :
      !salas ? <EstadoDados erro={erro} buscar={buscar} texto="Não foi possível carregar o ranking."/> :
        <table className="leaderboard-table" aria-describedby={completo ? 'ranking-ajuda' : undefined}>
          <thead><tr><th scope="col">Pos.</th><th scope="col">Sala</th><th scope="col">Pontuação</th></tr></thead>
          <tbody>{salas.map((sala, indice) => <tr key={sala._id} id={completo ? `sala-${sala._id}` : undefined}>
            <td><span className="leaderboard-posicao">{indice + 1}º</span></td>
            <th scope="row"><Equipe sala={sala} link onClick={completo ?
              () => { ultimaSalaAberta = { key, id: `sala-${sala._id}` }; } : undefined}>
              <FaChevronRight aria-hidden="true"/>
            </Equipe></th>
            <td><span className="leaderboard-pontos">{sala.pontos} <small>pts</small></span></td>
          </tr>)}</tbody>
        </table>}
    {completo ? <Link to="/" className="arm-botao arm-botao-contorno leaderboard-acao"><FaArrowLeft aria-hidden="true"/> Voltar ao início</Link> :
      <Link to="/ranking" className="arm-botao arm-botao-contorno leaderboard-acao">Ver ranking completo <FaArrowRight aria-hidden="true"/></Link>}
  </section>;
}
