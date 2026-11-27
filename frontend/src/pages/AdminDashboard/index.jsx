import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaClipboardList, FaUsers } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import ArquivoCampo from '../../components/ArquivoCampo';
import { useConfig } from '../../context/ConfigContext';

function Publicacao({ tipo, titulo, legenda, publicado, endpoint, campo, destino }) {
  const { refreshConfig } = useConfig();
  const [files, selecionar] = useState([]);
  const [ocupado, ocupar] = useState(false);
  const [retorno, responder] = useState(null);

  async function publicar(evento) {
    evento.preventDefault();
    if (ocupado || !files[0]) return;
    ocupar(true);
    responder(null);
    try {
      const dados = new FormData();
      dados.set(campo, files[0]);
      if (destino) dados.set('destino', destino);
      await api.request({ method: destino ? 'put' : 'post', url: endpoint, data: dados });
      selecionar([]);
      responder({ texto: titulo + ' atualizado.' });
      await refreshConfig();
    } catch (falha) {
      responder({ erro: true, texto: falha.response?.data?.message || 'Não foi possível publicar.' });
    } finally { ocupar(false); }
  }

  return <form className="admin-card" onSubmit={publicar}>
    <h3>{titulo}</h3>
    <p>{legenda}</p>
    {publicado && (tipo === 'pdf' ?
      <a className="painel-link" href={publicado} target="_blank" rel="noreferrer">Abrir edital publicado</a> :
      <img className="painel-logo-previa" src={assetURL(publicado)} alt={titulo + ' atual'}/>)}
    <div className="painel-campos">
      <ArquivoCampo titulo={`Arquivo de ${titulo.toLowerCase()}`} tipo={tipo} arquivos={files}
        selecionar={selecionar} disabled={ocupado} required/>
      <button className="painel-primario" disabled={ocupado || !files.length}>{ocupado ? 'Publicando…' : `Publicar ${titulo.toLowerCase()}`}</button>
    </div>
    {retorno && <p role={retorno.erro ? 'alert' : 'status'} className={'painel-retorno' + (retorno.erro ? ' erro' : '')}>{retorno.texto}</p>}
  </form>;
}

function NomeEvento() {
  const { config, refreshConfig } = useConfig();
  const [nome, definirNome] = useState('');
  const [ocupado, ocupar] = useState(false);
  const [retorno, responder] = useState(null);

  useEffect(() => { definirNome(config.siteName || ''); }, [config.siteName]);

  async function salvar(evento) {
    evento.preventDefault();
    ocupar(true);
    responder(null);
    try {
      await api.put('/admin/config', { siteName: nome.trim() });
      responder({ texto: 'Nome do evento atualizado.' });
      await refreshConfig();
    } catch (falha) {
      responder({ erro: true, texto: falha.response?.data?.message || 'Não foi possível salvar o nome.' });
    } finally { ocupar(false); }
  }

  return <form className="admin-card" onSubmit={salvar}>
    <h3>Nome do evento</h3>
    <div className="painel-campos">
      <label className="campo-painel">Título público
        <input value={nome} onChange={e => definirNome(e.target.value)} required disabled={ocupado}/>
      </label>
      <button className="painel-primario" disabled={ocupado || !nome.trim() || nome.trim() === config.siteName}>
        {ocupado ? 'Salvando…' : 'Salvar nome'}
      </button>
    </div>
    {retorno && <p role={retorno.erro ? 'alert' : 'status'} className={'painel-retorno' + (retorno.erro ? ' erro' : '')}>{retorno.texto}</p>}
  </form>;
}

function ModoManutencao() {
  const { config, estadoConfig, refreshConfig } = useConfig();
  const [ocupado, ocupar] = useState(false);
  const [retorno, responder] = useState(null);
  const ativo = config.manutencao === true;

  async function alternar() {
    ocupar(true);
    responder(null);
    try {
      await api.put('/admin/config', { manutencao: !ativo });
      await refreshConfig();
      responder({ texto: ativo ? 'O site voltou ao ar.' : 'Modo manutenção ativado.' });
    } catch (falha) {
      responder({ erro: true, texto: falha.response?.data?.message || 'Não foi possível alterar o modo manutenção.' });
    } finally { ocupar(false); }
  }

  return <section className="admin-card">
    <h3>Modo manutenção</h3>
    <p>{ativo ? 'O site está em manutenção. O acesso da Gestão está disponível.' :
      'Ao ativar, alunos, monitores e visitantes verão o aviso de manutenção.'}</p>
    <button type="button" className="painel-primario" onClick={alternar} disabled={ocupado || estadoConfig === 'carregando'}>
      {ocupado ? 'Salvando…' : ativo ? 'Desativar manutenção' : 'Ativar manutenção'}
    </button>
    {retorno && <p role={retorno.erro ? 'alert' : 'status'} className={'painel-retorno' + (retorno.erro ? ' erro' : '')}>{retorno.texto}</p>}
  </section>;
}

export default function AdminDashboard() {
  const { config } = useConfig();
  return <>
    <header className="admin-header-bar"><h2>Visão geral da Gestão</h2></header>
    <div className="painel-grade painel-atalhos">
      <Link className="painel-atalho" to="/admin-salas"><FaUsers aria-hidden="true"/>
        <span><strong>Salas e alunos</strong><small>Gerencie turmas, brasões, pontos e planilhas.</small></span><FaArrowRight aria-hidden="true"/>
      </Link>
      <Link className="painel-atalho" to="/admin-lista-inscricoes"><FaClipboardList aria-hidden="true"/>
        <span><strong>Inscrições por turma</strong><small>Veja quem confirmou e quem está pendente.</small></span><FaArrowRight aria-hidden="true"/>
      </Link>
    </div>
    <div className="painel-grade painel-publicacoes">
      <ModoManutencao/>
      <NomeEvento/>
      <Publicacao tipo="pdf" titulo="Edital geral" legenda="O PDF publicado pode ser baixado na página inicial."
        endpoint="/admin/upload-edital-geral" campo="editalGeral"
        publicado={config.editalDisponivel && api.defaults.baseURL + '/edital-geral'}/>
      <Publicacao tipo="imagem" titulo="Cartaz" legenda="Arte completa usada na abertura da página inicial."
        endpoint="/admin/config/logo" campo="logo" destino="cartaz" publicado={config.logoUrl}/>
      <Publicacao tipo="imagem" titulo="Logo do cabeçalho" legenda="Use uma imagem horizontal, legível em tamanho pequeno."
        endpoint="/admin/config/logo" campo="logo" destino="cabecalho"
        publicado={config.headerLogoUrl || '/images/marca/armoriar-logotipo.webp'}/>
    </div>
  </>;
}
