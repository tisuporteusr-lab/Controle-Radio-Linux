import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { RadiosView } from './views/RadiosView';
import { ManutencoesView } from './views/ManutencoesView';
import { SetoresView } from './views/SetoresView';
import { RelatoriosView } from './views/RelatoriosView';
import { UsuariosView } from './views/UsuariosView';

// Modals
import { NovaManutencaoModal } from './components/NovaManutencaoModal';
import { RegistrarRetornoModal } from './components/RegistrarRetornoModal';
import { RadioDetailModal } from './components/RadioDetailModal';
import { NovoRadioModal } from './components/NovoRadioModal';
import { NovoSetorModal } from './components/NovoSetorModal';
import { NovoUsuarioModal } from './components/NovoUsuarioModal';

import { Radio, Setor, Manutencao, User } from './types';
import { api } from './services/api';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Global state
  const [setores, setSetores] = useState<Setor[]>([]);
  const [activeMaintenancesCount, setActiveMaintenancesCount] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Modal States
  const [isNovaManutencaoOpen, setIsNovaManutencaoOpen] = useState<boolean>(false);
  const [selectedRadioIdForManutencao, setSelectedRadioIdForManutencao] = useState<number | null>(null);

  const [isRegistrarRetornoOpen, setIsRegistrarRetornoOpen] = useState<boolean>(false);
  const [selectedManutencaoForRetorno, setSelectedManutencaoForRetorno] = useState<Manutencao | null>(null);

  const [isRadioDetailOpen, setIsRadioDetailOpen] = useState<boolean>(false);
  const [selectedRadioIdForDetail, setSelectedRadioIdForDetail] = useState<number | null>(null);

  const [isNovoRadioOpen, setIsNovoRadioOpen] = useState<boolean>(false);
  const [radioToEdit, setRadioToEdit] = useState<Radio | null>(null);

  const [isNovoSetorOpen, setIsNovoSetorOpen] = useState<boolean>(false);
  const [setorToEdit, setSetorToEdit] = useState<Setor | null>(null);

  const [isNovoUsuarioOpen, setIsNovoUsuarioOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Load Sectors and active maintenance counter
  useEffect(() => {
    if (user) {
      loadGlobalData();
    }
  }, [user, refreshKey]);

  const loadGlobalData = async () => {
    try {
      const [setoresData, dashData] = await Promise.all([
        api.getSetores(),
        api.getDashboard()
      ]);
      setSetores(setoresData);
      setActiveMaintenancesCount(dashData.metrics.radios_em_manutencao);
    } catch (err) {
      console.error('Error loading global data:', err);
    }
  };

  const triggerGlobalRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handler Openers
  const handleOpenNovaManutencao = (radioId?: number) => {
    setSelectedRadioIdForManutencao(radioId || null);
    setIsNovaManutencaoOpen(true);
  };

  const handleOpenRegistrarRetorno = (manutencao: Manutencao) => {
    setSelectedManutencaoForRetorno(manutencao);
    setIsRegistrarRetornoOpen(true);
  };

  const handleOpenRadioDetail = (radioId: number) => {
    setSelectedRadioIdForDetail(radioId);
    setIsRadioDetailOpen(true);
  };

  const handleOpenNovoRadio = () => {
    setRadioToEdit(null);
    setIsNovoRadioOpen(true);
  };

  const handleOpenEditarRadio = (radio: Radio) => {
    setRadioToEdit(radio);
    setIsNovoRadioOpen(true);
  };

  const handleOpenNovoSetor = () => {
    setSetorToEdit(null);
    setIsNovoSetorOpen(true);
  };

  const handleOpenEditarSetor = (setor: Setor) => {
    setSetorToEdit(setor);
    setIsNovoSetorOpen(true);
  };

  const handleOpenNovoUsuario = () => {
    setUserToEdit(null);
    setIsNovoUsuarioOpen(true);
  };

  const handleOpenEditarUsuario = (u: User) => {
    setUserToEdit(u);
    setIsNovoUsuarioOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-300 font-semibold text-sm tracking-wide">
            Iniciando Sistema de Controle de Rádios...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F7F4EB] text-stone-900 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpenMobile(prev => !prev)}
        activeMaintenancesCount={activeMaintenancesCount}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          activeMaintenancesCount={activeMaintenancesCount}
        />

        {/* Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                key={refreshKey}
                onOpenNovaManutencao={() => handleOpenNovaManutencao()}
                onOpenRegistrarRetorno={handleOpenRegistrarRetorno}
                onOpenRadioDetail={handleOpenRadioDetail}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'radios' && (
              <RadiosView
                key={refreshKey}
                setores={setores}
                onOpenNovaManutencao={handleOpenNovaManutencao}
                onOpenRadioDetail={handleOpenRadioDetail}
                onOpenNovoRadio={handleOpenNovoRadio}
                onOpenEditarRadio={handleOpenEditarRadio}
              />
            )}

            {activeTab === 'manutencoes' && (
              <ManutencoesView
                key={refreshKey}
                setores={setores}
                onOpenNovaManutencao={() => handleOpenNovaManutencao()}
                onOpenRegistrarRetorno={handleOpenRegistrarRetorno}
                onOpenRadioDetail={handleOpenRadioDetail}
              />
            )}

            {activeTab === 'setores' && (
              <SetoresView
                key={refreshKey}
                setores={setores}
                onRefresh={triggerGlobalRefresh}
                onOpenNovoSetor={handleOpenNovoSetor}
                onOpenEditarSetor={handleOpenEditarSetor}
              />
            )}

            {activeTab === 'relatorios' && (
              <RelatoriosView
                key={refreshKey}
                setores={setores}
                onOpenRadioDetail={handleOpenRadioDetail}
              />
            )}

            {activeTab === 'usuarios' && (
              <UsuariosView
                key={refreshKey}
                onOpenNovoUsuario={handleOpenNovoUsuario}
                onOpenEditarUsuario={handleOpenEditarUsuario}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <NovaManutencaoModal
        isOpen={isNovaManutencaoOpen}
        onClose={() => {
          setIsNovaManutencaoOpen(false);
          setSelectedRadioIdForManutencao(null);
        }}
        onSuccess={() => {
          triggerGlobalRefresh();
        }}
        initialRadioId={selectedRadioIdForManutencao}
      />

      <RegistrarRetornoModal
        isOpen={isRegistrarRetornoOpen}
        onClose={() => {
          setIsRegistrarRetornoOpen(false);
          setSelectedManutencaoForRetorno(null);
        }}
        onSuccess={() => {
          triggerGlobalRefresh();
        }}
        manutencao={selectedManutencaoForRetorno}
      />

      <RadioDetailModal
        isOpen={isRadioDetailOpen}
        onClose={() => {
          setIsRadioDetailOpen(false);
          setSelectedRadioIdForDetail(null);
        }}
        radioId={selectedRadioIdForDetail}
        onRadioUpdated={triggerGlobalRefresh}
        onSendMaintenance={(id) => {
          handleOpenNovaManutencao(id);
        }}
        onDeleteRadio={async (id) => {
          try {
            await api.deleteRadio(id);
            triggerGlobalRefresh();
          } catch (err: any) {
            console.error('Erro ao excluir rádio:', err);
          }
        }}
      />

      <NovoRadioModal
        isOpen={isNovoRadioOpen}
        onClose={() => {
          setIsNovoRadioOpen(false);
          setRadioToEdit(null);
        }}
        onSuccess={() => {
          triggerGlobalRefresh();
        }}
        radioToEdit={radioToEdit}
        setores={setores}
      />

      <NovoSetorModal
        isOpen={isNovoSetorOpen}
        onClose={() => {
          setIsNovoSetorOpen(false);
          setSetorToEdit(null);
        }}
        onSuccess={() => {
          triggerGlobalRefresh();
        }}
        setorToEdit={setorToEdit}
      />

      <NovoUsuarioModal
        isOpen={isNovoUsuarioOpen}
        onClose={() => {
          setIsNovoUsuarioOpen(false);
          setUserToEdit(null);
        }}
        onSuccess={() => {
          triggerGlobalRefresh();
        }}
        userToEdit={userToEdit}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
