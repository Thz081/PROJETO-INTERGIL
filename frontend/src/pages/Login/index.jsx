import React, { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { useAuth } from '../../context/AuthProvider';
import { CampoSenha, EnviarAcesso, ErroAcesso, PortalAcesso, validarCampos } from '../../components/PortalAcesso';
import api from '../../api';

const fases = {
  entrar: ['Entrar', 'Entrar'],
  verificar: ['Primeiro acesso', 'Verificar matrícula'],
  ativar: ['Criar sua senha', 'Concluir primeiro acesso']
};

export default function Login() {
  const { iniciarSessaoAluno } = useAuth();
  const navigate = useNavigate();
  const id = useId();
  const [fase, definirFase] = useState('entrar');
  const [ocupado, enviar] = useState(false);
  const [erro, definirErro] = useState(null);
  const [data, definirData] = useState('');
  const [comprovante, definirComprovante] = useState('');

  function trocarFase(novaFase) {
    definirErro(null);
    definirData('');
    definirComprovante('');
    definirFase(novaFase);
  }

  async function autenticar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    const formulario = evento.currentTarget;
    const invalido = validarCampos(formulario);
    definirErro(invalido);
    if (invalido) return;
    const campos = Object.fromEntries(new FormData(formulario));
    enviar(true);
    try {
      if (fase === 'verificar') {
        const resposta = await api.post('/auth/primeiro-acesso/verificar', { n_inscricao: campos.matricula, data_nascimento: data });
        definirComprovante(resposta.data.comprovante);
        definirFase('ativar');
        return;
      }
      const resposta = fase === 'ativar' ? await api.post('/auth/primeiro-acesso/ativar', { ...campos, comprovante }) :
        await api.post('/auth/login', campos);
      iniciarSessaoAluno(resposta.data);
      navigate('/inscricao', { replace: true });
    } catch (falha) { definirErro(falha.response?.data?.message || 'Falha na conexão. Tente novamente.'); }
    finally { enviar(false); }
  }

  const campos = fase === 'verificar' ? [['matricula', 'Matrícula', 'text', 'numeric', 'username', '[0-9]+'],
    ['nascimento', 'Data de nascimento']] : fase === 'ativar' ?
    [['email', 'Seu e-mail', 'email', undefined, 'email']] :
    [['login', 'E-mail ou matrícula', 'text', undefined, 'username']];
  return <PortalAcesso perfil="Aluno" titulo={fases[fase][0]} rodape={<>
    <button disabled={ocupado} className="portal-trocar" type="button" onClick={() => trocarFase(fase === 'entrar' ? 'verificar' : 'entrar')}>
      {fase === 'entrar' ? 'Primeiro acesso · cadastrar senha' : 'Voltar para entrar'}
    </button>
    <nav className="portal-perfis" aria-label="Portais da equipe"><Link to="/login-monitor">Monitoria</Link><Link to="/login-admin">Gestão</Link></nav>
  </>}>
    <form key={fase} className="portal-form" noValidate onSubmit={autenticar}>
      {campos.map(([nome, rotulo, tipo, inputMode, autoComplete, pattern]) => {
        const atributos = { id: id + '-' + nome, name: nome, required: true,
          'aria-invalid': erro?.campo === nome,
          'aria-describedby': erro?.campo === nome ? id + '-erro' : undefined };
        return <div key={nome} className="portal-campo">
          <label htmlFor={atributos.id}>{rotulo}</label>
          {nome === 'nascimento' ? <IMaskInput {...atributos} mask="00/00/0000" pattern={String.raw`[0-9]{2}\/[0-9]{2}\/[0-9]{4}`}
            inputMode="numeric" autoComplete="bday" value={data} onAccept={valor => definirData(valor)} placeholder="DD/MM/AAAA"/> :
            <input {...atributos} type={tipo} inputMode={inputMode} autoComplete={autoComplete} pattern={pattern}/>}
        </div>;
      })}
      {fase !== 'verificar' && <CampoSenha nova={fase === 'ativar'} erro={erro?.campo === 'senha' ? id + '-erro' : undefined}/>}
      <ErroAcesso erro={erro} id={id + '-erro'}/>
      <EnviarAcesso ocupado={ocupado}>{fases[fase][1]}</EnviarAcesso>
    </form>
  </PortalAcesso>;
}
