import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import useDadosPontuacao from '../../components/Pontuacao/useDados';
import EstadoDados from '../../components/Pontuacao/EstadoDados';
import '../../components/Pontuacao/style.css';

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'America/Recife' });

export default function Extrato() {
  const { id } = useParams();
  const { config } = useConfig();
  const { dados, erro, buscar } = useDadosPontuacao(config.rankingVisivel === false ? null : '/ranking/salas/' + id);

  return <section className="pontuacao-publica pontuacao-extrato">
    <Link className="arm-botao arm-botao-contorno" to={'/ranking#sala-' + id}><FaArrowLeft aria-hidden="true"/> Voltar ao ranking</Link>
    {config.rankingVisivel === false ? <h1>Ranking temporariamente oculto</h1> : !dados ? <>
      <h1>Extrato de pontuação</h1><EstadoDados erro={erro} buscar={buscar} texto="Não foi possível carregar o extrato."/>
    </> : <>
      <header className="pontuacao-publica-topo pontuacao-extrato-topo">
        <img src={assetURL(dados.sala.logo_url)} width="84" height="84" alt=""/>
        <div><p className="arm-sobrelinha">Extrato de pontuação</p><h1>{dados.sala.nome}</h1><p>{dados.sala.turma}</p></div>
      </header>
      <dl className="pontuacao-resumo">
        <div><dt>Pontuação final</dt><dd>{dados.sala.pontos} pts</dd></div>
        <div><dt>Pontos recebidos</dt><dd>{dados.adicionados} pts</dd></div>
        <div><dt>Pontos descontados</dt><dd>{dados.descontados} pts</dd></div>
      </dl>
      <h2>Lançamentos</h2>
      {dados.movimentos.length ? <ul className="pontuacao-movimentos">{dados.movimentos.map(item => <li key={item._id}>
        <div><strong>{item.motivo}</strong><small>{item.colocacao && `${item.colocacao}º lugar · `}{data.format(new Date(item.registradoEm))}</small></div>
        <strong className={item.pontos < 0 ? 'pontos-descontados' : 'pontos-recebidos'}>{item.pontos > 0 && '+'}{item.pontos} pts</strong>
      </li>)}</ul> : <p>Esta sala ainda não tem lançamentos.</p>}
    </>}
  </section>;
}
