import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';

export default function DialogoPontuacao({ sala, pontos, fechar, atualizou }) {
  const dialogo = useRef(null);
  const [motivo, definirMotivo] = useState('');
  const [ocupado, definirOcupado] = useState(false);
  const [erro, definirErro] = useState('');
  const envio = useRef(null);
  useEffect(() => { dialogo.current.showModal(); }, []);

  async function salvar(evento) {
    evento.preventDefault();
    if (ocupado || !motivo.trim()) return;
    if (envio.current?.motivo !== motivo.trim()) {
      const operacao = crypto.getRandomValues(new Uint32Array(4)).join('-');
      envio.current = { motivo: motivo.trim(), operacao };
    }
    definirOcupado(true);
    definirErro('');
    try {
      const { data } = await api.put('/admin/pontos', { salaId: sala._id, pontos, ...envio.current });
      atualizou(data);
      dialogo.current.close();
    } catch (falha) {
      definirErro(falha.response?.data?.message || 'Não foi possível registrar a pontuação. Tente novamente.');
    } finally { definirOcupado(false); }
  }

  const acao = pontos > 0 ? 'Adicionar pontos' : 'Remover pontos';
  return <dialog ref={dialogo} onClose={fechar} onCancel={e => { if (ocupado) e.preventDefault(); }}
    className="admin-pontos-dialogo" aria-labelledby="dialogo-pontos-titulo">
    <h3 id="dialogo-pontos-titulo">{acao}</h3>
    <p><strong>{sala.nome}</strong> · {pontos > 0 ? '+' : ''}{pontos} pts</p>
    <form onSubmit={salvar}>
      <label className="campo-painel">Motivo da pontuação
        <textarea value={motivo} onChange={e => definirMotivo(e.target.value)} required maxLength={240}
          rows={3} placeholder="Ex. Taça das Casas 2026.2" disabled={ocupado} autoFocus/>
      </label>
      {erro && <p role="alert" className="painel-retorno erro">{erro}</p>}
      <div className="painel-linha">
        <button type="button" className="painel-secundario" onClick={() => dialogo.current.close()} disabled={ocupado}>Cancelar</button>
        <button className="painel-primario" disabled={ocupado || !motivo.trim()}>{ocupado ? 'Salvando…' : acao}</button>
      </div>
    </form>
  </dialog>;
}
