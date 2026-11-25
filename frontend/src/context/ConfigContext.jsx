import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    siteName: "INTERGIL 2026",
    logoUrl: "/images/armoriar.png"
  });
  const [estadoConfig, definirEstado] = useState('carregando');

  const refreshConfig = async () => {
    definirEstado('carregando');
    try {
      const { data } = await api.get('/config');
      setConfig(data);
      if (data.siteName) document.title = data.siteName;
      definirEstado('pronto');
    } catch (error) {
      definirEstado('erro');
      console.error('Erro ao carregar a configuração.', error);
    }
  };
  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, estadoConfig, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
