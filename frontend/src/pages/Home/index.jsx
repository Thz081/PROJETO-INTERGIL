import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import Leaderboard from '../../components/Leaderboard';
import ModalidadesCarousel from '../../components/ModalidadesCarousel';
import api, { assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import './style.css';

export default function Home() {
  const [modalidades, definirModalidades] = useState([]);
  const [estado, definirEstado] = useState('carregando');
  const [tentativa, tentar] = useState(0);
  const { config } = useConfig();
  useEffect(() => {
    const controller = new AbortController();
    api.get('/modalidades', { signal: controller.signal }).then(({ data }) => {
      definirModalidades(data);
      definirEstado('pronto');
    }).catch(() => { if (!controller.signal.aborted) definirEstado('erro'); });
    return () => controller.abort();
  }, [tentativa]);

  const encerrada = Date.now() >= Date.parse('2026-12-02T00:00:00-03:00');
  return <div className="edicao-home">
    <section className="capa-armoriar">
      <div className="capa-armoriar-texto">
        <p className="arm-sobrelinha">X Intergil · Movimento Armorial</p>
        <h1>Armoriar</h1>
        <p className="capa-armoriar-escola">Jogos interclasse da ETE Advogado José David Gil Rodrigues</p>
        <div className="capa-armoriar-acoes">
          <Link className="arm-botao" to={encerrada ? '/meu-perfil' : '/inscricao'}>
            {encerrada ? 'Ver minha inscrição' : 'Fazer inscrição'} <FaArrowRight aria-hidden="true"/>
          </Link>
          <Link className="arm-botao arm-botao-contorno" to="/horarios"><FaCalendarAlt aria-hidden="true"/> Horários dos jogos</Link>
        </div>
        <div className="capa-armoriar-info">
          <span>{encerrada ? 'Inscrições encerradas' : 'Inscrições até 1º de dezembro'}</span>
          {config.editalDisponivel && <a href={api.defaults.baseURL + '/edital-geral'}>Baixar edital geral</a>}
        </div>
      </div>
      <img className="capa-armoriar-cartaz" src={assetURL(config.logoUrl)}
        width="834" height="997" alt="Cartaz oficial do X Intergil com cavalo alado, sol e mandacaru" fetchPriority="high"/>
    </section>
    <ModalidadesCarousel modalidades={modalidades} estado={estado} recarregar={() => {
      definirEstado('carregando');
      tentar(n => n + 1);
    }}/>
    <Leaderboard/>
  </div>;
}
