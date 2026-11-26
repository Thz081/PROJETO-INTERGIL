import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useConfig } from '../../context/ConfigContext';
import TituloArmorial from '../TituloArmorial';
import Equipe from '../Pontuacao/Equipe';
import EstadoDados from '../Pontuacao/EstadoDados';
import useDadosPontuacao from '../Pontuacao/useDados';
import '../Pontuacao/style.css';
import './style.css';

export default function Leaderboard({ completo = false }) {
  const { config, estadoConfig, refreshConfig } = useConfig();
  const { dados, erro, buscar } = useDadosPontuacao(config.rankingVisivel === true ? '/ranking/salas' : null);
  if (!completo && (config.rankingVisivel !== true || erro?.response?.status === 404)) return null;
  const titulo = completo ? 'RANKING GERAL' : 'RANKING 2026';
  const Titulo = completo ? 'h1' : 'h2';
  const salas = completo ? dados : dados?.slice(0, 6);

  return <section className="leaderboard-container" aria-labelledby="ranking-titulo">
    <Titulo id="ranking-titulo"><TituloArmorial arte={completo ? 'ranking-geral' : 'ranking-2026'}>{titulo}</TituloArmorial></Titulo>
    {config.rankingVisivel === false ? <p>Ranking temporariamente oculto.</p> : estadoConfig === 'erro' && config.rankingVisivel === undefined ?
      <EstadoDados erro={{}} buscar={refreshConfig} texto="Não foi possível consultar o ranking."/> :
      !salas ? <EstadoDados erro={erro} buscar={buscar} texto="Não foi possível carregar o ranking."/> :
        <table className="leaderboard-table">
          <thead><tr><th scope="col">Pos.</th><th scope="col">Sala</th><th scope="col">Pontuação</th></tr></thead>
          <tbody>{salas.map((sala, indice) => <tr key={sala._id}>
            <td>{indice + 1}º</td><th scope="row"><Equipe sala={sala} link/></th><td>{sala.pontos} pts</td>
          </tr>)}</tbody>
        </table>}
    {completo ? <Link to="/" className="arm-botao arm-botao-contorno leaderboard-acao"><FaArrowLeft aria-hidden="true"/> Voltar ao início</Link> :
      <Link to="/ranking" className="arm-botao arm-botao-contorno leaderboard-acao">Ver ranking completo <FaArrowRight aria-hidden="true"/></Link>}
  </section>;
}
