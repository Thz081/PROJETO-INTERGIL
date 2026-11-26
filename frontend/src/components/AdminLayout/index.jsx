import React from 'react';
import { FaClipboardList, FaGamepad, FaHistory, FaImages, FaListOl, FaMedal, FaTrophy, FaUsers } from 'react-icons/fa';
import PainelEquipe from '../PainelEquipe';

const links = [
  { rota: '/admin-dashboard', texto: 'Visão geral', Icone: FaClipboardList },
  { rota: '/admin-salas', texto: 'Salas e alunos', Icone: FaUsers },
  { rota: '/admin-pontuacao', texto: 'Pontuação', Icone: FaMedal },
  { rota: '/admin-lista-inscricoes', texto: 'Inscrições', Icone: FaListOl },
  { rota: '/admin-dashboard/modalidades', texto: 'Modalidades', Icone: FaGamepad },
  { rota: '/admin-dashboard/hall', texto: 'Hall da Fama', Icone: FaTrophy },
  { rota: '/admin-momentos', texto: 'Momentos', Icone: FaImages },
  { rota: '/admin-log', texto: 'Registro de ações', Icone: FaHistory }
];

export default function AdminLayout({ children }) {
  return <PainelEquipe perfil="Gestão" links={links}>{children}</PainelEquipe>;
}
