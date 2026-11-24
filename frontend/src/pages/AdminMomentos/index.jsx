import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaPlus, FaVideo, FaUpload, FaTimes } from 'react-icons/fa';
import api, { assetURL } from '../../api';
import { useAudio } from '../../context/AudioContext';
// Reusa o CSS do AdminSalas para manter o padrão
import '../AdminSalas/style.css'; 

const AdminMomentos = () => {
  const { playClick } = useAudio();
  const [momentos, setMomentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [arquivo, setArquivo] = useState(null); // <-- NOVO: Guarda o arquivo
  const [preview, setPreview] = useState(null); // <-- NOVO: Preview da imagem
  const input = useRef(null);
  const [progresso, setProgresso] = useState(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const [ordem, setOrdem] = useState(99);

  // --- 1. BUSCAR OS MOMENTOS ---
  const fetchMomentos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/momentos');
      setMomentos(data);
    } catch (err) {
      setError('Erro ao carregar momentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMomentos();
  }, []);

  // --- 2. LIDA COM A SELEÇÃO DO ARQUIVO ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivo(file);
      // Cria um preview se for imagem
      if (file.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview(null);
      }
    }
  };

  // --- 3. CRIAR NOVO MOMENTO (COM UPLOAD) ---
  const handleCreateMomento = async (e) => {
    e.preventDefault();
    playClick();

    if (!titulo || !arquivo) {
      setError('Título e Arquivo são obrigatórios.');
      return;
    }

    // Para enviar arquivo, precisamos de FormData
    const formData = new FormData();
    formData.append('titulo', titulo);

    formData.append('ordem', ordem);
    formData.append('arquivoMomento', arquivo); // Tem que bater com o backend!

    try {
      setError(null);
      // O axios detecta o FormData e ajusta o header automaticamente
      setProgresso(0);
      await api.post('/admin/momentos', formData, { onUploadProgress: e => setProgresso(e.total ? Math.round(100 * e.loaded / e.total) : 0) });
      
      // Limpa o form
      setTitulo('');
      setArquivo(null);
      setPreview(null);
      input.current.value = '';
      setOrdem(99);
      
      // Atualiza a lista
      fetchMomentos();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao criar momento.');
    } finally { setProgresso(null); }
  };

  // --- 4. DELETAR MOMENTO ---
  const handleDeleteMomento = async (id, titulo) => {
    playClick();
    if (!window.confirm(`Tem certeza que quer apagar o momento "${titulo}"?`)) {
      return;
    }
    try {
      setError(null);
      await api.delete(`/admin/momentos/${id}`);
      fetchMomentos(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao deletar momento.');
    }
  };

  return (
    <>
      <div className="admin-header-bar">
        <h2>Gerenciar Momentos</h2>
      </div>

      <div className="admin-content-inner">
        {/* --- Formulário de Adicionar --- */}
        <div className="admin-section">
          <h2>Adicionar Novo Momento</h2>
          <form onSubmit={handleCreateMomento} className="admin-form-inline">
            
            <div className="input-group" style={{ flex: 2 }}>
              <label>Título (Legenda)</label>
              <input 
                type="text" 
                placeholder="Ex: Abertura 2026" 
                value={titulo} 
                onChange={(e) => setTitulo(e.target.value)} 
              />
            </div>

            <div className="input-group" style={{ width: '80px' }}>
              <label>Ordem</label>
              <input 
                type="number" 
                value={ordem} 
                onChange={(e) => setOrdem(e.target.value)} 
              />
            </div>

            {/* INPUT DE ARQUIVO (CUSTOMIZADO) */}
            <div className="input-group" style={{ flex: 2 }}>
              <label>Foto ou vídeo MP4/WebM · até 100 MB</label>
              <div className="file-upload-wrapper">
                <label htmlFor="momento-upload" className="custom-file-upload">
                  <FaUpload /> {arquivo ? arquivo.name : "Escolher Arquivo"}
                </label>
                <input 
                  id="momento-upload" 
                  type="file" 
                  ref={input} accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                  onChange={handleFileChange}
                  style={{ display: 'none' }} // Esconde o input feio original
                />
                {/* Botão de limpar arquivo */}
                {arquivo && (
                  <button 
                    type="button" 
                    className="clear-file-btn"
                    onClick={() => { setArquivo(null); setPreview(null); input.current.value = ''; }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            <button type="submit" disabled={progresso !== null} className="admin-btn-submit">
              <FaPlus /> {progresso === null ? "Adicionar" : "Enviando " + progresso + "%"}
            </button>
          </form>

          {/* PREVIEW DA IMAGEM (SE HOUVER) */}
          {preview && (
            <div style={{ marginTop: '15px' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>Pré-visualização:</p>
              <img 
                src={preview} 
                alt="Preview" 
                style={{ maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--neon-purple)' }} 
              />
            </div>
          )}

          {error && <div className="admin-error">{error}</div>}
        </div>

        {/* --- Tabela de Momentos Cadastrados --- */}
        <div className="admin-section">
          <h2>Momentos Cadastrados ({momentos.length})</h2>
          {loading && <p>Carregando...</p>}
          
          <div className="admin-tabela-container">
            <table className="admin-tabela" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Mídia</th>
                  <th>Tipo</th>
                  <th>Ordem</th>
                  <th>Título</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {momentos.map((momento) => {
                  // Corrige a URL pra exibir
                  const mediaUrl = assetURL(momento.url);

                  return (
                    <tr key={momento._id}>
                      <td>
                        {momento.tipo === 'foto' ? (
                          <img src={mediaUrl} alt="thumb" className="tabela-logo" />
                        ) : (
                          <div style={{ width: '40px', height: '40px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                            <FaVideo />
                          </div>
                        )}
                      </td>
                      <td>{momento.tipo === 'video' ? 'Vídeo' : 'Foto'}</td>
                      <td>{momento.ordem}</td>
                      <td><strong>{momento.titulo}</strong></td>
                      <td>
                        <div className="tabela-acoes">
                          <button onClick={() => handleDeleteMomento(momento._id, momento.titulo)} className="admin-btn-tabela delete" title="Apagar">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminMomentos;