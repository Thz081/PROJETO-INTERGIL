import { useEffect, useState } from 'react';
import api, { apiURL } from '../../api';

export default function useVagas(turma) {
  const [estado, setEstado] = useState({ contagem: null, status: 'Conectando' });
  useEffect(() => {
    if (!turma) return;
    let ativo = true, socket, timer, sequencia = 0, conectado = false;
    const atualizar = async () => {
      const n = ++sequencia;
      try {
        const { data } = await api.get('/inscricoes/contagem');
        if (ativo && n === sequencia) setEstado({ contagem: data,
          status: conectado ? 'Vagas ao vivo' : 'Reconectando ao vivo' });
      } catch {
        if (ativo && n === sequencia) setEstado(e => ({ ...e, status: 'Contagem indisponível' }));
      }
    };
    function conectar() {
      const url = new URL(apiURL.replace(/\/$/, '') + '/vagas/ao-vivo', window.location.origin);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(url);
      socket.onopen = () => socket.send(JSON.stringify({ token: localStorage.getItem('intergil_token') }));
      socket.onmessage = () => { conectado = true; atualizar(); };
      socket.onclose = () => {
        conectado = false;
        if (ativo) { atualizar(); timer = setTimeout(conectar, 2500); }
      };
    }
    atualizar();
    conectar();
    window.addEventListener('focus', atualizar);
    return () => {
      ativo = false;
      clearTimeout(timer);
      socket.onclose = socket.onopen = socket.onmessage = null;
      socket.close();
      window.removeEventListener('focus', atualizar);
    };
  }, [turma]);
  return estado;
}
