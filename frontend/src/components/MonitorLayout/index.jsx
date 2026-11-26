import React from 'react';
import { FaClipboardList, FaClock, FaLink, FaPhotoVideo } from 'react-icons/fa';
import PainelEquipe from '../PainelEquipe';
import { useAuth } from '../../context/AuthProvider';

const links = [
  { rota: '/monitor-dashboard', texto: 'Visão geral', Icone: FaClipboardList },
  { rota: '/monitor-horarios', texto: 'Horários', Icone: FaClock },
  { rota: '/monitor-links', texto: 'Editais e chaveamentos', Icone: FaLink }
];

export default function MonitorLayout() {
  const { user } = useAuth();
  const modalidades = user?.agrTv && !user.temModalidades ? [] : links;
  const menu = user?.agrTv ? [...modalidades, { rota: '/monitor-momentos', texto: 'Momentos', Icone: FaPhotoVideo }] : modalidades;
  return <PainelEquipe perfil={user?.agrTv && !user.temModalidades ? 'AGR TV' : 'Monitoria'} links={menu}/>;
}
