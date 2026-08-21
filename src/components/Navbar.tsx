import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Menu } from 'lucide-react';
import radioLogoImg from '../assets/images/radio_logo_icon_1786717154920.jpg';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeMaintenancesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeMaintenancesCount,
}) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-stone-900 border-b border-stone-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 focus:outline-none"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md shadow-amber-500/20 border border-amber-500/40 bg-stone-950 shrink-0">
                <img 
                  src={radioLogoImg} 
                  alt="Logo Rádios Mendonça" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-white">
                    RÁDIOS<span className="text-amber-400 font-semibold text-xs uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">Mendonça</span>
                  </h1>
                </div>
                <p className="text-[11px] text-stone-400 font-medium hidden sm:block">
                  Controle de Inventário e Manutenção
                </p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Active alerts count badge */}
            {activeMaintenancesCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{activeMaintenancesCount} em reparo</span>
              </div>
            )}

            {/* User profile & logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-stone-200 leading-tight">{user?.nome}</p>
                <p className="text-[10px] text-stone-400 capitalize flex items-center justify-end gap-1">
                  {isAdmin ? (
                    <>
                      <Shield className="w-2.5 h-2.5 text-amber-400" />
                      <span className="text-amber-400 font-semibold">Administrador</span>
                    </>
                  ) : (
                    <span>Operador</span>
                  )}
                </p>
              </div>

              <div className="w-8 h-8 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-300 font-bold text-xs">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>

              <button
                onClick={logout}
                title="Sair do sistema"
                className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-800/80 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
