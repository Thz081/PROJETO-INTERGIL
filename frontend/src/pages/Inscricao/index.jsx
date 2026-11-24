import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthProvider';
import useVagas from './useVagas';
import './style.css';

export default function Inscricao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [escolhas, escolher] = useState([]);
  const [erro, setErro] = useState('');
  const [enviando, enviar] = useState(false);
  const [visitante, visitar] = useState(false);
  const [destino, setDestino] = useState('');
  const [slug, setSlug] = useState('');
  const [semTime, declarar] = useState(false);
  const vagas = useVagas(ficha?.turma, visitante ? destino : '');
  useEffect(() => {
    let ativa = true;
    async function carregar() {
      try {
        const minha = await api.get('/inscricoes/me', { validateStatus: s => s === 200 || s === 404 });
        if (!ativa) return;
        if (minha.status === 200) { navigate('/meu-perfil', { replace: true }); return; }
        const { data } = await api.get('/inscricoes/opcoes');
        if (ativa) setFicha(data);
      } catch { if (ativa) setErro('Não foi possível carregar a inscrição. Recarregue a página para tentar novamente.'); }
    }
    carregar();
    return () => { ativa = false; };
  }, [navigate]);
  if (!ficha) return <p className="form-edicao">{erro || 'Carregando inscrição…'}</p>;
  if (Date.now() >= Date.parse(ficha.fim)) return <section className="form-edicao"><h1>Inscrições encerradas</h1><Link to="/meu-perfil">Ver meu perfil</Link></section>;

  const marcadas = ficha.modalidades.filter(m => m.opcoes.some(op => escolhas.includes(op.codigo)));
  const grupos = new Set(ficha.creditos);
  marcadas.forEach(m => m.opcoes.filter(op => escolhas.includes(op.codigo)).forEach(op => grupos.add(op.grupo)));
  const categorias = [...new Set(ficha.modalidades.map(m => m.categoria))];
  const toggle = codigo => escolher(lista => lista.includes(codigo) ? lista.filter(c => c !== codigo) : [...lista, codigo]);
  async function confirmar(e) {
    e.preventDefault();
    enviar(true); setErro('');
    try {
      await api.post('/inscricoes', { modalidades: escolhas, visitante: visitante ? { turma: destino, slug, semTime } : undefined });
      navigate('/meu-perfil', { replace: true });
    } catch (err) { setErro(err.response?.data?.message || 'Falha ao enviar. Tente novamente.'); enviar(false); }
  }
  return <form className="form-edicao" onSubmit={confirmar}>
    <p className="kicker">{user.nome} · {user.turma}</p>
    <h1>Inscrição nos jogos</h1>
    <p>Escolha de {ficha.minimo} a {ficha.maximo} modalidades até 1º de dezembro.</p>
    {ficha.creditos.length > 0 && <p>Pré-Gil já contabilizado · {ficha.creditos.join(', ')}</p>}
    <div className="placar-form"><strong aria-live="polite">{grupos.size} de {ficha.maximo} modalidades</strong><span>{vagas.status}</span></div>
    {categorias.map(cat => <section key={cat}>
      <h2>{cat}</h2>
      {ficha.modalidades.filter(m => m.categoria === cat).map(m => {
        const n = m.opcoes.filter(op => escolhas.includes(op.codigo)).length;
        const contagem = visitante && slug === m.slug && destino ? vagas.externas : vagas.contagem;
        const opcoes = m.opcoes.map(op => {
          const marcada = escolhas.includes(op.codigo);
          const livres = op.limite == null ? null : Math.max(0, op.limite - (contagem[op.codigo] || 0));
          const bloqueada = !marcada && ((livres === 0) || n >= m.maxEscolhas ||
            (grupos.size >= ficha.maximo && !grupos.has(op.grupo)));
          return <label className="escolha" key={op.codigo}><input type="checkbox" checked={marcada} disabled={bloqueada || enviando}
            onChange={() => toggle(op.codigo)} /><span>{m.opcoes.length === 1 ? m.nome + (op.nome === 'Individual' || op.nome === m.nome ? '' : ' · ' + op.nome) : op.nome}</span>
            <small>{livres === null ? 'Livre' : ['Contagem indisponível','Conectando'].includes(vagas.status) ? 'Consultando vagas' : livres + (livres === 1 ? ' vaga' : ' vagas')}</small></label>;
        });
        if (m.opcoes.length === 1) return <div key={m.slug}>{opcoes}</div>;
        return <details key={m.slug}><summary>{m.nome} {n > 0 && <small>({n})</small>}</summary>
          {m.slug === 'fifa' && ficha.fifa === 'pendente' && <p>A participação nos dois formatos aguarda confirmação. Por enquanto, escolha X1 ou X2.</p>}
          {m.maxEscolhas > 1 && <p>{m.slug === 'fifa' && ficha.fifa === 'separada' ? 'Cada formato utiliza uma modalidade.' : 'As opções marcadas aqui contam como uma modalidade.'}</p>}
          {m.slug === 'kata' && <p>Escolha uma luta.</p>}{opcoes}</details>;
      })}
    </section>)}
    <section><h2>Representação da turma</h2>
      <label><input type="checkbox" checked={visitante} onChange={e => visitar(e.target.checked)}/> Jogar uma modalidade por outra sala</label>
      {visitante && <div className="representacao">
        <label>Sala de destino<select required value={destino} onChange={e => setDestino(e.target.value)}><option value="">Selecione</option>
          {ficha.salas.filter(s => s.turma !== ficha.turma).map(s => <option key={s.turma} value={s.turma}>{s.turma} · {s.nome}</option>)}</select></label>
        <label>Modalidade<select required value={slug} onChange={e => setSlug(e.target.value)}><option value="">Selecione</option>
          {ficha.modalidades.map(m => <option key={m.slug} value={m.slug}>{m.nome}</option>)}</select></label>
        <label><input type="checkbox" required checked={semTime} onChange={e => declarar(e.target.checked)}/> Minha sala não tem time nessa modalidade.</label>
      </div>}
    </section>
    {erro && <p role="alert">{erro}</p>}
    <button className="acao" disabled={enviando || !escolhas.length || grupos.size < ficha.minimo}>{enviando ? 'Enviando…' : 'Confirmar inscrição'}</button>
  </form>;
}
