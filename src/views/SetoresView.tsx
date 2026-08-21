import React, { useState } from 'react';
import { Setor } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Building2, 
  Plus, 
  Edit, 
  Radio, 
  Wrench, 
  AlertCircle, 
  RefreshCw,
  Trash2,
  Search,
  AlertTriangle
} from 'lucide-react';

interface SetoresViewProps {
  setores: Setor[];
  onRefresh: () => void;
  onOpenNovoSetor: () => void;
  onOpenEditarSetor: (setor: Setor) => void;
}

export const SetoresView: React.FC<SetoresViewProps> = ({
  setores,
  onRefresh,
  onOpenNovoSetor,
  onOpenEditarSetor,
}) => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [setorToDelete, setSetorToDelete] = useState<Setor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const filteredSetores = setores.filter(s => 
    s.nome.toLowerCase().includes(search.toLowerCase()) || 
    (s.descricao && s.descricao.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDeleteConfirm = async () => {
    if (!setorToDelete) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      const res = await api.deleteSetor(setorToDelete.id);
      setFeedbackMessage(res.message || 'Setor excluído com sucesso');
      setSetorToDelete(null);
      onRefresh();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir setor');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-700" />
            <span>Setores e Locais de Operação</span>
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Gerenciamento de áreas da empresa onde os rádios comunicadores operam
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-[#FAF7F0] border border-[#E5DEC9] text-stone-600 hover:text-stone-900 rounded-xl transition-colors shadow-xs"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <button
              onClick={onOpenNovoSetor}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Setor</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Feedback Alert */}
      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200 shadow-xs">
          <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar setor por nome ou descrição..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5DEC9] rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-2 py-1"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredSetores.length === 0 ? (
        <div className="bg-[#FAF7F0] p-12 rounded-3xl border border-[#E5DEC9] text-center text-stone-500 space-y-2">
          <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-base font-bold text-stone-800">Nenhum setor encontrado</p>
          <p className="text-xs text-stone-400">
            {search ? 'Tente ajustar o termo pesquisado.' : 'Clique em "Cadastrar Novo Setor" para adicionar o primeiro.'}
          </p>
        </div>
      ) : (
        /* Grid of Sector Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSetores.map((s) => (
            <div 
              key={s.id} 
              className="bg-[#FAF7F0] p-5 rounded-3xl border border-[#E5DEC9] shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900 leading-tight">{s.nome}</h3>
                    </div>
                  </div>
                  <StatusBadge status={s.status} size="sm" />
                </div>

                {s.descricao ? (
                  <p className="text-xs text-stone-600 line-clamp-2 bg-white/70 p-2.5 rounded-xl border border-[#E5DEC9]">
                    {s.descricao}
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 italic">Sem descrição informada</p>
                )}
              </div>

              {/* Metrics pills & Action Buttons */}
              <div className="space-y-3 pt-3 border-t border-[#E5DEC9]">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E5DEC9]">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Rádios Ativos</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Radio className="w-3.5 h-3.5 text-stone-700" />
                      <span className="font-black text-stone-900 text-sm">{s.total_radios_ativos || 0}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                    <span className="text-amber-800 block text-[10px] uppercase font-bold">Em Manutenção</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-700" />
                      <span className="font-black text-amber-950 text-sm">{s.radios_em_manutencao || 0}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEditarSetor(s)}
                      className="flex-1 py-2 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-[#E5DEC9]"
                    >
                      <Edit className="w-3.5 h-3.5 text-stone-500" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setSetorToDelete(s);
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors border border-rose-200"
                      title="Excluir Setor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Setor */}
      {setorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF7F0] rounded-3xl shadow-2xl border border-[#E5DEC9] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Excluir Setor "{setorToDelete.nome}"?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tem certeza de que deseja remover este setor? Os rádios associados a ele não serão excluídos, apenas ficarão marcados como "Sem setor".
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5DEC9] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nome do Setor:</span>
                  <span className="font-bold text-stone-900">{setorToDelete.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Rádios Vinculados:</span>
                  <span className="font-semibold text-stone-800">{setorToDelete.total_radios_ativos || 0} rádio(s)</span>
                </div>
                {setorToDelete.radios_em_manutencao ? (
                  <div className="flex justify-between text-amber-700">
                    <span>Em Manutenção:</span>
                    <span className="font-semibold">{setorToDelete.radios_em_manutencao} rádio(s)</span>
                  </div>
                ) : null}
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => {
                    setSetorToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar Exclusão</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
