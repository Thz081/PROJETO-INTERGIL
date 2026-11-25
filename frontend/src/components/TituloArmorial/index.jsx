import React from 'react';
import titulos from './titulos.json';
import './style.css';

export default function TituloArmorial({ arte, children, escuro = false }) {
  const titulo = titulos[arte];
  if (!titulo || titulo[0] !== children) return children;
  const [, largura, altura] = titulo;

  return <img
    alt={children}
    className={escuro ? 'arm-titulo-arte arm-titulo-arte-escura' : 'arm-titulo-arte'}
    src={`/images/titulos-armoriais/${arte}.webp`}
    width={largura}
    height={altura}
    style={{ '--arm-titulo-largura': `${largura / 174}em` }}
  />;
}
