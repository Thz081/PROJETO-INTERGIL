import React, { useEffect, useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaRegImages, FaVideo } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import ArquivoCampo from '../../components/ArquivoCampo';
import { validarCampos } from '../../components/PortalAcesso';
import { useAuth } from '../../context/AuthProvider';
import './style.css';

const rota = '/equipe/momentos';
const vazio = { titulo: '', legenda: '', tipo: 'foto', assunto: 'evento',
  tema: '', modalidade: '', formato: '', salas: [], lance: false };
const assuntos = { evento: 'Evento', modalidade: 'Modalidade', mascote: 'Dança de mascote', danca: 'Dança geral' };
const estados = { rascunho: 'Rascunho', publicado: 'Publicado', retirado: 'Fora do ar',
  enviando: 'Envio incompleto', fila: 'Na fila', processando: 'Processando', pronta: 'Pronto', falhou: 'Falhou' };
const pendente = arquivo => ['fila', 'processando'].includes(arquivo.estado);
const tamanhoTrecho = 4 * 1024 * 1024;
const mensagem = (erro, fallback) => erro.response?.data?.message || fallback;
const campos = item => ({ ...vazio, ...item, modalidade: item.modalidade || '', formato: item.formato || '',
  tema: item.tema || '', legenda: item.legenda || '', salas: item.salas || [] });

function AtalhoColecoes({ catalogo, bloqueado, abrir }) {
  const [modalidade, definirModalidade] = useState('');
  const [formato, definirFormato] = useState('');
  const [primeira, definirPrimeira] = useState('');
  const [segunda, definirSegunda] = useState('');
  const registro = catalogo.modalidades.find(item => String(item._id) === modalidade);
  const titulo = registro && [registro.nome, formato].filter(Boolean).join(' · ');
  const salas = [primeira, segunda].filter(Boolean);
  const opcoes = catalogo.salas.map(item => <option key={item._id} value={item._id}>{item.nome} · {item.turma}</option>);
  return <details className="momentos-equipe-painel momentos-atalho">
    <summary>Álbuns do catálogo</summary>
    <p>Escolha a modalidade e, se precisar, o formato. Marque as turmas que devem receber a publicação no perfil.</p>
    <fieldset className="momentos-equipe-dupla" disabled={bloqueado}>
      <label className="momentos-equipe-campo">Modalidade do álbum
        <select value={modalidade} onChange={e => { definirModalidade(e.target.value); definirFormato(''); }}>
          <option value="">Selecione</option>
          {catalogo.modalidades.map(item => <option key={item._id} value={item._id}>{item.nome}</option>)}
        </select>
      </label>
      <label className="momentos-equipe-campo">Formato do álbum
        <select value={formato} disabled={!registro?.submodalidades?.length} onChange={e => definirFormato(e.target.value)}>
          <option value="">Álbum principal</option>
          {registro?.submodalidades.map(item => <option key={item.nome}>{item.nome}</option>)}
        </select>
      </label>
      <label className="momentos-equipe-campo">Primeira turma
        <select value={primeira} onChange={e => definirPrimeira(e.target.value)}>
          <option value="">Opcional</option>{opcoes.filter(item => item.props.value !== segunda)}
        </select>
      </label>
      <label className="momentos-equipe-campo">Segunda turma
        <select value={segunda} onChange={e => definirSegunda(e.target.value)}>
          <option value="">Opcional</option>{opcoes.filter(item => item.props.value !== primeira)}
        </select>
      </label>
    </fieldset>
    <div className="momentos-equipe-acoes">
      <button className="arm-botao" type="button" disabled={!registro || bloqueado}
        onClick={() => abrir({ titulo, tipo: 'foto', modalidade, formato, salas })}>Abrir álbum de fotos</button>
      <button className="arm-botao arm-botao-contorno" type="button" disabled={!registro || bloqueado}
        onClick={() => abrir({ titulo, tipo: 'video', modalidade, formato, salas })}>Novo vídeo nesse álbum</button>
    </div>
  </details>;
}

export default function AdminMomentos() {
  const { user } = useAuth();
  if (user?.role === 'monitor' && !user.agrTv) return <Navigate to="/monitor-dashboard" replace/>;
  return <PainelMomentos/>;
}

