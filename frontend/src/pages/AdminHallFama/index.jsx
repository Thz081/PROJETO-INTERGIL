import { assetURL } from '../../api';
import ArquivoCampo from '../../components/ArquivoCampo';
import React, { useState, useEffect } from 'react';
import api from '../../api';
import { FaTrophy, FaTrash, FaPlus } from 'react-icons/fa';
import './style.css'; 

const AdminHallFama = () => {
    const [hall, setHall] = useState([]);
    const [loading, setLoading] = useState(false);
    const [retorno, setRetorno] = useState(null);

    // Form
    const [ano, setAno] = useState('');
    const [turma, setTurma] = useState('');
    const [pontos, setPontos] = useState('');
    const [instagram, setInstagram] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchHall();
    }, []);

    const fetchHall = async () => {
        try {
            const res = await api.get('/admin/hall');
            setHall(res.data);
        } catch (error) {
            setRetorno({ erro: true, texto: "Não foi possível carregar o Hall da Fama." });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || loading) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('ano', ano);
        formData.append('turma', turma);
        formData.append('pontos', pontos);
        formData.append('instagram', instagram);
        formData.append('logo', file); 

        try {
            await api.post('/admin/hall', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setRetorno({ texto: 'Campeão adicionado.' });
            setAno(''); setTurma(''); setPontos(''); setInstagram(''); setFile(null);
            fetchHall();
        } catch (error) {
            setRetorno({ erro: true, texto: error.response?.data?.message || 'Não foi possível salvar o campeão.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja apagar este registro?")) {
            try {
                await api.delete(`/admin/hall/${id}`);
                fetchHall();
            } catch (error) {
                setRetorno({ erro: true, texto: error.response?.data?.message || "Não foi possível excluir." });
            }
        }
    };

    return (
        <div className="admin-content-inner">
            <div className="admin-header-bar">
                <h2><FaTrophy /> Gerenciar Hall da Fama</h2>
            </div>

            <div className="admin-card">
                <h3>Novo Campeão</h3>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="input-group">
                        <label htmlFor="hall-ano">Ano</label>
                        <input id="hall-ano" type="number" min="1900" value={ano} onChange={e=>setAno(e.target.value)} required className="admin-input" placeholder="2024"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="hall-equipe">Equipe campeã</label>
                        <input id="hall-equipe" value={turma} onChange={e=>setTurma(e.target.value)} required className="admin-input" placeholder="Ex: BLUESTORM"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="hall-pontos">Pontos (opcional)</label>
                        <input id="hall-pontos" value={pontos} onChange={e=>setPontos(e.target.value)} className="admin-input" placeholder="Ex: 1500"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="hall-insta">Instagram (opcional)</label>
                        <input id="hall-insta" type="url" value={instagram} onChange={e=>setInstagram(e.target.value)} className="admin-input" placeholder="https://instagram.com/..."/>
                    </div>
                    <ArquivoCampo titulo="Brasão da equipe campeã" tipo="imagem" arquivos={file ? [file] : []}
                        selecionar={arquivos => setFile(arquivos[0] || null)} required disabled={loading}/>
                    <button disabled={loading} className="upload-btn-submit full-width">
                        {loading ? "Salvando..." : <><FaPlus/> Adicionar</>}
                    </button>
                </form>
                {retorno && <p role={retorno.erro ? 'alert' : 'status'} className={'painel-retorno' + (retorno.erro ? ' erro' : '')}>{retorno.texto}</p>}
            </div>

            <div className="hall-list painel-tabela-scroll" role="region" aria-label="Histórico de campeões" tabIndex={0} style={{marginTop: '20px'}}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Ano</th>
                            <th>Foto</th>
                            <th>Turma</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hall.map(h => (
                            <tr key={h._id}>
                                <td data-label="Ano">{h.ano}</td>
                                <td data-label="Foto">
                                    <img 
                                        src={assetURL(h.logo_path)}
                                        alt={h.turma} 
                                        style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #fff'}}
                                        onError={(e)=>{e.target.src='/images/armoriar.png'}}
                                    />
                                </td>
                                <td data-label="Turma">
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <span>{h.turma}</span>
                                        {h.instagram && <span style={{fontSize: '0.7rem', color: '#aaa'}}>Insta: Sim</span>}
                                    </div>
                                </td>
                                <td data-label="Ações">
                                    <button onClick={() => handleDelete(h._id)} className="painel-secundario" aria-label={`Excluir campeão de ${h.ano}`}><FaTrash/> Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminHallFama;