import React from 'react';
import { FaClipboardList, FaClock, FaLink } from 'react-icons/fa';
import PainelEquipe from '../PainelEquipe';

const links = [
  { rota: '/monitor-dashboard', texto: 'Visão geral', Icone: FaClipboardList },
  { rota: '/monitor-horarios', texto: 'Horários', Icone: FaClock },
  { rota: '/monitor-links', texto: 'Editais e chaveamentos', Icone: FaLink }
];

export default function MonitorLayout() {
  return <PainelEquipe perfil="Monitoria" links={links}/>;
}