function PainelMomentos() {
  const [catalogo, definirCatalogo] = useState({ modalidades: [], salas: [] });
  const [lista, definirLista] = useState({ itens: [], proximo: null });
  const [filtros, definirFiltros] = useState({ tipo: '', modalidade: '', sala: '' });
  const [carregando, definirCarregando] = useState(true);
  const [selecionado, selecionar] = useState(null);
  const [form, formulario] = useState(vazio);
  const [arquivos, definirArquivos] = useState([]);
  const [erro, definirErro] = useState('');
  const [campoErro, definirCampoErro] = useState('');
  const [aviso, avisar] = useState('');
  const [ocupado, ocupar] = useState(false);
  const [envio, definirEnvio] = useState(null);
  const [confirmacao, confirmar] = useState(null);
  const abortar = useRef(null);
  const dialogoExcluir = useRef(null);
  const botaoNova = useRef(null);

  async function carregarLista(antes, ativos = filtros) {
    definirCarregando(true);
    try {
      const { data } = await api.get(rota, { params: { antes, ...ativos } });
      definirLista(anterior => ({ ...data, itens: antes ? [...anterior.itens, ...data.itens] : data.itens }));
    } catch (falha) { definirErro(mensagem(falha, 'Não foi possível carregar as publicações.')); }
    finally { definirCarregando(false); }
  }

  function filtrar(chave, valor) {
    const ativos = { ...filtros, [chave]: valor };
    definirFiltros(ativos);
    carregarLista(null, ativos);
  }

  useEffect(() => {
    api.get('/acervo-momentos/catalogo').then(({ data }) => definirCatalogo(data))
      .catch(falha => definirErro(mensagem(falha, 'Não foi possível carregar modalidades e turmas.')));
    carregarLista();
    return () => abortar.current?.abort();
  }, []);

  const esperando = selecionado?.midias?.some(pendente);
  const idAtual = selecionado?._id;
  useEffect(() => {
    if (!idAtual || !esperando) return;
    const controller = new AbortController();
    const intervalo = setInterval(async () => {
      try {
        const { data } = await api.get(rota + '/' + idAtual, { signal: controller.signal });
        if (!controller.signal.aborted) selecionar(data);
      } catch (falha) {
        if (!controller.signal.aborted && [401, 403, 404].includes(falha.response?.status)) {
          clearInterval(intervalo);
          definirErro(mensagem(falha, 'Abra a publicação de novo para atualizar o estado.'));
        }
      }
    }, 3000);
    return () => { clearInterval(intervalo); controller.abort(); };
  }, [idAtual, esperando]);

  function nova() {
    selecionar(null); formulario(vazio); definirArquivos([]); definirErro(''); avisar(''); confirmar(null);
  }

  async function abrir(id) {
    definirErro(''); avisar(''); ocupar(true);
    try {
      const { data } = await api.get(rota + '/' + id);
      selecionar(data); formulario(campos(data)); definirArquivos([]);
    } catch (falha) { definirErro(mensagem(falha, 'Não foi possível abrir a publicação.')); }
    finally { ocupar(false); }
  }

  async function abrirColecao(dados) {
    nova();
    if (dados.tipo === 'video') {
      formulario({ ...vazio, ...dados, assunto: 'modalidade', titulo: dados.titulo.slice(0, 120) });
      return;
    }
    ocupar(true);
    try {
      const { data } = await api.post(rota + '/colecoes', dados);
      await abrir(data._id);
      carregarLista();
    } catch (falha) { definirErro(mensagem(falha, 'Não foi possível abrir o álbum do catálogo.')); }
    finally { ocupar(false); }
  }

  function mudar(chave, valor) {
    formulario(atual => ({ ...atual, [chave]: valor }));
  }
  function mudarAssunto(assunto) {
    formulario(atual => ({ ...atual, assunto, salas: [], modalidade: '', formato: '', tema: '' }));
  }

  async function salvar(evento) {
    evento.preventDefault();
    const invalido = validarCampos(evento.currentTarget);
    definirCampoErro(invalido?.campo || '');
    if (invalido) {
      definirErro(invalido.mensagem);
      return;
    }
    ocupar(true); definirErro(''); avisar('');
    try {
      const valores = { ...form, salas: form.salas.filter(Boolean) };
      const resp = idAtual ? await api.patch(rota + '/' + idAtual, valores) : await api.post(rota, valores);
      const { data } = await api.get(rota + '/' + resp.data._id);
      selecionar(data); formulario(campos(data));
      avisar(idAtual ? 'Informações salvas.' : 'Rascunho criado. Agora você pode enviar os arquivos.');
      carregarLista();
    } catch (falha) { definirErro(mensagem(falha, 'Não foi possível salvar.')); }
    finally { ocupar(false); }
  }

  async function enviar() {
    const controller = new AbortController();
    abortar.current = controller;
    let feitos = 0;
    definirErro(''); avisar('');
    try {
      for (const arquivo of arquivos) {
        definirEnvio({ nome: arquivo.name, posicao: feitos + 1, total: arquivos.length, porcentagem: 0 });
        const base = rota + '/' + idAtual + '/envios';
        const { data: inicio } = await api.post(base, {
          nome: arquivo.name, bytes: arquivo.size, alteradoEm: arquivo.lastModified
        }, { signal: controller.signal });
        let recebido = inicio.recebido;
        while (recebido < arquivo.size) {
          const trecho = arquivo.slice(recebido, recebido + tamanhoTrecho);
          const { data } = await api.put(base + '/' + inicio.midia, trecho, {
            headers: { 'Content-Type': 'application/octet-stream', 'Upload-Offset': recebido },
            signal: controller.signal,
            onUploadProgress: e => definirEnvio(atual => atual && ({
              ...atual, porcentagem: Math.round(100 * (recebido + e.loaded) / arquivo.size)
            }))
          });
          recebido = data.recebido;
        }
        feitos += 1;
      }
      avisar('Arquivos enviados para processamento. Você já pode preparar outra publicação.');
    } catch (falha) {
      definirErro(controller.signal.aborted ? 'Envio pausado. Envie o mesmo arquivo para retomar do último trecho recebido.' :
        mensagem(falha, 'O envio foi interrompido. Reenvie o mesmo arquivo para continuar.'));
    } finally {
      api.get(rota + '/' + idAtual).then(({ data }) => selecionar(data)).catch(() => {});
      definirArquivos(restantes => restantes.slice(feitos));
      definirEnvio(null);
      abortar.current = null;
    }
  }

  async function acao(alvo, midia) {
    definirErro(''); avisar(''); ocupar(true); confirmar(null);
    try {
      const url = rota + '/' + idAtual;
      if (midia) await api.delete(url + '/arquivos/' + midia);
      else await api.patch(url + '/estado', { estado: alvo });
      const { data } = await api.get(url);
      selecionar(data);
      avisar(midia ? 'Arquivo removido.' : alvo === 'publicado' ? 'Publicação no ar.' : 'Publicação retirada do ar.');
      carregarLista();
    } catch (falha) { definirErro(mensagem(falha, 'Não foi possível concluir a ação.')); }
    finally { ocupar(false); }
  }

  async function excluirRascunho() {
    dialogoExcluir.current.close();
    definirErro(''); avisar(''); ocupar(true);
    try {
      await api.delete(rota + '/' + idAtual);
      nova();
      avisar('Rascunho excluído.');
      await carregarLista();
    } catch (falha) { definirErro(mensagem(falha, 'Não foi possível excluir o rascunho.')); }
    finally {
      ocupar(false);
      requestAnimationFrame(() => botaoNova.current?.focus());
    }
  }

  const modalidade = catalogo.modalidades.find(item => String(item._id) === String(form.modalidade));
  const lugares = form.assunto === 'danca' ? 3 : form.assunto === 'mascote' ? 1 : form.assunto === 'modalidade' ? 2 : 0;
  const publicado = selecionado?.estado === 'publicado';
  const albumAoVivo = publicado && selecionado.tipo === 'foto';
  const fotosProntas = selecionado?.midias?.filter(item => item.estado === 'pronta').length || 0;
  const pronto = selecionado?.midias?.length && selecionado.midias.every(midia => !midia.estado || midia.estado === 'pronta')
    && (!selecionado.lance || selecionado.midias.every(midia => !midia.duracao || midia.duracao <= 90));
  const espaco = (form.tipo === 'foto' ? 12 : 1) - (selecionado?.midias?.length || 0);
  const retomaveis = selecionado?.midias?.filter(item => item.estado === 'enviando').length || 0;
  const bloqueado = ocupado || Boolean(envio);
  const acessibilidade = nome => ({
    name: nome,
    'aria-invalid': campoErro === nome || undefined,
    'aria-describedby': campoErro === nome && erro ? 'momento-erro-editor' : undefined
  });

  return <div className="momentos-equipe">
    <header className="momentos-equipe-topo">
      <div><h1>Momentos</h1><p>Fotos, danças e lances do Intergil.</p></div>
      <Link to="/momentos" className="arm-botao arm-botao-contorno">Abrir galeria</Link>
    </header>

    {erro && <p className="momentos-erro" role="alert" id="momento-erro-editor">{erro}</p>}
    {aviso && <p role="status">{aviso}</p>}

    <AtalhoColecoes catalogo={catalogo} bloqueado={bloqueado} abrir={abrirColecao}/>

    <div className="momentos-equipe-grade">
      <section className="momentos-equipe-painel">
        <div className="momentos-equipe-linha">
          <h2>Publicações</h2>
          <button className="arm-botao" type="button" ref={botaoNova} disabled={bloqueado} onClick={nova}><FaPlus aria-hidden/> Nova</button>
        </div>
        <label className="momentos-equipe-campo">Tipo
          <select value={filtros.tipo} onChange={e => filtrar('tipo', e.target.value)} disabled={carregando}>
            <option value="">Todos</option><option value="foto">Álbuns</option><option value="video">Vídeos</option>
          </select>
        </label>
        <div className="momentos-equipe-dupla momentos-lista-filtros">
          <label className="momentos-equipe-campo">Modalidade
            <select value={filtros.modalidade} onChange={e => filtrar('modalidade', e.target.value)} disabled={carregando}>
              <option value="">Todas</option>
              {catalogo.modalidades.map(item => <option key={item._id} value={item._id}>{item.nome}</option>)}
            </select>
          </label>
          <label className="momentos-equipe-campo">Turma
            <select value={filtros.sala} onChange={e => filtrar('sala', e.target.value)} disabled={carregando}>
              <option value="">Todas</option>
              {catalogo.salas.map(item => <option key={item._id} value={item._id}>{item.nome}</option>)}
            </select>
          </label>
        </div>
        <ul className="momentos-publicacoes">
          {lista.itens.map(item => <li key={item._id}>
            <button type="button" aria-pressed={idAtual === item._id} disabled={bloqueado} onClick={() => abrir(item._id)}>
              {item.tipo === 'foto' ? <FaRegImages aria-hidden/> : <FaVideo aria-hidden/>}
              <span>{item.titulo}<small>{estados[item.estado]} · {assuntos[item.assunto]}</small></span>
            </button>
          </li>)}
        </ul>
        {carregando && <p role="status">Carregando publicações…</p>}
        {!carregando && !lista.itens.length && <p>Nenhuma publicação nesta lista.</p>}
        {lista.proximo && <button className="arm-botao arm-botao-contorno" type="button"
          disabled={carregando} onClick={() => carregarLista(lista.proximo)}>Carregar mais</button>}
      </section>

      <section className="momentos-equipe-painel">
        <h2>{idAtual ? 'Editar publicação' : 'Nova publicação'}</h2>
        <form noValidate onSubmit={salvar} onChange={() => {
          if (campoErro) { definirCampoErro(''); definirErro(''); }
        }}>
          <fieldset disabled={bloqueado} className="momentos-equipe-form">
            <label className="momentos-equipe-campo">Título
              <input {...acessibilidade('titulo')} value={form.titulo} onChange={e => mudar('titulo', e.target.value)} maxLength={120} required/>
            </label>
            <div className="momentos-equipe-dupla">
              <label className="momentos-equipe-campo">Tipo
                <select disabled={Boolean(idAtual)} value={form.tipo} onChange={e => mudar('tipo', e.target.value)}>
                  <option value="foto">Álbum de fotos</option><option value="video">Vídeo</option>
                </select>
              </label>
              <label className="momentos-equipe-campo">Assunto
                <select value={form.assunto} onChange={e => mudarAssunto(e.target.value)}>
                  {Object.entries(assuntos).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
                </select>
              </label>
            </div>
            {form.assunto === 'modalidade' && <div className="momentos-equipe-dupla">
              <label className="momentos-equipe-campo">Modalidade
                <select {...acessibilidade('modalidade')} value={form.modalidade} required onChange={e => formulario(atual => ({ ...atual, modalidade: e.target.value, formato: '' }))}>
                  <option value="">Selecione</option>{catalogo.modalidades.map(item => <option key={item._id} value={item._id}>{item.nome}</option>)}
                </select>
              </label>
              <label className="momentos-equipe-campo">Formato
                <select disabled={!modalidade?.submodalidades?.length} value={form.formato} onChange={e => mudar('formato', e.target.value)}>
                  <option value="">Geral</option>{modalidade?.submodalidades?.map(item => <option key={item.nome}>{item.nome}</option>)}
                </select>
              </label>
            </div>}
            {form.assunto === 'danca' && <label className="momentos-equipe-campo">Tema do trio
              <input {...acessibilidade('tema')} value={form.tema} onChange={e => mudar('tema', e.target.value)} maxLength={120} required/>
            </label>}
            {!!lugares && <div className="momentos-equipe-dupla">
              {Array.from({ length: lugares }, (_, i) => <label key={i} className="momentos-equipe-campo">
                {lugares === 1 ? 'Turma' : 'Turma ' + (i + 1)}
                <select {...acessibilidade('sala-' + i)} required={form.assunto !== 'modalidade'} value={form.salas[i] || ''}
                  onChange={e => { const salas = [...form.salas]; salas[i] = e.target.value; mudar('salas', salas); }}>
                  <option value="">Selecione</option>
                  {catalogo.salas.filter(sala => form.salas[i] === sala._id || !form.salas.includes(sala._id))
                    .map(sala => <option key={sala._id} value={sala._id}>{sala.turma} · {sala.nome}</option>)}
                </select>
              </label>)}
            </div>}
            <label className="momentos-equipe-campo">Legenda
              <textarea className="resize-none" value={form.legenda}
                onChange={e => mudar('legenda', e.target.value)} maxLength={1400} rows={4}/>
            </label>
            {form.tipo === 'video' && <label className="momentos-equipe-check">
              <input type="checkbox" checked={form.lance} onChange={e => mudar('lance', e.target.checked)}/> Mostrar em Lances (até 90 s)
            </label>}
            <button className="arm-botao" type="submit">{idAtual ? 'Salvar informações' : 'Criar rascunho'}</button>
          </fieldset>
        </form>

        {idAtual && <section className="momentos-equipe-midia" aria-label="Mídia da publicação">
          <h3>{selecionado.tipo === 'foto' ? 'Fotos do álbum' : 'Vídeo'}</h3>
          {selecionado.midias?.length > 0 && <ul className="momentos-arquivos">
            {selecionado.midias.map((item, indice) => <li key={item._id}>
              {item.capa && <img src={assetURL(item.capa)} alt=""/>}
              <div><strong>{selecionado.tipo === 'foto' ? 'Foto ' + (indice + 1) : 'Vídeo'}</strong>
                <small>{estados[item.estado] || 'Arquivo anterior'}</small>{item.erro && <p>{item.erro}</p>}
                {item.url && <a href={assetURL(item.url)} target="_blank" rel="noreferrer">Ver arquivo</a>}
              </div>
              {(!publicado || albumAoVivo && (item.estado !== 'pronta' || fotosProntas > 1)) && item.estado && item.estado !== 'processando' && <button
                className="arm-botao arm-botao-contorno" type="button" disabled={bloqueado}
                onClick={() => confirmar({ midia: item._id, texto: 'Remover este arquivo da publicação?' })}>Remover</button>}
            </li>)}
          </ul>}

          {(!publicado || albumAoVivo) && !selecionado.legado && (espaco > 0 || retomaveis > 0) && <>
            {albumAoVivo && <p>As fotos novas aparecem em todos os perfis marcados quando o processamento termina.</p>}
            {retomaveis > 0 && <p>Selecione o mesmo arquivo para continuar um envio incompleto.</p>}
            <ArquivoCampo titulo={selecionado.tipo === 'foto' ? 'Selecionar fotos' : 'Selecionar vídeo'}
              tipo={selecionado.tipo === 'foto' ? 'fotoMomento' : 'videoMomento'} arquivos={arquivos}
              selecionar={valores => {
                if (valores.length > espaco + retomaveis) { definirErro('Selecione até ' + (espaco + retomaveis) + ' arquivos.'); definirArquivos([]); }
                else { definirErro(''); definirArquivos(valores); }
              }} multiple={selecionado.tipo === 'foto'} disabled={bloqueado}/>
            <button className="arm-botao arm-botao-contorno" type="button" disabled={!arquivos.length || bloqueado}
              onClick={enviar}>Enviar {selecionado.tipo === 'foto' ? 'fotos' : 'vídeo'}</button>
          </>}
          {envio && <div className="momentos-andamento" role="status">
            <span>Enviando {envio.posicao}/{envio.total} · {envio.porcentagem}%</span>
            <progress value={envio.porcentagem} max={100} aria-label="Progresso do envio"/>
            <button className="arm-botao arm-botao-contorno" type="button" onClick={() => abortar.current?.abort()}>Pausar envio</button>
          </div>}
          <div className="momentos-equipe-acoes">
            {publicado ? <>
              <Link to={'/momentos/' + idAtual} className="arm-botao arm-botao-contorno">Ver no site</Link>
              <button className="arm-botao arm-botao-contorno" type="button" disabled={bloqueado}
                onClick={() => confirmar({ alvo: 'retirado', texto: 'Retirar esta publicação da galeria?' })}>Retirar do ar</button>
            </> : <button className="arm-botao" type="button" disabled={!pronto || bloqueado}
              onClick={() => acao('publicado')}>Publicar</button>}
            {!publicado && !pronto && <small>A publicação fica disponível quando os arquivos estiverem prontos.</small>}
          </div>
          {selecionado.estado === 'rascunho' && <>
            <div className="momentos-equipe-acoes">
              <button type="button" className="arm-botao arm-botao-contorno momentos-excluir"
                disabled={bloqueado || selecionado.midias?.some(midia => midia.estado === 'processando')}
                onClick={() => {
                  dialogoExcluir.current.showModal();
                  dialogoExcluir.current.querySelector('button').focus();
                }}>Excluir rascunho</button>
            </div>
            <dialog className="momentos-dialogo" ref={dialogoExcluir} aria-labelledby="momentos-excluir-titulo"
              aria-describedby="momentos-excluir-descricao">
              <h3 id="momentos-excluir-titulo">Excluir rascunho?</h3>
              <p id="momentos-excluir-descricao">O rascunho “{selecionado.titulo}” e seus arquivos serão apagados.</p>
              <div className="momentos-equipe-acoes">
                <button type="button" className="arm-botao arm-botao-contorno"
                  onClick={() => dialogoExcluir.current.close()}>Manter rascunho</button>
                <button type="button" className="arm-botao" onClick={excluirRascunho}>Excluir rascunho</button>
              </div>
            </dialog>
          </>}
          {confirmacao && <div className="momentos-confirmacao" role="group" aria-label={confirmacao.texto}>
            <p>{confirmacao.texto}</p>
            <button className="arm-botao arm-botao-contorno" type="button" onClick={() => confirmar(null)}><FaArrowLeft aria-hidden/> Voltar</button>
            <button className="arm-botao" type="button" onClick={() => acao(confirmacao.alvo, confirmacao.midia)}>
              {confirmacao.midia ? 'Remover arquivo' : 'Retirar publicação'}
            </button>
          </div>}
        </section>}
      </section>
    </div>
  </div>;
}
