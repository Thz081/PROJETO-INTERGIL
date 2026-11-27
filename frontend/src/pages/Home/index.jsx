import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarAlt, FaDownload, FaRegFilePdf } from 'react-icons/fa';
import Leaderboard from '../../components/Leaderboard';
import ModalidadesCarousel from '../../components/ModalidadesCarousel';
import api, { apiURL, assetURL } from '../../api';
import { useConfig } from '../../context/ConfigContext';
import { ultimoDiaInscricoes } from '../Inscricao/prazo';
import './style.css';

export default function Home() {
  const [modalidades, definirModalidades] = useState([]);
  const [estado, definirEstado] = useState('carregando');
  const [tentativa, tentar] = useState(0);
  const { config, estadoConfig, refreshConfig } = useConfig();
  useEffect(() => {
    const controller = new AbortController();
    api.get('/modalidades', { signal: controller.signal }).then(({ data }) => {
      definirModalidades(data);
      definirEstado('pronto');
    }).catch(() => { if (!controller.signal.aborted) definirEstado('erro'); });
    return () => controller.abort();
  }, [tentativa]);

  const encerrada = Date.now() >= Date.parse(config.fimInscricoes);
  return <div className="edicao-home">
    <section className="capa-armoriar">
      <div className="capa-armoriar-texto">
        <p className="arm-sobrelinha">X Intergil · Movimento Armorial</p>
        <h1><img src="/images/marca/armoriar-logotipo.webp" alt="Armoriar" width="384" height="81"/></h1>
        <p className="capa-armoriar-edicao">INTERGIL 2026</p>
        <div className="capa-armoriar-acoes">
          <Link className="arm-botao" to={encerrada ? '/meu-perfil' : '/inscricao'}>
            {encerrada ? 'Ver minha inscrição' : 'Fazer inscrição'} <FaArrowRight aria-hidden="true"/>
          </Link>
          <Link className="arm-botao arm-botao-contorno" to="/horarios"><FaCalendarAlt aria-hidden="true"/> Horários dos jogos</Link>
        </div>
        <div className="capa-armoriar-info">
          {config.fimInscricoes && <span>{encerrada ? 'Inscrições encerradas' :
            'Inscrições até ' + ultimoDiaInscricoes(config.fimInscricoes)}</span>}
        </div>
        <section className="capa-edital" aria-labelledby="capa-edital-titulo">
          <FaRegFilePdf className="capa-edital-icone" aria-hidden="true"/>
          <div className="capa-edital-texto">
            <h2 id="capa-edital-titulo">Edital geral de 2026</h2>
            <p aria-live="polite">
              {estadoConfig === 'carregando' ? 'Consultando disponibilidade…' :
                estadoConfig === 'erro' ? 'Não foi possível consultar o edital.' :
                  config.editalDisponivel ? 'Regulamento oficial do Intergil' : 'Aguardando publicação'}
            </p>
          </div>
          {config.editalDisponivel && <a className="arm-botao arm-botao-contorno" href={apiURL + '/edital-geral'}>
            <FaDownload aria-hidden="true"/> Baixar PDF
          </a>}
          {!config.editalDisponivel && estadoConfig === 'erro' &&
            <button type="button" className="arm-botao arm-botao-contorno" onClick={refreshConfig}>Tentar novamente</button>}
        </section>
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
