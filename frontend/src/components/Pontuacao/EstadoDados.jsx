import React from 'react';

export default function EstadoDados({ erro, buscar, texto }) {
  if (!erro) return <p role="status">Carregando…</p>;
  return <div role="alert">
    <p>{erro.response?.data?.message || texto}</p>
    {erro.response?.status !== 404 && <button type="button" className="arm-botao arm-botao-contorno" onClick={buscar}>Tentar novamente</button>}
  </div>;
}
