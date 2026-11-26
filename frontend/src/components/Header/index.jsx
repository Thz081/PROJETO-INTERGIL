import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaVolumeMute, FaVolumeUp, FaBars, FaTimes, FaRegUser } from 'react-icons/fa';
import { assetURL } from '../../api';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthProvider';
import { useConfig } from '../../context/ConfigContext';
import './style.css';

const links = [['/', 'Início'], ['/horarios', 'Horários'], ['/resultados', 'Resultados'], ['/momentos', 'Momentos'], ['/historia', 'História']];
const destinos = { aluno: '/meu-perfil', gestao: '/admin-dashboard', monitor: '/monitor-dashboard' };
const marcaPadrao = '/images/marca/armoriar-logotipo.webp';

export default function Header() {
  const { isMuted, toggleMute } = useAudio();
  const { user } = useAuth();
  const { config } = useConfig();
  const [aberto, abrir] = useState(false);
  const menu = useRef(null);
  const siteName = config?.siteName || 'Intergil 2026';

  useEffect(() => {
    if (!aberto) return;
    function escapar(evento) {
      if (evento.key !== 'Escape') return;
      abrir(false);
      menu.current.focus();
    }
    window.addEventListener('keydown', escapar);
    return () => window.removeEventListener('keydown', escapar);
  }, [aberto]);

  function navegar() {
    abrir(false);
  }

  return <header className="main-header arm-header">
    <div className="arm-header-interno">
      <Link to="/" className="arm-marca" onClick={navegar} aria-label={siteName + ' · início'}>
        <img src={config?.headerLogoUrl ? assetURL(config.headerLogoUrl) : marcaPadrao} alt="" width="192" height="40"
          onError={e => { if (!e.currentTarget.src.endsWith(marcaPadrao)) e.currentTarget.src = marcaPadrao; }}/>
        <span>{siteName}</span>
      </Link>
      <button className="arm-menu" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={aberto} aria-controls="arm-navigation"
        ref={menu} type="button" onClick={() => abrir(!aberto)}>{aberto ? <FaTimes aria-hidden="true"/> : <FaBars aria-hidden="true"/>}</button>
      <nav id="arm-navigation" className={aberto ? 'arm-nav aberta' : 'arm-nav'} aria-label="Navegação principal">
        {links.map(([url, texto]) => <NavLink key={url} to={url} end={url === '/'} onClick={navegar}>{texto}</NavLink>)}
        <button className="arm-som" type="button" onClick={toggleMute} aria-label={isMuted ? 'Ativar som dos cliques' : 'Silenciar cliques'}>
          {isMuted ? <FaVolumeMute aria-hidden="true"/> : <FaVolumeUp aria-hidden="true"/>}
        </button>
        <NavLink className="arm-conta" to={user ? destinos[user.role] || '/meu-perfil' : '/login'} onClick={navegar}>
          <FaRegUser aria-hidden="true"/>{user?.nome?.split(' ')[0] || 'Entrar'}
        </NavLink>
      </nav>
    </div>
  </header>;
}
