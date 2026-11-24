import { useEffect, useState } from 'react';
import api, { apiURL } from '../../api';

export default function useVagas(turma, destino) {
  const [estado, setEstado] = useState({ contagem: {}, externas: {}, status: 'Conectando' });
  useEffect(() => {
    if (!turma) return;
    let ativo = true, socket, timer, sequencia = 0, conectado = false;
    const atualizar = async () => {
      const n = ++sequencia;
      try {
        const [origem, outra] = await Promise.all([
          api.get('/inscricoes/contagem'),
          destino ? api.get('/inscricoes/contagem', { params: { turma: destino } }) : null
        ]);
        if (ativo && n === sequencia) setEstado({ contagem: origem.data, externas: outra?.data || {},
          status: conectado ? 'Vagas ao vivo' : 'Reconectando ao vivo' });
      } catch {
        if (ativo && n === sequencia) setEstado(e => ({ ...e, status: 'Contagem indisponível' }));
      }
    };
    function conectar() {
      const url = new URL(apiURL.replace(/\/$/, '') + '/vagas/ao-vivo', window.location.origin);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(url);
      socket.onopen = () => socket.send(JSON.stringify({ token: localStorage.getItem('intergil_token'), destino }));
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
  }, [turma, destino]);
  return estado;
}
