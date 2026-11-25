import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaClock, FaLink } from 'react-icons/fa';

export default function MonitorDashboard() {
  return <>
    <header className="admin-header-bar"><h2>Visão geral da Monitoria</h2></header>
    <div className="painel-grade painel-atalhos">
      <Link className="painel-atalho" to="/monitor-horarios">
        <FaClock aria-hidden="true"/>
        <span><strong>Horários</strong><small>Organize data, horário e local dos jogos.</small></span>
        <FaArrowRight aria-hidden="true"/>
      </Link>
      <Link className="painel-atalho" to="/monitor-links">
        <FaLink aria-hidden="true"/>
        <span><strong>Editais e chaveamentos</strong><small>Publique um PDF ou link por modalidade ou formato.</small></span>
        <FaArrowRight aria-hidden="true"/>
      </Link>
    </div>
  </>;
}
