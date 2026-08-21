import React, { useState, useEffect } from 'react';
import { Radio, Setor, RadioStatus } from '../types';
import { api, formatDate } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DaysBadge } from '../components/DaysBadge';
import { useAuth } from '../context/AuthContext';
import { 
  Radio as RadioIcon, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Wrench, 
  History, 
  Building2, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  FileText
} from 'lucide-react';

interface RadiosViewProps {
  setores: Setor[];
  onOpenNovaManutencao: (radioId?: number) => void;
  onOpenRadioDetail: (radioId: number) => void;
  onOpenNovoRadio: () => void;
  onOpenEditarRadio: (radio: Radio) => void;
}

export const RadiosView: React.FC<RadiosViewProps> = ({
  setores,
  onOpenNovaManutencao,
  onOpenRadioDetail,
  onOpenNovoRadio,
  onOpenEditarRadio,
}) => {
  const { isAdmin } = useAuth();
  const [radios, setRadios] = useState<Radio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [setorFilter, setSetorFilter] = useState<string>('todos');

  // Delete modal state
  const [radioToDelete, setRadioToDelete] = useState<Radio | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Clear all radios state
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [clearingAll, setClearingAll] = useState<boolean>(false);
  const [clearAllError, setClearAllError] = useState<string | null>(null);

  const loadRadios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRadios({
        search: search.trim() || undefined,
        status: statusFilter !== 'todos' ? statusFilter : undefined,
        setor_id: setorFilter !== 'todos' ? setorFilter : undefined,
      });
      setRadios(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lista de rádios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadios();
  }, [statusFilter, setorFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRadios();
  };

  const handleDeleteConfirm = async () => {
    if (!radioToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.deleteRadio(radioToDelete.id);
      setRadioToDelete(null);
      loadRadios();
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir o rádio');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAllConfirm = async () => {
    try {
      setClearingAll(true);
      setClearAllError(null);
      await api.deleteAllRadios();
      setShowClearAllModal(false);
      loadRadios();
    } catch (err: any) {
      setClearAllError(err.message || 'Erro ao limpar todos os rádios');
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <RadioIcon className="w-7 h-7 text-amber-700" />
            <span>Inventário de Rádios Comunicadores</span>
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Controle de equipamentos Motorola DP450 • Locação Fornecedor Mendonça
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRadios}
            className="p-2.5 bg-[#FAF7F0] border border-[#E5DEC9] text-stone-600 hover:text-stone-900 rounded-xl transition-colors shadow-xs"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isAdmin && (
            <>
              {radios.length > 0 && (
                <button
                  onClick={() => setShowClearAllModal(true)}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                  title="Excluir todos os rádios cadastrados de uma vez"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Limpar Todos os Rádios</span>
                  <span className="sm:hidden">Limpar</span>
                </button>
              )}

              <button
                onClick={onOpenNovoRadio}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Rádio</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por RA (ex: RA-025), nº de série, modelo ou setor..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Quick Search Button */}
          <button
            type="submit"
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold uppercase transition-colors"
          >
            Pesquisar
          </button>
        </form>

        {/* Quick Filter Selects */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E5DEC9] text-xs">
          <span className="text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E5DEC9] rounded-lg text-stone-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="em_uso">Em uso</option>
            <option value="em_manutencao">Em manutenção</option>
            <option value="disponivel">Disponível</option>
            <option value="inativo">Inativo</option>
          </select>

          {/* Setor Filter */}
          <select
            value={setorFilter}
            onChange={(e) => setSetorFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E5DEC9] rounded-lg text-stone-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="todos">Todos os Setores</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'todos' || setorFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('todos');
                setSetorFilter('todos');
              }}
              className="text-amber-700 hover:text-amber-800 font-semibold underline ml-auto"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 space-y-2">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Carregando inventário de rádios...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : radios.length === 0 ? (
        <div className="bg-[#FAF7F0] p-12 rounded-2xl border border-[#E5DEC9] text-center text-stone-500 space-y-2">
          <RadioIcon className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-base font-bold text-stone-800">Nenhum rádio encontrado</p>
          <p className="text-xs text-stone-400">Tente ajustar seus filtros de pesquisa ou cadastre um novo rádio.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-[#FAF7F0] rounded-3xl border border-[#E5DEC9] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#EFE9D9] text-stone-700 font-bold uppercase text-xs border-b border-[#E5DEC9]">
                  <tr>
                    <th className="py-3.5 px-4">Identificador RA</th>
                    <th className="py-3.5 px-4">Número de Série</th>
                    <th className="py-3.5 px-4">Modelo / Fornecedor</th>
                    <th className="py-3.5 px-4">Setor de Uso</th>
                    <th className="py-3.5 px-4">Termo (PDF)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Última Manutenção</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9] bg-[#FAF7F0]">
                  {radios.map((r) => (
                    <tr key={r.id} className="hover:bg-amber-50/50 transition-colors">
                      {/* RA */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onOpenRadioDetail(r.id)}
                          className="font-black text-stone-900 hover:text-amber-700 transition-colors flex items-center gap-1.5"
                        >
                          <span>{r.identificador_ra}</span>
                        </button>
                      </td>

                      {/* Número de Série */}
                      <td className="py-3.5 px-4 font-medium text-stone-700">
                        {r.numero_serie}
                      </td>

                      {/* Modelo & Fornecedor */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800 block">{r.modelo}</span>
                        <span className="text-[11px] text-stone-400 block">{r.fornecedor}</span>
                      </td>

                      {/* Setor */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-stone-200/70 px-2.5 py-1 rounded-lg">
                          <Building2 className="w-3 h-3 text-stone-500" />
                          <span>{r.setor_nome || 'Sem setor'}</span>
                        </span>
                      </td>

                      {/* Termo Assinado PDF */}
                      <td className="py-3.5 px-4">
                        {r.termo_pdf_nome ? (
                          <a
                            href={api.getTermoPdfUrl(r.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                            title={`Visualizar termo: ${r.termo_pdf_nome}`}
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-700" />
                            <span>PDF Anexado</span>
                          </a>
                        ) : (
                          <span className="text-xs text-stone-400 italic">Pendente</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={r.status} size="sm" />
                          {r.status === 'em_manutencao' && r.dias_em_manutencao_atual !== null && (
                            <div className="block">
                              <DaysBadge days={r.dias_em_manutencao_atual} isOngoing={true} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Última Manutenção */}
                      <td className="py-3.5 px-4 text-xs text-stone-600">
                        {r.ultima_manutencao_data ? (
                          <div>
                            <span className="font-semibold text-stone-800 block">{formatDate(r.ultima_manutencao_data)}</span>
                            <span className="text-[11px] text-stone-400 block">{r.total_manutencoes} manutenções</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Sem registros</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Visualizar / Histórico */}
                          <button
                            onClick={() => onOpenRadioDetail(r.id)}
                            title="Ver Histórico Completo e Termo"
                            className="p-1.5 text-stone-600 hover:text-amber-700 hover:bg-amber-100/60 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Enviar para Manutenção */}
                          {r.status !== 'em_manutencao' && r.status !== 'inativo' && (
                            <button
                              onClick={() => onOpenNovaManutencao(r.id)}
                              title="Enviar para Manutenção"
                              className="p-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          )}

                          {/* Editar (Admin only) */}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onOpenEditarRadio(r)}
                                title="Editar Dados do Rádio / Termo"
                                className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-100/60 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRadioToDelete(r)}
                                title="Excluir Rádio"
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {radios.map((r) => (
              <div 
                key={r.id} 
                className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs space-y-3 relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      {r.identificador_ra}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">
                      {r.modelo} • {r.fornecedor}
                    </p>
                  </div>
                  <StatusBadge status={r.status} size="sm" />
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#E5DEC9] text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Nº de Série:</span>
                    <span className="font-semibold text-stone-800">{r.numero_serie}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Setor de Uso:</span>
                    <span className="font-semibold text-stone-800">{r.setor_nome || 'Sem setor'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500">Termo de Uso:</span>
                    {r.termo_pdf_nome ? (
                      <a
                        href={api.getTermoPdfUrl(r.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                      >
                        <FileText className="w-3 h-3 text-emerald-700" />
                        <span>PDF Anexo</span>
                      </a>
                    ) : (
                      <span className="text-stone-400 italic">Pendente</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Manutenções:</span>
                    <span className="font-semibold text-stone-800">{r.total_manutencoes || 0}</span>
                  </div>
                  {r.status === 'em_manutencao' && r.dias_em_manutencao_atual !== null && (
                    <div className="pt-1.5 border-t border-[#E5DEC9]">
                      <DaysBadge days={r.dias_em_manutencao_atual} isOngoing={true} />
                    </div>
                  )}
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenRadioDetail(r.id)}
                    className="flex-1 py-2.5 bg-stone-200/70 hover:bg-stone-300 text-stone-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5 text-stone-600" />
                    <span>Ficha</span>
                  </button>

                  {r.status !== 'em_manutencao' && r.status !== 'inativo' && (
                    <button
                      onClick={() => onOpenNovaManutencao(r.id)}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  )}

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onOpenEditarRadio(r)}
                        className="p-2.5 bg-stone-200/70 hover:bg-stone-300 text-stone-700 rounded-xl"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRadioToDelete(r)}
                        className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl"
                        title="Excluir Rádio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal de Confirmação de Exclusão do Rádio */}
      {radioToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF7F0] rounded-3xl shadow-2xl border border-[#E5DEC9] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Excluir Rádio {radioToDelete.identificador_ra}?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Esta ação é irreversível. O rádio e todo o seu histórico de manutenções associado serão removidos permanentemente.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5DEC9] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Identificador RA:</span>
                  <span className="font-bold text-stone-900">{radioToDelete.identificador_ra}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Nº de Série:</span>
                  <span className="font-semibold text-stone-800">{radioToDelete.numero_serie}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Setor:</span>
                  <span className="font-semibold text-stone-800">{radioToDelete.setor_nome || 'Sem setor'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Manutenções Registradas:</span>
                  <span className="font-semibold text-stone-800">{radioToDelete.total_manutencoes || 0}</span>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => {
                    setRadioToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Sim, Excluir Rádio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Limpar Todos os Rádios */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF7F0] rounded-3xl shadow-2xl border border-[#E5DEC9] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Excluir Todos os Rádios e Manutenções?
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Isso irá zerar a lista de rádios (incluindo os rádios de exemplo e todo o histórico de manutenções). A lista ficará totalmente vazia para você cadastrar apenas os seus rádios reais.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Os rádios excluídos não voltarão ao reiniciar o sistema. A base de dados permanecerá limpa e salva no disco.
                </span>
              </div>

              {clearAllError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{clearAllError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => {
                    setShowClearAllModal(false);
                    setClearAllError(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearAllConfirm}
                  disabled={clearingAll}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {clearingAll ? 'Limpando...' : 'Sim, Limpar Tudo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
