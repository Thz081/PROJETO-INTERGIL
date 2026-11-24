import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import Leaderboard from '../../components/Leaderboard';
import api, { assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import './style.css';

export default function Home() {
  const [mods, setMods] = useState([]);
  const [falha, setFalha] = useState(false);
  const { config } = useConfig();
  useEffect(() => { api.get('/modalidades').then(r => setMods(r.data)).catch(() => setFalha(true)); }, []);
  const categorias = [...new Set(mods.map(m => m.categoria || 'Outras modalidades'))];
  const encerrada = Date.now() >= Date.parse('2026-12-02T00:00:00-03:00');
  return <div className="edicao-home">
    <section className="capa">
      <div className="capa-texto">
        <p className="kicker">X edição · Movimento Armorial</p>
        <h1>Armoriar</h1>
        <p className="capa-sub">{config.siteName || "Intergil 2026"}</p>
        <p className="capa-escola">Jogos interclasse da ETE Advogado José David Gil Rodrigues<br/>Jaboatão dos Guararapes · Pernambuco</p>
        <div className="capa-acoes"><Link className="acao" to={encerrada ? '/meu-perfil' : '/inscricao'}>{encerrada ? 'Ver minha inscrição' : 'Fazer inscrição'} <FaArrowRight/></Link>
        <Link className="acao secundaria" to="/horarios"><FaCalendarAlt/> Horários dos jogos</Link></div>
        <p className="prazo">{encerrada ? 'Inscrições encerradas' : 'Inscrições até 1º de dezembro'}</p>
        {config.editalDisponivel && <a href={api.defaults.baseURL + '/edital-geral'}>Baixar edital geral</a>}
      </div>
      <figure><img src={assetURL(config.logoUrl)} alt="Cartaz oficial do X Intergil"/></figure>
    </section>
    <div className="faixa-gravura" aria-hidden="true"/>
    <section className="indice-modalidades"><p className="kicker">Guia dos jogos</p><h2>Modalidades</h2>
      {falha && <p>Não foi possível carregar as modalidades.</p>}
      <div className="indice-grade">{categorias.map(cat => <details key={cat}><summary><img src={assetURL(mods.find(m => (m.categoria || 'Outras modalidades') === cat)?.imgCarrossel || '/images/gravuras/tocha.webp')} alt="" loading="lazy"/><span>{cat}</span></summary><ul>
        {mods.filter(m => (m.categoria || 'Outras modalidades') === cat).map(m => <li key={m._id}><Link to={'/modalidade/' + m.slug}>{m.nome} ↗</Link></li>)}
      </ul></details>)}</div>
    </section>
    <Leaderboard/>
  </div>;
}
