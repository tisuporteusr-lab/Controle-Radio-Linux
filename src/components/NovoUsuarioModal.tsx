import React, { useState, useEffect } from 'react';
import { User, UserProfile, UserStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, User as UserIcon, AlertTriangle } from 'lucide-react';

interface NovoUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: User | null;
}

export const NovoUsuarioModal: React.FC<NovoUsuarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit
}) => {
  const { user: currentUser, updateAuthUser } = useAuth();
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [perfil, setPerfil] = useState<UserProfile>('usuario');
  const [status, setStatus] = useState<UserStatus>('ativo');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (userToEdit) {
        setNome(userToEdit.nome);
        setEmail(userToEdit.email);
        setPassword('');
        setPerfil(userToEdit.perfil);
        setStatus(userToEdit.status);
      } else {
        setNome('');
        setEmail('');
        setPassword('');
        setPerfil('usuario');
        setStatus('ativo');
      }
    }
  }, [isOpen, userToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      setError('Nome e e-mail são obrigatórios');
      return;
    }
    if (!userToEdit && !password) {
      setError('A senha é obrigatória para novos usuários');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        perfil,
        status,
      };

      if (password && password.trim()) {
        payload.password = password.trim();
      }

      if (userToEdit) {
        const res = await api.updateUser(userToEdit.id, payload);
        if (currentUser && currentUser.id === userToEdit.id) {
          const updatedUser: User = {
            ...currentUser,
            nome: payload.nome,
            email: payload.email,
            perfil: payload.perfil,
            status: payload.status,
          };
          updateAuthUser(res.user || updatedUser, res.token);
        }
      } else {
        await api.createUser(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {userToEdit ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
              </h2>
              <p className="text-xs text-stone-300">Controle de acesso e permissões</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Nome Completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Mendonça"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Usuário / Login *
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@usr"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              {userToEdit ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha de Acesso *'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={userToEdit ? '••••••••' : 'Mínimo 6 caracteres'}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required={!userToEdit}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Perfil de Acesso *
            </label>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as UserProfile)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="usuario">Operador / Usuário (Visualizar, enviar e registrar retorno de rádios)</option>
              <option value="admin">Administrador (Acesso total, cadastros e gestão de usuários)</option>
            </select>
          </div>

          {userToEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Status da Conta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ativo">Ativo (Acesso liberado)</option>
                <option value="inativo">Inativo (Acesso bloqueado)</option>
              </select>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : userToEdit ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
