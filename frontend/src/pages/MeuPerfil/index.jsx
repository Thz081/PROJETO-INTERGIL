import React, { useEffect, useRef, useState } from 'react';
import TituloArmorial from '../../components/TituloArmorial';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarCheck, FaRightFromBracket, FaUser } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthProvider';
import api from '../../api';
import './style.css';

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Recife'
});

function agruparEscolhas(codigos, modalidades) {
  const grupos = new Map();
  for (const codigo of codigos) {
    const [id, indice] = String(codigo).split('-');
    const modalidade = modalidades.find(item => item && String(item._id) === id);
    if (!grupos.has(id)) grupos.set(id, {
      id, nome: modalidade?.nome || `Modalidade ${id}`, formatos: []
    });
    const formato = modalidade?.submodalidades?.[indice]?.nome;
    if (formato && formato !== 'Individual' && formato !== modalidade.nome) grupos.get(id).formatos.push(formato);
  }
  return [...grupos.values()];
}

export default function MeuPerfil() {
  const { user, logout } = useAuth();
  const [dados, setDados] = useState({ status: 'carregando' });
  const [tentativa, repetir] = useState(0);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const dialogo = useRef(null);
  const tituloInscricao = useRef(null);

  useEffect(() => {
    const consulta = new AbortController();
    async function carregar() {
      try {
        const { status, data } = await api.get('/inscricoes/me', {
          signal: consulta.signal, validateStatus: valor => valor === 200 || valor === 404
        });
        if (consulta.signal.aborted) return;
        if (status === 404) { setDados({ status: 'vazio' }); return; }
        const { data: modalidades } = await api.get('/modalidades', { signal: consulta.signal });
        if (!consulta.signal.aborted) setDados({
          status: 'inscrito', inscricao: data, escolhas: agruparEscolhas(data.modalidades, modalidades)
        });
      } catch {
        if (!consulta.signal.aborted) setDados({ status: 'erro' });
      }
    }
    carregar();
    return () => consulta.abort();
  }, [user, tentativa]);

  async function cancelar() {
    if (cancelando) return;
    setCancelando(true);
    setErro('');
    try {
      await api.delete('/inscricoes/me');
      dialogo.current.close();
      setDados({ status: 'vazio' });
      setMensagem('Inscrição cancelada.');
      tituloInscricao.current.focus();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível cancelar. Tente novamente.');
    } finally {
      setCancelando(false);
    }
  }

  const inscrito = dados.status === 'inscrito';
  const dataInscricao = new Date(dados.inscricao?.data_inscricao);
  return <div className="perfil-armoriar">
    <header className="perfil-topo">
      <span className="perfil-avatar"><FaUser aria-hidden="true"/></span>
      <div className="perfil-identidade">
        <p>Meu perfil</p>
        <h1>{user.nome}</h1>
        <span>{user.turma}</span>
        {user.sexo === 'M' && <span>Masculino</span>}
        {user.sexo === 'F' && <span>Feminino</span>}
      </div>
      <button className="perfil-sair" type="button" onClick={logout}>
        <FaRightFromBracket aria-hidden="true"/> Sair
      </button>
    </header>
    <section className="perfil-inscricao" aria-labelledby="perfil-titulo-inscricao" aria-busy={dados.status === 'carregando'}>
      <div className="perfil-inscricao-titulo">
        <h2 id="perfil-titulo-inscricao" ref={tituloInscricao} tabIndex={-1}><TituloArmorial arte="minha-inscricao" escuro>Minha inscrição</TituloArmorial></h2>
        {inscrito && <span className="perfil-confirmada"><FaCalendarCheck aria-hidden="true"/> Confirmada</span>}
      </div>
      <p className="perfil-mensagem" role="status">{mensagem}</p>
      {dados.status === 'carregando' && <p role="status">Carregando inscrição…</p>}
      {dados.status === 'erro' && <>
        <p role="alert">Não foi possível consultar sua inscrição.</p>
        <button className="perfil-acao" type="button" onClick={() => { setDados({ status: 'carregando' }); repetir(n => n + 1); }}>
          Tentar novamente
        </button>
      </>}
      {dados.status === 'vazio' && <div className="perfil-vazio">
        <div>
          <h3>Você ainda não se inscreveu</h3>
          <p>Veja as modalidades e as vagas disponíveis para sua turma.</p>
        </div>
        <Link className="perfil-acao" to="/inscricao">Ir para inscrição <FaArrowRight aria-hidden="true"/></Link>
      </div>}
      {inscrito && <>
        <p className="perfil-total"><strong>{dados.inscricao.pontuacaoTotal}</strong> modalidades contabilizadas
          {Number.isFinite(dataInscricao.valueOf()) && <> · {formatoData.format(dataInscricao)}</>}</p>
        <ul className="perfil-escolhas">{dados.escolhas.map(item => <li key={item.id}>
          <strong>{item.nome}</strong>
          {item.formatos.length > 0 && <span>{item.formatos.join(' · ')}</span>}
        </li>)}</ul>
        <button className="perfil-cancelar" type="button" onClick={() => {
          setErro(''); dialogo.current.showModal();
        }}>Cancelar inscrição</button>
      </>}
    </section>
    <dialog className="perfil-dialogo" ref={dialogo} aria-labelledby="perfil-cancelar-titulo"
      onCancel={evento => { if (cancelando) evento.preventDefault(); }}>
      <h2 id="perfil-cancelar-titulo">Cancelar sua inscrição?</h2>
      <p>Suas escolhas serão apagadas e as vagas voltarão a ficar disponíveis para a turma.</p>
      {erro && <p className="perfil-erro" role="alert">{erro}</p>}
      <div className="perfil-dialogo-acoes">
        <button className="perfil-secundaria" type="button" autoFocus disabled={cancelando}
          onClick={() => dialogo.current.close()}>Manter inscrição</button>
        <button className="perfil-cancelar" type="button" disabled={cancelando} onClick={cancelar}>
          {cancelando ? 'Cancelando…' : 'Confirmar cancelamento'}
        </button>
      </div>
    </dialog>
  </div>;
}
