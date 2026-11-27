import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from '../api';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({ siteName: 'INTERGIL 2026', logoUrl: '/images/armoriar.png' });
  const [estadoConfig, definirEstado] = useState('carregando');
  const consulta = useRef(0);

  const refreshConfig = useCallback(async () => {
    const atual = ++consulta.current;
    try {
      const { data } = await api.get('/config', { timeout: 8000 });
      if (atual !== consulta.current) return;
      setConfig(data);
      if (data.siteName) document.title = data.siteName;
      definirEstado('pronto');
    } catch {
      if (atual === consulta.current) definirEstado('erro');
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    const conferir = () => { if (!document.hidden) refreshConfig(); };
    const intervalo = window.setInterval(conferir, 25000);
    document.addEventListener('visibilitychange', conferir);
    window.addEventListener('pageshow', conferir);
    const interceptor = api.interceptors.response.use(resposta => resposta, falha => {
      if (falha.response?.status === 503 && falha.response.data?.manutencao) refreshConfig();
      return Promise.reject(falha);
    });
    return () => {
      consulta.current++;
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', conferir);
      window.removeEventListener('pageshow', conferir);
      api.interceptors.response.eject(interceptor);
    };
  }, [refreshConfig]);

  return <ConfigContext.Provider value={{ config, estadoConfig, refreshConfig }}>
    {children}
  </ConfigContext.Provider>;
};

export const useConfig = () => useContext(ConfigContext);
