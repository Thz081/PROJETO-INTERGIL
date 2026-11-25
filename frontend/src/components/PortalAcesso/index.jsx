import React, { useId, useState } from 'react';
import TituloArmorial from '../TituloArmorial';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaRegEye, FaRegEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthProvider';
import './style.css';

const arteTitulo = {
  Entrar: 'entrar',
  'Primeiro acesso': 'primeiro-acesso',
  'Criar sua senha': 'criar-senha',
  'Portal da gestão': 'portal-gestao',
  'Portal da monitoria': 'portal-monitoria'
};

export function PortalAcesso({ perfil, titulo, children, rodape }) {
  return <section className="portal-armoriar">
    <div className="portal-moldura">
      <div className="portal-cartaz" aria-hidden="true"><img src="/images/armoriar.png" alt="" width="834" height="997"/></div>
      <div className="portal-conteudo">
        <p className="arm-sobrelinha">{perfil} · X Intergil</p>
        <h1><TituloArmorial arte={arteTitulo[titulo]}>{titulo}</TituloArmorial></h1>
        {children}
        <div className="portal-rodape">{rodape}</div>
      </div>
    </div>
  </section>;
}

export function CampoSenha({ nome = 'senha', nova = false, erro }) {
  const [visivel, mostrar] = useState(false);
  const id = useId();
  return <div className="portal-campo">
    <label htmlFor={id}>Senha</label>
    <div className="portal-senha">
      <input id={id} type={visivel ? 'text' : 'password'} name={nome} required minLength={nova ? 6 : undefined}
        autoComplete={nova ? 'new-password' : 'current-password'} aria-invalid={Boolean(erro)}
        aria-describedby={erro || (nova ? id + '-ajuda' : undefined)}/>
      <button type="button" aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visivel}
        onClick={() => mostrar(valor => !valor)}>{visivel ? <FaRegEyeSlash aria-hidden/> : <FaRegEye aria-hidden/>}</button>
    </div>
    {nova && <small id={id + '-ajuda'}>Use pelo menos 6 caracteres.</small>}
  </div>;
}

export function EnviarAcesso({ ocupado, children }) {
  return <button className="arm-botao portal-enviar" type="submit" disabled={ocupado} aria-busy={ocupado}>
    {ocupado ? 'Aguarde…' : children}<FaArrowRight aria-hidden="true"/>
  </button>;
}

export function validarCampos(formulario) {
  const campo = [...formulario.elements].find(elemento => elemento.willValidate && !elemento.validity.valid);
  if (!campo) return null;
  const mensagem = campo.validity.valueMissing ? 'Preencha este campo.' :
    campo.name === 'senha' ? 'Use pelo menos 6 caracteres.' :
    campo.name === 'email' ? 'Informe um e-mail válido.' :
    campo.name === 'matricula' ? 'Informe a matrícula usando apenas números.' : 'Confira a data de nascimento.';
  campo.focus();
  return { campo: campo.name, mensagem };
}

export function ErroAcesso({ erro, id }) {
  return erro && <p id={id} className="portal-erro" role="alert">{erro.mensagem || erro}</p>;
}

export function PortalEquipe({ monitor = false }) {
  const { loginGestao, loginMonitor } = useAuth();
  const [ocupado, enviar] = useState(false);
  const [erro, definirErro] = useState(null);
  const id = useId();
  const chave = monitor ? 'matricula' : 'nome';
  async function autenticar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    const formulario = evento.currentTarget;
    const invalido = validarCampos(formulario);
    definirErro(invalido);
    if (invalido) return;
    const valores = Object.fromEntries(new FormData(formulario));
    enviar(true);
    try { await (monitor ? loginMonitor : loginGestao)(valores[chave].trim(), valores.senha); }
    catch (falha) { definirErro(typeof falha === 'string' ? falha : 'Não foi possível entrar. Tente novamente.'); }
    finally { enviar(false); }
  }
  return <PortalAcesso perfil={monitor ? 'Monitoria' : 'Gestão'} titulo={monitor ? 'Portal da monitoria' : 'Portal da gestão'}
    rodape={<Link to="/login">Voltar ao portal do aluno</Link>}>
    <form className="portal-form" noValidate onSubmit={autenticar}>
      <div className="portal-campo">
        <label htmlFor={id}>{monitor ? 'Matrícula' : 'Usuário'}</label>
        <input id={id} name={chave} autoComplete="username" required
          aria-invalid={erro?.campo === chave}
          aria-describedby={erro?.campo === chave ? id + '-erro' : undefined}/>
      </div>
      <CampoSenha erro={erro?.campo === 'senha' ? id + '-erro' : undefined}/>
      <ErroAcesso erro={erro} id={id + '-erro'}/>
      <EnviarAcesso ocupado={ocupado}>Entrar</EnviarAcesso>
    </form>
  </PortalAcesso>;
}
