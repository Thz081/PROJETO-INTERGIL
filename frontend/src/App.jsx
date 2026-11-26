import React, { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import './styles/global.css'; 

// === Layouts ===
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import MonitorLayout from './components/MonitorLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// === Páginas Públicas ===
import Home from './pages/Home';
import Historia from './pages/Historia'; 
import Login from './pages/Login';
import ModalidadeDetalhe from './pages/ModalidadeDetalhe';
import Inscricao from './pages/Inscricao'; 
import LoginAdmin from './pages/LoginAdmin';
import LoginMonitor from './pages/LoginMonitor';
import Horarios from './pages/Horarios'; 
import MeuPerfil from './pages/MeuPerfil';
import Ranking from './pages/Ranking';
import Extrato from './pages/Ranking/Extrato';
import Resultados from './pages/Resultados';

// === Páginas Admin ===
import AdminDashboard from './pages/AdminDashboard'; 
import AdminSalas from './pages/AdminSalas'; 
import AdminLog from './pages/AdminLog'; 
import AdminListaInscricoes from './pages/AdminListaInscricoes';
import AdminModalidades from './pages/AdminModalidades';
import AdminHallFama from './pages/AdminHallFama';
import AdminPontuacao from './pages/AdminPontuacao';

// === Páginas Monitor ===
import MonitorDashboard from './pages/MonitorDashboard';
import MonitorHorarios from './pages/MonitorHorarios';
import MonitorLinks from './pages/MonitorLinks';

// === Context ===
import { useAudio } from './context/AudioContext';

const Momentos = lazy(() => import('./pages/Momentos'));
const AdminMomentos = lazy(() => import('./pages/AdminMomentos'));

function TelaMomentos({ equipe = false }) {
  return <Suspense fallback={<p className="momentos-carregando" role="status">Carregando Momentos…</p>}>
    {equipe ? <AdminMomentos /> : <Momentos />}
  </Suspense>;
}

// === NOVO LAYOUT PÚBLICO (USANDO OUTLET) ===
// Isso impede que o Header/Footer recarreguem a cada clique
const PublicLayout = () => (
  <>
    <Header />
    <main className="main-content"> {/* Classe opcional para ajustes CSS */}
      <Outlet /> 
    </main>
    <Footer />
  </>
);

function App() {
  const { playClick } = useAudio();

  return (
    <div className="App" onClickCapture={evento => {
      if (evento.target.closest?.('a[href], summary, button:not(:disabled):not(.arm-som)')) playClick();
    }}>
      <ScrollToTop />
      
      <Routes>
        {/* === ÁREA PÚBLICA (COM HEADER/FOOTER) === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/historia" element={<Historia />} />
          <Route path="/momentos" element={<TelaMomentos />} />
          <Route path="/momentos/albuns" element={<TelaMomentos />} />
          <Route path="/momentos/turmas/:sala" element={<TelaMomentos />} />
          <Route path="/momentos/lances" element={<TelaMomentos />} />
          <Route path="/momentos/:id" element={<TelaMomentos />} />
          <Route path="/modalidade/:slug" element={<ModalidadeDetalhe />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/ranking/salas/:id" element={<Extrato />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login-admin" element={<LoginAdmin />} />
          <Route path="/login-monitor" element={<LoginMonitor />} />
          
          {/* Rotas Protegidas de Aluno (Dentro do Layout Público) */}
          <Route element={<ProtectedRoute role="aluno" />}>
            <Route path="/meu-perfil" element={<MeuPerfil />} />
            <Route path="/inscricao" element={<Inscricao />} />
          </Route>
        </Route>

        {/* === ÁREA ADMIN (SEM HEADER/FOOTER PÚBLICO) === */}
        <Route element={<ProtectedRoute role="gestao" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-salas" element={<AdminSalas />} />
          <Route path="/admin-pontuacao" element={<AdminPontuacao />} />
          <Route path="/admin-log" element={<AdminLog />} />
          <Route path="/admin-lista-inscricoes" element={<AdminListaInscricoes />} />
          <Route path="/admin-momentos" element={<TelaMomentos equipe />} />
          <Route path="/admin-dashboard/modalidades" element={<AdminModalidades />} />
          <Route path="/admin-dashboard/hall" element={<AdminHallFama />} />
        </Route>
        
        </Route>
        {/* === ÁREA MONITOR === */}
        <Route element={<ProtectedRoute role="monitor" />}>
        <Route element={<MonitorLayout />}>
          <Route path="/monitor-dashboard" element={<MonitorDashboard />} />
          <Route path="/monitor-horarios" element={<MonitorHorarios />} />
          <Route path="/monitor-links" element={<MonitorLinks />} />
          <Route path="/monitor-momentos" element={<TelaMomentos equipe />} />
        </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
