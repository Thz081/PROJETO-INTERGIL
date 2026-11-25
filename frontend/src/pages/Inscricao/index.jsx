import React, { useEffect, useState } from 'react';
import TituloArmorial from '../../components/TituloArmorial';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCheck, FaChevronDown } from 'react-icons/fa6';
import api from '../../api';
import { useAuth } from '../../context/AuthProvider';
import useVagas from './useVagas';
import './style.css';

const diaDoPrazo = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric', month: 'long', timeZone: 'America/Recife'
});

function nomeDaOpcao(modalidade, opcao) {
  return ['Individual', modalidade.nome].includes(opcao.nome) ? '' : opcao.nome;
}

export default function Inscricao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [escolhas, escolher] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, enviar] = useState(false);
  const [tentativa, repetir] = useState(0);
  const vagas = useVagas(ficha?.turma);

  useEffect(() => {
    const consulta = new AbortController();
    async function carregar() {
      try {
        const minha = await api.get('/inscricoes/me', {
          signal: consulta.signal, validateStatus: status => status === 200 || status === 404
        });
        if (consulta.signal.aborted) return;
        if (minha.status === 200) { navigate('/meu-perfil', { replace: true }); return; }
        const { data } = await api.get('/inscricoes/opcoes', { signal: consulta.signal });
        if (!consulta.signal.aborted) setFicha(data);
      } catch {
        if (!consulta.signal.aborted) setErro('Não foi possível carregar a inscrição.');
      }
    }
    carregar();
    return () => consulta.abort();
  }, [navigate, tentativa]);

  if (!ficha) return <section className="inscricao-armoriar inscricao-estado">
    <p role={erro ? 'alert' : 'status'}>{erro || 'Carregando inscrição…'}</p>
    {erro && <button type="button" onClick={() => { setErro(''); repetir(n => n + 1); }}>Tentar novamente</button>}
  </section>;
  if (Date.now() >= Date.parse(ficha.fim)) return <section className="inscricao-armoriar inscricao-estado">
    <h1><TituloArmorial arte="inscricoes-encerradas">Inscrições encerradas</TituloArmorial></h1><Link to="/meu-perfil">Ver meu perfil <FaArrowRight aria-hidden="true"/></Link>
  </section>;

  const categorias = new Map();
  for (const modalidade of ficha.modalidades) {
    if (!categorias.has(modalidade.categoria)) categorias.set(modalidade.categoria, []);
    categorias.get(modalidade.categoria).push(modalidade);
  }
  const marcadas = ficha.modalidades.flatMap(modalidade => modalidade.opcoes
    .filter(opcao => escolhas.includes(opcao.codigo))
    .map(opcao => ({ ...opcao, modalidade })));
  const grupos = new Set([...ficha.creditos, ...marcadas.map(opcao => opcao.grupo)]);
  const faltam = Math.max(0, ficha.minimo - grupos.size);
  const podeEnviar = escolhas.length > 0 && faltam === 0;
  const conectado = vagas.status === 'Vagas ao vivo';
  const selecionar = codigo => escolher(lista =>
    lista.includes(codigo) ? lista.filter(escolha => escolha !== codigo) : [...lista, codigo]);

  async function confirmar(evento) {
    evento.preventDefault();
    if (!podeEnviar || enviando) return;
    enviar(true);
    setErro('');
    try {
      await api.post('/inscricoes', { modalidades: escolhas });
      navigate('/meu-perfil', { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao enviar. Tente novamente.');
      enviar(false);
    }
  }

  function renderizarOpcao(modalidade, opcao, formatosMarcados, avulsa = false) {
    const marcada = escolhas.includes(opcao.codigo);
    const livres = opcao.limite == null || vagas.contagem === null
      ? null : Math.max(0, opcao.limite - (vagas.contagem[opcao.codigo] || 0));
    const bloqueada = !marcada && (livres === 0 || formatosMarcados >= modalidade.maxEscolhas ||
      (grupos.size >= ficha.maximo && !grupos.has(opcao.grupo)));
    const nome = nomeDaOpcao(modalidade, opcao);
    const capacidade = opcao.limite == null ? 'Livre'
      : livres === null ? 'Consultando vagas' : livres === 0 ? 'Lotado' : livres + (livres === 1 ? ' vaga' : ' vagas');

    return <label className={avulsa ? 'inscricao-opcao inscricao-opcao-avulsa' : 'inscricao-opcao'} key={opcao.codigo}>
      <input type="checkbox" checked={marcada} disabled={bloqueada || enviando}
        onChange={() => selecionar(opcao.codigo)}/>
      <span className="inscricao-opcao-texto">
        <strong>{avulsa ? modalidade.nome : opcao.nome}</strong>
        {avulsa && nome && <small>{nome}</small>}
      </span>
      <span className={'inscricao-vaga' + (livres === 0 ? ' lotada' : '')}>{capacidade}</span>
    </label>;
  }

  return <form className="inscricao-armoriar" onSubmit={confirmar}>
    <header className="inscricao-topo">
      <Link to="/meu-perfil">Meu perfil</Link>
      <h1><TituloArmorial arte="inscricao">Inscrição nos jogos</TituloArmorial></h1>
      <p>Escolha de <strong>{ficha.minimo} a {ficha.maximo} modalidades</strong> até {diaDoPrazo.format(Date.parse(ficha.fim) - 1)}.</p>
      <p className="inscricao-turma"><span>{user.turma}</span>
        <span className={conectado ? 'inscricao-conexao conectada' : 'inscricao-conexao'} role="status">{vagas.status}</span></p>
    </header>
    <div className="inscricao-layout">
      <aside className="inscricao-resumo" aria-label="Resumo da inscrição">
        <div className="inscricao-resumo-contagem">
          <h2>Suas escolhas</h2>
          <p aria-live="polite"><strong>{grupos.size}</strong> de {ficha.maximo} modalidades</p>
          <meter min="0" max={ficha.maximo} value={grupos.size} aria-label="Modalidades contabilizadas"/>
        </div>
        {ficha.creditos.length > 0 && <p className="inscricao-creditos">
          Pré-Gil incluído · {ficha.creditos.map(credito => ficha.modalidades.find(m => m.slug === credito)?.nome || credito).join(', ')}
        </p>}
        {marcadas.length > 0 && <ul className="inscricao-marcadas">
          {marcadas.map(opcao => <li key={opcao.codigo}>
            <FaCheck aria-hidden="true"/> <span>{opcao.modalidade.nome}
              {nomeDaOpcao(opcao.modalidade, opcao) && <small>{nomeDaOpcao(opcao.modalidade, opcao)}</small>}</span>
          </li>)}
        </ul>}
        <div className="inscricao-confirmacao">
          <p id="inscricao-requisito">{faltam > 0 ? `Falta escolher ${faltam} ${faltam === 1 ? 'modalidade' : 'modalidades'}.`
            : !escolhas.length ? 'Escolha uma opção para enviar.' : 'Você já pode confirmar.'}</p>
          {erro && <p className="inscricao-erro" role="alert">{erro}</p>}
          <button type="submit" aria-describedby="inscricao-requisito" disabled={!podeEnviar || enviando}>
            {enviando ? 'Enviando…' : 'Confirmar inscrição'} <FaArrowRight aria-hidden="true"/>
          </button>
        </div>
      </aside>
      <div className="inscricao-catalogo">
        <nav className="inscricao-categorias" aria-label="Categorias de inscrição">
          <label className="inscricao-atalho">
            Ir para categoria
            <select defaultValue="" onChange={evento => {
              const destino = document.getElementById(evento.target.value);
              if (destino) {
                destino.focus({ preventScroll: true });
                destino.scrollIntoView();
              }
              evento.target.value = '';
            }}>
              <option value="" disabled>Selecione uma categoria</option>
              {[...categorias.keys()].map((categoria, indice) => <option key={categoria}
                value={`inscricao-categoria-${indice}`}>{categoria}</option>)}
            </select>
          </label>
          {[...categorias.keys()].map((categoria, indice) => <a key={categoria} href={`#inscricao-categoria-${indice}`}>{categoria}</a>)}
        </nav>
        {[...categorias].map(([categoria, modalidades], indice) => <section className="inscricao-categoria" key={categoria}
          id={`inscricao-categoria-${indice}`} aria-labelledby={`inscricao-titulo-${indice}`} tabIndex={-1}>
          <h2 id={`inscricao-titulo-${indice}`}>{categoria}</h2>
          <div className="inscricao-opcoes">
            {modalidades.map(modalidade => {
              if (modalidade.opcoes.length === 1) return renderizarOpcao(modalidade, modalidade.opcoes[0], 0, true);
              const formatosMarcados = modalidade.opcoes.filter(opcao => escolhas.includes(opcao.codigo)).length;
              const contamJuntos = new Set(modalidade.opcoes.map(opcao => opcao.grupo)).size === 1;
              return <details className="inscricao-modalidade" key={modalidade.slug}>
                <summary>
                  <span className="inscricao-opcao-texto"><strong>{modalidade.nome}</strong>
                    <small>{formatosMarcados ? `${formatosMarcados} selecionado${formatosMarcados > 1 ? 's' : ''}` : `${modalidade.opcoes.length} opções`}</small>
                  </span>
                  <FaChevronDown aria-hidden="true"/>
                </summary>
                <div className="inscricao-formatos">
                  <p>{modalidade.maxEscolhas === 1 ? 'Escolha uma opção.' : contamJuntos
                    ? 'As opções selecionadas contam como uma modalidade.' : 'Cada opção conta como uma modalidade.'}</p>
                  {modalidade.opcoes.map(opcao => renderizarOpcao(modalidade, opcao, formatosMarcados))}
                </div>
              </details>;
            })}
          </div>
        </section>)}
      </div>
    </div>
  </form>;
}
