import React from 'react';
import { Link } from 'react-router-dom';
import { assetURL } from '../../api';

export default function Equipe({ sala, link = false }) {
  const conteudo = <>
    <img src={assetURL(sala.logo_url)} alt="" width="40" height="40" loading="lazy"/>
    <span><strong>{sala.nome}</strong><small>{sala.turma}</small></span>
  </>;
  return link ? <Link to={'/ranking/salas/' + sala._id} className="pontuacao-equipe">{conteudo}</Link>
    : <span className="pontuacao-equipe">{conteudo}</span>;
}
