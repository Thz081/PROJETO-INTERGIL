import { useEffect, useState } from 'react';
import api from '../../api';

export default function useDadosPontuacao(rota) {
  const [estado, definirEstado] = useState({});
  const [tentativa, tentar] = useState(0);
  useEffect(() => {
    if (!rota) return;
    const controller = new AbortController();
    api.get(rota, { signal: controller.signal }).then(({ data }) => definirEstado({ rota, tentativa, dados: data }))
      .catch(erro => { if (!controller.signal.aborted) definirEstado({ rota, tentativa, erro }); });
    return () => controller.abort();
  }, [rota, tentativa]);
  const atual = estado.rota === rota && estado.tentativa === tentativa ? estado : {};
  return { ...atual, buscar: () => tentar(n => n + 1), atualizar: dados => definirEstado({ rota, tentativa, dados }) };
}
