import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, Shield, UserCheck, KeyRound } from 'lucide-react';
import radioLogoImg from '../assets/images/radio_logo_icon_1786717154920.jpg';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@usr');
  const [password, setPassword] = useState<string>('admin123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, informe o usuário e a senha');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    try {
      setLoading(true);
      setError(null);
      await login(userEmail, userPass);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background visual accents safely contained */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md my-auto relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-amber-600/30 border border-amber-400/40 overflow-hidden bg-stone-900 mx-auto">
            <img 
              src={radioLogoImg} 
              alt="Logo Rádios Mendonça" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
              Controle de Rádios
            </h1>
            <p className="text-xs sm:text-sm font-medium text-stone-300 mt-0.5 sm:mt-1">
              Locação Mendonça • Motorola DP450
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="mt-4 sm:mt-6 bg-[#FAF7F0] py-5 px-5 sm:py-7 sm:px-8 shadow-2xl rounded-2xl sm:rounded-3xl border border-[#E5DEC9]">
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@usr"
                  className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-1 sm:mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#E5DEC9] space-y-2">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 text-center">
              Escolha em qual modo acessar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@usr', 'admin123')}
                className="flex items-center gap-2 p-2 sm:p-2.5 text-xs font-semibold text-stone-800 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-stone-200 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-1 rounded-md bg-amber-600 text-white shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">Administrador</div>
                  <div className="text-[10px] text-stone-500">Acesso Total</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operador@usr', 'user123')}
                className="flex items-center gap-2 p-2 sm:p-2.5 text-xs font-semibold text-stone-800 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-stone-200 rounded-xl transition-all text-left cursor-pointer"
              >
                <div className="p-1 rounded-md bg-stone-700 text-white shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">Usuário</div>
                  <div className="text-[10px] text-stone-500">Envios & Retornos</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-3 sm:mt-5 text-center text-[11px] sm:text-xs text-stone-400">
          Disponível para rede interna
        </div>
      </div>
    </div>
  );
};
