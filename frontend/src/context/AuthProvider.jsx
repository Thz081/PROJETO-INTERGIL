// Arquivo: intergil-client/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('intergil_user'));
    } catch (e) {
      return null;
    }
  });
  
  const [token, setToken] = useState(localStorage.getItem('intergil_token'));
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null); // Adicionei state de erro global se precisar
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    const id = api.interceptors.response.use(r => r, err => {
      if (err.response?.status === 401 && !err.config?.url?.startsWith('/auth/') &&
          localStorage.getItem('intergil_token')) {
        localStorage.removeItem('intergil_token');
        localStorage.removeItem('intergil_user');
        delete api.defaults.headers.common.Authorization;
        setUser(null); setToken(null); navigate('/login', { replace: true });
      }
      return Promise.reject(err);
    });
    return () => api.interceptors.response.eject(id);
  }, [navigate]);

  const iniciarSessaoAluno = ({token: novoToken, user: aluno}) => {
    localStorage.setItem('intergil_token', novoToken);
    localStorage.setItem('intergil_user', JSON.stringify(aluno));
    setToken(novoToken);
    setUser(aluno);
    api.defaults.headers.common.Authorization = 'Bearer ' + novoToken;
  };

  // === LOGIN GESTÃO ===
  const loginGestao = async (nome, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login-gestao', {
        nome: nome,
        senha: password, 
      });

      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('intergil_token', newToken);
      localStorage.setItem('intergil_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      navigate('/admin-dashboard');
      
    } catch (error) {
      console.error('Falha no login da Gestão:', error);
      throw error.response?.data?.message || 'Erro desconhecido';
    } finally {
      setLoading(false);
    }
  };

  // === LOGIN MONITOR ===
  const loginMonitor = async (matricula, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login-monitor', {
        matricula: matricula,
        senha: password,
      });

      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('intergil_token', newToken);
      localStorage.setItem('intergil_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      navigate(newUser.agrTv && !newUser.temModalidades ? '/monitor-momentos' : '/monitor-dashboard');
      
    } catch (error) {
      console.error('Falha no login do Monitor:', error);
      throw error.response?.data?.message || 'Erro desconhecido';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('intergil_token');
    localStorage.removeItem('intergil_user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
  };

  const value = {
    user,
    token,
    loading,
    error,
    iniciarSessaoAluno,
    loginGestao,
    loginMonitor,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
