import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api, formatDate } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Shield, 
  UserCheck, 
  AlertCircle, 
  RefreshCw,
  Mail,
  Trash2,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface UsuariosViewProps {
  onOpenNovoUsuario: () => void;
  onOpenEditarUsuario: (user: User) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  onOpenNovoUsuario,
  onOpenEditarUsuario,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.deleteUser(userToDelete.id);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir usuário');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-amber-700" />
              <span>Gestão de Usuários e Permissões</span>
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-0.5">
            Controle de acessos, perfis operacionais e credenciais do sistema
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            className="p-2.5 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors shadow-2xs"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenNovoUsuario}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Usuário</span>
          </button>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="py-20 text-center text-stone-500 space-y-2">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Carregando lista de usuários...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadUsers}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-lg text-xs"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <div 
                key={u.id}
                className={`bg-white p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isSelf ? 'border-amber-300 ring-1 ring-amber-200/60' : 'border-stone-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-2xl shrink-0 ${
                        u.perfil === 'admin' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {u.perfil === 'admin' ? <Shield className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-stone-900 leading-tight truncate">{u.nome}</h3>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-black text-[10px] rounded uppercase">
                              Você
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          u.perfil === 'admin' ? 'text-amber-700' : 'text-stone-500'
                        }`}>
                          {u.perfil === 'admin' ? 'Administrador' : 'Operador / Usuário'}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={u.status} size="sm" />
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/60 space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate font-medium text-stone-800">{u.email}</span>
                    </div>
                    {u.created_at && (
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Cadastrado em {formatDate(u.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-stone-400">
                    ID #{u.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isSelf && (
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setUserToDelete(u);
                        }}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onOpenEditarUsuario(u)}
                      className="px-3.5 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Excluir Usuário {userToDelete.nome}?
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Esta ação removerá permanentemente o acesso do usuário <strong>{userToDelete.email}</strong> ao sistema.
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Sim, Excluir Usuário'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

