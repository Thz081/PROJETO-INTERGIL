import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api';
import './style.css';

export default function Login() {
  const { iniciarSessaoAluno } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState('entrar'), [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(''), [data, setData] = useState(''), [ticket, setTicket] = useState('');
  const [mostrar, setMostrar] = useState(false);
  function mudar(m) { setErro(''); setData(''); setTicket(''); setMostrar(false); setModo(m); }
  async function enviar(e) {
    e.preventDefault();
    const campos = Object.fromEntries(new FormData(e.currentTarget));
    setErro(''); setOcupado(true);
    try {
      if (modo === 'verificar') {
        const r = await api.post('/auth/primeiro-acesso/verificar', { n_inscricao: campos.matricula, data_nascimento: data });
        setTicket(r.data.comprovante); setModo('ativar'); return;
      }
      const r = modo === 'ativar' ? await api.post('/auth/primeiro-acesso/ativar', { ...campos, comprovante: ticket }) :
        await api.post('/auth/login', campos);
      iniciarSessaoAluno(r.data); navigate('/inscricao', { replace: true });
    } catch (err) { setErro(err.response?.data?.message || 'Falha na conexão. Tente novamente.'); }
    finally { setOcupado(false); }
  }
  return <div className="login-page-wrapper"><div className="login-container acesso-aluno">
    <p className="kicker">Portal do aluno</p>
    <h1>{modo === 'entrar' ? 'Entrar' : modo === 'verificar' ? 'Primeiro acesso' : 'Criar sua senha'}</h1>
    <form key={modo} className="login-form" onSubmit={enviar}>
      {modo === 'verificar' ? <>
        <label>Matrícula<input name="matricula" inputMode="numeric" pattern="[0-9]+" required autoComplete="username"/></label>
        <label>Data de nascimento<IMaskInput mask="00/00/0000" inputMode="numeric" value={data} onAccept={valor => setData(valor)} required placeholder="DD/MM/AAAA"/></label>
      </> : <>
        {modo === 'entrar' ? <label>E-mail ou matrícula<input name="login" autoComplete="username" required/></label> :
          <label>Seu e-mail<input type="email" name="email" autoComplete="email" required/></label>}
        <label>{modo === 'ativar' ? 'Crie uma senha de pelo menos 6 caracteres' : 'Senha'}
          <input type={mostrar ? 'text' : 'password'} name="senha" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} minLength={modo === 'ativar' ? 6 : undefined} required/></label>
        <label className="revelar"><input type="checkbox" checked={mostrar} onChange={e => setMostrar(e.target.checked)}/> Mostrar senha</label>
      </>}
      {erro && <p role="alert">{erro}</p>}
      <button className="acao" disabled={ocupado}>{ocupado ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : modo === 'verificar' ? 'Verificar matrícula' : 'Concluir primeiro acesso'}</button>
    </form>
    <button disabled={ocupado} className="alternar-acesso" onClick={() => mudar(modo === 'entrar' ? 'verificar' : 'entrar')}>
      {modo === 'entrar' ? 'Primeiro acesso · cadastrar senha' : 'Voltar para entrar'}
    </button>
    <nav className="admin-links-container"><Link to="/login-monitor">Monitoria</Link><Link to="/login-admin">Gestão</Link></nav>
  </div></div>;
}
