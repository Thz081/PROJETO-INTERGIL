// Arquivo: intergil-client/src/pages/AdminSalas/index.js
// VERSÃO 3.3 - 100% ALINHADO COM 'turma'

import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaPlus, FaMinus, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api, { assetURL } from '../../api';
import ArquivoCampo from '../../components/ArquivoCampo';
import './style.css';
import ImportarAlunos from './ImportarAlunos';
import DialogoPontuacao from './DialogoPontuacao';

const AdminSalas = () => {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nomeSala, setNomeSala] = useState('');
  const [turmaSala, setTurmaSala] = useState(''); // <-- USA 'turma'
  const [logoSala, setLogoSala] = useState('');
  const [instagramSala, setInstagramSala] = useState('');
  const [editando, setEditando] = useState(null);
  const [arquivoLogo, setArquivoLogo] = useState(null);
  const [pontosInput, setPontosInput] = useState({});
  const [lancamento, definirLancamento] = useState(null);
  const [retornoPontos, responderPontos] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [retorno, setRetorno] = useState('');

  const fetchSalas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/salas');
      setSalas(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao buscar salas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalas();
  }, []);

  function abrirLancamento(sala, sinal) {
    const pontos = Number(pontosInput[sala._id]);
    if (!Number.isSafeInteger(pontos) || pontos < 1) {
      responderPontos({ erro: true, texto: 'Informe a quantidade de pontos como um inteiro positivo.' });
      return;
    }
    responderPontos(null);
    definirLancamento({ sala, pontos: sinal * pontos });
  }

  function atualizarPontuacao(sala) {
    setSalas(atuais => atuais.map(item => item._id === sala._id ? { ...item, pontos: sala.pontos } : item));
    setPontosInput(atuais => ({ ...atuais, [sala._id]: '' }));
    responderPontos({ texto: `Pontuação de ${sala.nome} atualizada para ${sala.pontos} pts.` });
  }
  
  // --- CRIAR SALA (CORRIGIDO) ---
  const handleCreateSala = async (e) => {
    e.preventDefault();
    if (!nomeSala || !turmaSala) { // <-- USA 'turma'
      setError('Nome e Turma são obrigatórios para criar uma sala.');
      return;
    }
    if (salvando) return;
    setSalvando(true); setRetorno('');
    try {
      setError(null);
      const { data } = await api.request({ method: editando ? 'put' : 'post', url: '/admin/salas' + (editando ? '/' + editando : ''), data: {
        nome: nomeSala,
        turma: turmaSala, // <-- USA 'turma'
        logo_url: logoSala || '/images/armoriar.png',
        instagram: instagramSala || '#'
      }});
      if (arquivoLogo) {
        const form = new FormData(); form.append('logo', arquivoLogo);
        setEditando(data._id);
        await api.post('/admin/salas/' + data._id + '/logo', form);
      }
      setEditando(null); setArquivoLogo(null);
      fetchSalas();
      setNomeSala('');
      setTurmaSala('');
      setLogoSala('');
      setInstagramSala('');
      setRetorno('Sala salva.');
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível salvar a sala.');
    } finally { setSalvando(false); }
  };

  const handleDeleteSala = async (salaId, salaNome) => {
    // ... (função delete está ok) ...
    if (!window.confirm(`TEM CERTEZA QUE QUER APAGAR A SALA "${salaNome}"?`)) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/admin/salas/${salaId}`);
      fetchSalas();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao apagar sala');
    }
  };

  const handleEditSala = (sala) => {
    setNomeSala(sala.nome); setTurmaSala(sala.turma); setLogoSala(sala.logo_url || '');
    setInstagramSala(sala.instagram || ''); setEditando(sala._id); setArquivoLogo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="admin-salas-container">
      <header className="admin-header-bar"><h2>Salas e alunos</h2></header>
      <div className="admin-section">
        <h2>{editando ? 'Editar sala' : 'Adicionar nova sala'}</h2>
        <form onSubmit={handleCreateSala} className="admin-form-inline">
          <div className="input-group">
            <label htmlFor="sala-nome">Nome da sala</label>
            <input 
              type="text" 
              id="sala-nome" required placeholder="Ex. Spartta"
              value={nomeSala}
              onChange={(e) => setNomeSala(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="sala-turma">Série e turma</label>
            <input 
              type="text" 
              id="sala-turma" required placeholder="Ex. 1° A ADM"
              value={turmaSala}
              onChange={(e) => setTurmaSala(e.target.value)}
            />
          </div>
          <div className="input-group">
            <ArquivoCampo titulo="Brasão da turma" tipo="imagem" arquivos={arquivoLogo ? [arquivoLogo] : []}
              selecionar={arquivos => setArquivoLogo(arquivos[0] || null)} disabled={salvando}/>
            <label htmlFor="sala-logo-url">Caminho do brasão</label>
            <input 
              type="text" 
              id="sala-logo-url" placeholder="/images/turmas/wardens.png"
              value={logoSala}
              onChange={(e) => setLogoSala(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="sala-insta">Instagram (opcional)</label>
            <input 
              type="text" 
              id="sala-insta" placeholder="Link do perfil"
              value={instagramSala}
              onChange={(e) => setInstagramSala(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn-submit" disabled={salvando}>
            <FaPlus /> {editando ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
        {error && <p role="alert" className="painel-retorno erro">{error}</p>}
        {retorno && <p role="status" className="painel-retorno">{retorno}</p>}
      </div>

      <ImportarAlunos salas={salas}/>
      <div className="admin-section">
        <h2>Salas Cadastradas ({salas.length})</h2>
        <Link to="/admin-pontuacao" className="painel-link">Lançar pódios e controlar o ranking</Link>
        {retornoPontos && <p role={retornoPontos.erro ? 'alert' : 'status'} className={'painel-retorno' + (retornoPontos.erro ? ' erro' : '')}>{retornoPontos.texto}</p>}
        {loading && <p>Carregando...</p>}
        <div className="admin-tabela-container" role="region" aria-label="Salas cadastradas" tabIndex={0}>
          <table className="admin-tabela">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Nome</th>
                <th>Turma</th>
                <th>Insta</th>
                <th>Pontos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {salas.map((sala) => {
                const pontosAtuais = pontosInput[sala._id] || '';
                return (
                  <tr key={sala._id}>
                    <td>
                      {/* AQUI A GENTE CHAMA A LOGO COM A FUNÇÃO DE SEGURANÇA */}
                      <img 
                        src={assetURL(sala.logo_url)}
                        alt={sala.nome} 
                        className="tabela-logo" 
                      />
                    </td>
                    <td><strong>{sala.nome}</strong></td>
                    <td>{sala.turma}</td> {/* <-- EXIBE O CAMPO 'turma' */}
                    <td className="tabela-insta-icon">
                      {sala.instagram && sala.instagram !== '#' ? (
                        <a href={sala.instagram} target="_blank" rel="noopener noreferrer">
                          <FaInstagram />
                        </a>
                      ) : ( <span>-</span> )}
                    </td>
                    <td style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>
                      {sala.pontos}
                    </td>
                    <td>
                      <div className="tabela-acoes-pontos">
                        <input 
                          type="number" min="1" step="1" inputMode="numeric"
                          className="admin-pontos-input"
                          placeholder="Pts" aria-label={`Pontos de ${sala.nome}`}
                          value={pontosAtuais}
                          onChange={e => setPontosInput(atuais => ({ ...atuais, [sala._id]: e.target.value }))}
                        />
                        <button 
                          onClick={() => abrirLancamento(sala, 1)}
                          className="admin-btn-tabela add" 
                          title="Adicionar Pontos"
                        >
                          <FaPlus />
                        </button>
                        <button 
                          onClick={() => abrirLancamento(sala, -1)}
                          className="admin-btn-tabela remove" 
                          title="Remover Pontos"
                        >
                          <FaMinus />
                        </button>
                        <span style={{color: 'var(--text-secondary)', margin: '0 5px'}}>|</span>
                        <button onClick={() => handleEditSala(sala)} className="admin-btn-tabela edit" title="Editar Sala">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDeleteSala(sala._id, sala.nome)} className="admin-btn-tabela delete" title="Apagar Sala">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {lancamento && <DialogoPontuacao {...lancamento} fechar={() => definirLancamento(null)} atualizou={atualizarPontuacao}/>}
    </div>
  );
};

export default AdminSalas;
