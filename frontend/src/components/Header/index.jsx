import { assetURL } from '../../api';
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './style.css';
// Importa a logo padrão como fallback
const LogoPadrao = '/images/armoriar.png'; 
import { FaVolumeMute, FaVolumeUp, FaBars, FaTimes, FaUserAstronaut, FaUserTie, FaUserSecret } from 'react-icons/fa'; 
import { useAudio } from '../../context/AudioContext'; 
import { useAuth } from '../../context/AuthProvider'; 
import { useConfig } from '../../context/ConfigContext'; 

const Header = () => {
  const { isMuted, toggleMute, playClick } = useAudio();
  const { user } = useAuth(); 
  const { config } = useConfig(); 

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = () => {
    playClick();
    setIsMobileMenuOpen(false);
  }
  
  const handleToggleMobileMenu = () => {
    playClick();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  const handleToggleMute = () => {
    toggleMute();
  }

  const logoSrc = assetURL(config?.logoUrl);
  const siteName = config?.siteName || "INTERGIL 2026";

  // === RENDERIZAÇÃO DOS BOTÕES (Igual ao seu) ===
  const renderAuthButton = (isMobile = false) => {
    const baseClass = "nav-link"; 
    const activeClass = "active";

    if (!user) {
      return (
        <NavLink 
            to="/login" 
            className={({isActive}) => isActive ? `${baseClass} login-btn ${activeClass}` : `${baseClass} login-btn`} 
            onClick={handleNavClick}
        >
          Login
        </NavLink>
      );
    }

    let linkDestino = "/meu-perfil";
    let Icone = FaUserAstronaut;

    if (user.role === 'gestao') {
        linkDestino = "/admin-dashboard"; 
        Icone = FaUserTie;
    } else if (user.role === 'monitor') {
        linkDestino = "/monitor-dashboard"; 
        Icone = FaUserSecret;
    }

    const primeiroNome = user.nome.split(' ')[0];

    return (
        <NavLink 
            to={linkDestino} 
            className={({isActive}) => isActive ? `${baseClass} profile-btn ${activeClass}` : `${baseClass} profile-btn`} 
            onClick={handleNavClick}
        >
            <Icone style={{ marginRight: '8px' }} />
            {primeiroNome}
        </NavLink>
    );
  };

  return (
    <header className="main-header">
      
      <Link to="/" className="logo-container" onClick={handleNavClick}>
        {/* LOGO DINÂMICA COM TRATAMENTO DE ERRO */}
        <img 
            src={logoSrc} 
            alt="Logo Site" 
            className="header-logo gameon-logo"
            onError={(e) => {
                // Se der erro ao carregar (ex: 404), volta para a logo padrão
                e.target.onerror = null; 
                e.target.src = LogoPadrao;
            }} 
        />
        <span className="header-title">{siteName}</span>
      </Link>
      
      <nav className="main-nav desktop-nav">
        <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
          Início
        </NavLink>
        <NavLink to="/horarios" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
          Horários
        </NavLink>
        <NavLink to="/momentos" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
          Momentos
        </NavLink>
        <NavLink to="/historia" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
          História
        </NavLink>
        
        <button aria-label={isMuted ? "Ativar som" : "Silenciar"} onClick={handleToggleMute} className="nav-link mute-btn">
          {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>

        {renderAuthButton(false)}
      </nav>

      <button aria-label="Menu principal" aria-expanded={isMobileMenuOpen} className="hamburger-btn" onClick={handleToggleMobileMenu}>
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isMobileMenuOpen && (
        <nav className="mobile-nav">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
            Início
          </NavLink>
          <NavLink to="/horarios" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
            Horários
          </NavLink>
          <NavLink to="/momentos" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
            Momentos
          </NavLink>
          <NavLink to="/historia" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>
            História
          </NavLink>
          
          {renderAuthButton(true)}

          <button aria-label={isMuted ? "Ativar som" : "Silenciar"} onClick={handleToggleMute} className="nav-link mute-btn">
            {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            <span style={{marginLeft: '10px'}}>
              {isMuted ? 'Ativar Som' : 'Mutar Som'}
            </span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;