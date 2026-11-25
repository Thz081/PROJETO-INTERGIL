import { assetURL } from '../../api';
import TituloArmorial from '../../components/TituloArmorial';
import React, { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import api from '../../api';
import { useAudio } from '../../context/AudioContext';
import './style.css';

// SEU IP DE HOJE

const Horarios = () => {
    const { playClick } = useAudio();
    const [modalidadesComHorarios, setModalidadesComHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [idAberto, setIdAberto] = useState(null);

    useEffect(() => {
        const fetchHorariosPublicos = async () => {
            try {
                setLoading(true);
                const response = await api.get('/modalidades');

                // Filtra apenas as que têm horários cadastrados
                const modalidadesFiltradas = response.data.filter(
                    (mod) => mod.horarios && mod.horarios.length > 0
                );
                setModalidadesComHorarios(modalidadesFiltradas);
            } catch (err) {
                console.error('Erro ao buscar horários públicos:', err);
                setError('Erro ao carregar horários. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchHorariosPublicos();
    }, []);

    const toggleAccordion = (modId) => {
        playClick();
        if (idAberto === modId) setIdAberto(null);
        else setIdAberto(modId);
    };

    const renderConteudo = () => {
        if (loading) {
            return <p className="horarios-status-text">Carregando horários...</p>;
        }
        if (error) {
            return <p className="horarios-status-text error">{error}</p>;
        }
        if (modalidadesComHorarios.length === 0) {
            return <p className="horarios-status-text">Nenhum horário disponível no momento.</p>;
        }

        return (
            <div className="horarios-acordeao">
                {modalidadesComHorarios.map((mod) => {
                    // === CORREÇÃO DA IMAGEM ===
                    // Usa imgCarrossel do banco + IP
                    const imgSrc = assetURL(mod.imgCarrossel);
                    return (
                        <div key={mod._id} className="acordeao-item-horario">
                            <button type="button" aria-expanded={idAberto === mod._id}
                                className={`acordeao-header-horario ${idAberto === mod._id ? 'aberta' : ''}`}
                                onClick={() => toggleAccordion(mod._id)}
                            >
                                <img
                                    src={imgSrc}
                                    alt=""
                                    className="header-img-horario"
                                    width="50" height="50" loading="lazy"
                                    onError={e => {
                                        if (!e.currentTarget.src.endsWith('/armoriar.png')) e.currentTarget.src = '/images/armoriar.png';
                                    }}
                                />
                                <span className="header-titulo-horario">{mod.nome}</span>
                                <FaChevronDown aria-hidden="true"/>
                            </button>

                            {idAberto === mod._id && (
                                <div className="acordeao-conteudo-horario">
                                    <table className="horarios-tabela">
                                        <thead>
                                            <tr>
                                                <th>Categoria</th>
                                                <th>Data</th>
                                                <th>Horário</th>
                                                <th>Local</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mod.horarios.map((jogo) => (
                                                <tr key={jogo._id}>
                                                    <td data-label="Categoria:">{jogo.categoria}</td>
                                                    <td data-label="Data:">{jogo.data}</td>
                                                    <td data-label="Horário:">{jogo.horario}</td>
                                                    <td data-label="Local:">{jogo.local}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="horarios-wrapper">
            <div className="horarios-container">
                <h1 className="horarios-titulo"><TituloArmorial arte="horarios" escuro>Horários e Local dos Jogos</TituloArmorial></h1>
                <p className="horarios-subtitulo">
                    Sexta-feira na quadra: esportes com os professores das 10h30 às 12h e premiação às 13h.
                </p>

                <p className="programacao-link"><a href="/programacao/intergil-2026.xlsx" download>Baixar a programação completa com os confrontos</a></p>
                {renderConteudo()}

            </div>
        </div>
    );
};

export default Horarios;