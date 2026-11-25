import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaBars, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthProvider';
import './style.css';

export default function PainelEquipe({ perfil, links, children }) {
  const { logout } = useAuth();
  const [aberto, abrir] = useState(false);
  const local = useLocation();
  const botao = useRef(null);
  const id = useId();
  const pagina = links.find(link => link.rota === local.pathname)?.texto || perfil;

  useEffect(() => {
    if (!aberto) return;
    function fechar(evento) {
      if (evento.key === 'Escape') {
        abrir(false);
        botao.current?.focus();
      }
    }
    document.addEventListener('keydown', fechar);
    return () => document.removeEventListener('keydown', fechar);
  }, [aberto]);

  return <div className={'painel-equipe' + (aberto ? ' painel-menu-aberto' : '')}>
    <header className="painel-topo">
      <Link className="painel-marca" to="/" aria-label="Intergil 2026 · início">
        <img src="/images/marca/armoriar-logotipo.webp" alt="" width="152" height="32"/>
      </Link>
      <span className="painel-perfil">{perfil}</span>
      <span className="painel-pagina">{pagina}</span>
      <button className="painel-menu-botao" type="button" ref={botao} aria-controls={id}
        aria-expanded={aberto} onClick={() => abrir(valor => !valor)}>
        {aberto ? <FaTimes aria-hidden="true"/> : <FaBars aria-hidden="true"/>}
        {aberto ? 'Fechar menu' : 'Menu'}
      </button>
    </header>
    <aside className="painel-lateral" id={id}>
      <nav aria-label={`Navegação da ${perfil.toLowerCase()}`}>
        {links.map(({ rota, texto, Icone }) => <NavLink key={rota} to={rota} end onClick={() => abrir(false)}>
          <Icone aria-hidden="true"/> {texto}
        </NavLink>)}
      </nav>
      <div className="painel-lateral-rodape">
        <Link to="/"><FaArrowLeft aria-hidden="true"/> Voltar ao site</Link>
        <button type="button" onClick={logout}><FaSignOutAlt aria-hidden="true"/> Sair</button>
      </div>
    </aside>
    <main id="painel-conteudo" className="admin-content">{children || <Outlet/>}</main>
  </div>;
}
