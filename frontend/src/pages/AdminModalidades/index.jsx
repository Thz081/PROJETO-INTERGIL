import React, { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import ArquivoCampo from '../../components/ArquivoCampo';
import './style.css';

const vazio = () => ({ nome: '', categoria: '', limite: '', maxEscolhas: 1, formatos: [] });
const formatoVazio = { nome: '', genero: 'X', limite: '' };
const generos = { X: 'Aberto ou misto', M: 'Masculino', F: 'Feminino' };

export default function AdminModalidades() {
  const [modalidades, setModalidades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [buscando, buscar] = useState(true);
  const [filtro, filtrar] = useState('');
  const [edicao, editar] = useState(null);
  const [campos, definir] = useState(vazio);
  const [arquivos, setArquivos] = useState({ capa: [], banner: [], edital: [] });
  const [retorno, setRetorno] = useState(null);
  const [ocupado, ocupar] = useState(false);
  const formRef = useRef(null);
  const primeiroCampo = useRef(null);

  async function carregar() {
    buscar(true);
    try {
      const [lista, grupos] = await Promise.all([api.get('/modalidades'), api.get('/admin/modalidades/categorias')]);
      setCategorias(grupos.data);
      setModalidades(lista.data.filter(Boolean));
    } catch (erro) {
      setRetorno({ erro: erro.response?.data?.message || 'Não foi possível carregar o catálogo.' });
    } finally { buscar(false); }
  }

  useEffect(() => { carregar(); }, []);
  const atualizar = (nome, valor) => definir(atual => ({ ...atual, [nome]: valor }));
  const selecionar = nome => lista => setArquivos(atual => ({ ...atual, [nome]: lista }));

  function alterarFormato(indice, chave, valor) {
    atualizar('formatos', campos.formatos.map((opcao, i) => i === indice ? { ...opcao, [chave]: valor } : opcao));
  }

  function selecionarEdicao(modalidade) {
    editar(modalidade);
    definir(modalidade ? {
      nome: modalidade.nome,
      categoria: modalidade.categoria || 'Outras modalidades',
      limite: modalidade.max_inscritos ?? '',
      maxEscolhas: modalidade.maxEscolhas ?? 1,
      formatos: modalidade.submodalidades.map(opcao => ({
        nome: opcao.nome, genero: opcao.genero || 'X', limite: opcao.max_inscritos ?? ''
      }))
    } : vazio());
    setArquivos({ capa: [], banner: [], edital: [] });
    setRetorno(null);
    if (modalidade) {
      formRef.current.scrollIntoView({ block: 'start' });
      primeiroCampo.current.focus({ preventScroll: true });
    }
  }

  async function executar(acao) {
    ocupar(true);
    setRetorno(null);
    try {
      const mensagem = await acao();
      setRetorno({ sucesso: mensagem });
      await carregar();
    } catch (erro) {
      setRetorno({ erro: erro.response?.data?.message || 'Não foi possível concluir a alteração.' });
    } finally { ocupar(false); }
  }

  function salvar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    executar(async () => {
      const dados = new FormData();
      dados.set('nome', campos.nome);
      dados.set('categoria', campos.categoria);
      dados.set('max_inscritos', campos.limite);
      dados.set('maxEscolhas', campos.maxEscolhas);
      dados.set('formatos', JSON.stringify(campos.formatos));
      if (arquivos.capa[0]) dados.set('imgCarrossel', arquivos.capa[0]);
      if (arquivos.banner[0]) dados.set('imgDetalhe', arquivos.banner[0]);
      if (edicao) {
        const { data } = await api.put('/admin/modalidades/' + edicao._id, dados);
        selecionarEdicao(data.data);
        return 'Modalidade atualizada.';
      }
      await api.post('/admin/modalidades', dados);
      selecionarEdicao(null);
      return 'Modalidade criada.';
    });
  }

  function publicarEdital(evento) {
    evento.preventDefault();
    if (ocupado || !arquivos.edital[0]) return;
    executar(async () => {
      const dados = new FormData();
      dados.set('modId', edicao._id);
      dados.set('edital', arquivos.edital[0]);
      await api.post('/admin/edital-modalidade', dados);
      selecionar('edital')([]);
      return 'Edital publicado.';
    });
  }

  function excluir(modalidade) {
    if (ocupado || !window.confirm(`Excluir a modalidade ${modalidade.nome}?`)) return;
    executar(async () => {
      await api.delete('/admin/modalidades/' + modalidade._id);
      if (edicao?._id === modalidade._id) selecionarEdicao(null);
      return 'Modalidade excluída.';
    });
  }

  const porCategoria = categoria => modalidades.filter(mod => (mod.categoria || 'Outras modalidades') === categoria);
  const grupos = filtro ? [filtro] : categorias;

  return <>
    <header className="admin-header-bar"><h2>Modalidades</h2></header>
    <section className="admin-card modalidade-editor" ref={formRef}>
      <div className="painel-linha painel-linha-entre">
        <h3>{edicao ? `Editar ${edicao.nome}` : 'Nova modalidade'}</h3>
        {edicao && <button type="button" className="painel-secundario" disabled={ocupado}
          onClick={() => selecionarEdicao(null)}>Nova modalidade</button>}
      </div>
      <form onSubmit={salvar} className="form-grid">
        <label className="campo-painel">Nome
          <input ref={primeiroCampo} value={campos.nome} required onChange={e => atualizar('nome', e.target.value)}/>
        </label>
        <label className="campo-painel">Categoria do edital
          <select value={campos.categoria} required onChange={e => atualizar('categoria', e.target.value)}>
            <option value="">Selecione</option>
            {categorias.map(categoria => <option key={categoria}>{categoria}</option>)}
          </select>
        </label>
        <label className="campo-painel">Vagas gerais por sala
          <input type="number" min="1" placeholder="Livre quando vazio" value={campos.limite}
            onChange={e => atualizar('limite', e.target.value)}/>
        </label>
        {campos.formatos.length > 1 && <label className="campo-painel">Máximo de formatos por aluno
          <input type="number" min="1" max={campos.formatos.length} required value={campos.maxEscolhas}
            onChange={e => atualizar('maxEscolhas', e.target.value)}/>
        </label>}
        <fieldset className="full-width modalidade-formatos">
          <legend>Formatos de participação</legend>
          {campos.formatos.map((opcao, indice) => <div className="modalidade-formato" key={indice}>
            <label className="campo-painel">Formato {indice + 1}
              <input value={opcao.nome} required placeholder="Ex. Dupla" onChange={e => alterarFormato(indice, 'nome', e.target.value)}/>
            </label>
            <label className="campo-painel">Participação
              <select value={opcao.genero} onChange={e => alterarFormato(indice, 'genero', e.target.value)}>
                {Object.entries(generos).map(([codigo, rotulo]) => <option key={codigo} value={codigo}>{rotulo}</option>)}
              </select>
            </label>
            <label className="campo-painel">Vagas do formato
              <input type="number" min="1" value={opcao.limite} placeholder="Usa o limite geral"
                onChange={e => alterarFormato(indice, 'limite', e.target.value)}/>
            </label>
            {indice === campos.formatos.length - 1 && <button type="button" className="painel-secundario"
              onClick={() => definir(atual => ({ ...atual, formatos: atual.formatos.slice(0, -1),
                maxEscolhas: Math.min(atual.maxEscolhas || 1, Math.max(1, indice)) }))}>
              Remover formato {indice + 1}
            </button>}
          </div>)}
          <button type="button" className="painel-secundario"
            onClick={() => atualizar('formatos', [...campos.formatos, formatoVazio])}>
            <FaPlus aria-hidden="true"/> Adicionar formato
          </button>
        </fieldset>
        <ArquivoCampo titulo="Capa" tipo="imagem" arquivos={arquivos.capa} selecionar={selecionar('capa')} required={!edicao} disabled={ocupado}/>
        <ArquivoCampo titulo="Banner" tipo="imagem" arquivos={arquivos.banner} selecionar={selecionar('banner')} required={!edicao} disabled={ocupado}/>
        <button className="painel-primario" disabled={ocupado}>{ocupado ? 'Salvando…' : edicao ? 'Salvar modalidade' : 'Criar modalidade'}</button>
      </form>
      {retorno && <p className={'painel-retorno' + (retorno.erro ? ' erro' : '')}
        role={retorno.erro ? 'alert' : 'status'}>{retorno.erro || retorno.sucesso}</p>}
    </section>

    {edicao && <section className="admin-card">
      <h3>Edital de {edicao.nome}</h3>
      <form className="form-grid" onSubmit={publicarEdital}>
        <ArquivoCampo titulo="PDF do edital" tipo="pdf" arquivos={arquivos.edital} selecionar={selecionar('edital')} required disabled={ocupado}/>
        <button className="painel-primario" disabled={ocupado || !arquivos.edital.length}>Publicar edital</button>
      </form>
    </section>}

    <section className="modalidades-catalogo">
      <div className="painel-linha painel-linha-entre">
        <h3>Catálogo · {modalidades.length} modalidades</h3>
        <label className="campo-painel">Filtrar catálogo
          <select value={filtro} onChange={e => filtrar(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categorias.map(categoria => <option key={categoria}>{categoria}</option>)}
          </select>
        </label>
      </div>
      {buscando && <p role="status">Carregando modalidades…</p>}
      {!buscando && !modalidades.length && <button className="painel-secundario" type="button" onClick={carregar}>Recarregar catálogo</button>}
      {grupos.map(categoria => {
        const lista = porCategoria(categoria);
        if (!lista.length) return filtro ? <p key={categoria}>Nenhuma modalidade nesta categoria.</p> : null;
        return <section key={categoria}>
          <h4>{categoria}</h4>
          <div className="painel-grade">
            {lista.map(modalidade => <article className="admin-card modalidade-card" key={modalidade._id}>
              <div className="modalidade-artes">
                <figure><img src={assetURL(modalidade.imgCarrossel || modalidade.imageUrl)} alt="" loading="lazy"/><figcaption>Capa</figcaption></figure>
                <figure><img src={assetURL(modalidade.imgDetalhe || modalidade.imageUrl)} alt="" loading="lazy"/><figcaption>Banner</figcaption></figure>
              </div>
              <h5>{modalidade.nome}</h5>
              <p>{modalidade.submodalidades.length ? modalidade.submodalidades.map(op =>
                op.nome + ' · ' + ((op.max_inscritos ?? modalidade.max_inscritos) ?? 'livre')).join(' / ')
                : modalidade.max_inscritos == null ? 'Inscrição livre' : `${modalidade.max_inscritos} vagas por sala`}</p>
              <div className="painel-linha">
                <button type="button" className="painel-secundario" aria-label={`Editar ${modalidade.nome}`}
                  disabled={ocupado} onClick={() => selecionarEdicao(modalidade)}><FaEdit aria-hidden="true"/> Editar</button>
                <button type="button" className="painel-secundario" aria-label={`Excluir ${modalidade.nome}`}
                  disabled={ocupado} onClick={() => excluir(modalidade)}><FaTrash aria-hidden="true"/> Excluir</button>
              </div>
            </article>)}
          </div>
        </section>;
      })}
    </section>
  </>;
}
