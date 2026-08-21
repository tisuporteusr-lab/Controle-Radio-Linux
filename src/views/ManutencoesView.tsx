import React, { useState, useEffect } from 'react';
import { Manutencao, Setor } from '../types';
import { api, formatDate } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DaysBadge } from '../components/DaysBadge';
import { 
  Wrench, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Eye,
  History
} from 'lucide-react';

interface ManutencoesViewProps {
  setores: Setor[];
  onOpenNovaManutencao: () => void;
  onOpenRegistrarRetorno: (manutencao: Manutencao) => void;
  onOpenRadioDetail: (radioId: number) => void;
}

export const ManutencoesView: React.FC<ManutencoesViewProps> = ({
  setores,
  onOpenNovaManutencao,
  onOpenRegistrarRetorno,
  onOpenRadioDetail,
}) => {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [quickStatus, setQuickStatus] = useState<'todos' | 'em_manutencao' | 'concluida'>('todos');
  const [search, setSearch] = useState<string>('');
  const [setorFilter, setSetorFilter] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  const loadManutencoes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getManutencoes({
        status: quickStatus !== 'todos' ? quickStatus : undefined,
        setor_id: setorFilter !== 'todos' ? setorFilter : undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        search: search.trim() || undefined,
      });
      setManutencoes(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar manutenções');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManutencoes();
  }, [quickStatus, setorFilter, dataInicio, dataFim]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadManutencoes();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-amber-600" />
            <span>Controle de Manutenção de Rádios</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registro de envios, cálculo de permanência e encerramento de chamados
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadManutencoes}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenNovaManutencao}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Manutenção</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Quick Status Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickStatus('todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                quickStatus === 'todos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({manutencoes.length})
            </button>
            <button
              onClick={() => setQuickStatus('em_manutencao')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                quickStatus === 'em_manutencao'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>Em Manutenção</span>
            </button>
            <button
              onClick={() => setQuickStatus('concluida')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                quickStatus === 'concluida'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Concluídas</span>
            </button>
          </div>
        </div>

        {/* Search input and advanced date filters */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar RA, Série, Defeito..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Sector filter */}
          <div>
            <select
              value={setorFilter}
              onChange={(e) => setSetorFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            >
              <option value="todos">Todos os Setores</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium whitespace-nowrap">Ida de:</span>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Date to */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium whitespace-nowrap">até:</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Main Content Table & Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Carregando registros de manutenção...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : manutencoes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-800">Nenhum registro de manutenção encontrado</p>
          <p className="text-xs text-slate-400">Verifique os filtros aplicados ou cadastre uma nova manutenção.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Rádio (RA)</th>
                    <th className="py-3.5 px-4">Nº Série / Modelo</th>
                    <th className="py-3.5 px-4">Setor</th>
                    <th className="py-3.5 px-4">Defeito Apresentado</th>
                    <th className="py-3.5 px-4">Data Ida</th>
                    <th className="py-3.5 px-4">Data Volta</th>
                    <th className="py-3.5 px-4">Permanência</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-left">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {manutencoes.map((m) => (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        m.status === 'em_manutencao' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onOpenRadioDetail(m.radio_id)}
                          className="font-black text-slate-900 hover:text-sky-600 transition-colors"
                        >
                          {m.identificador_ra}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-slate-800 block">{m.numero_serie}</span>
                        <span className="text-slate-400 block">{m.modelo}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {m.setor_nome || 'Sem setor'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-800 font-medium max-w-xs">
                        {m.defeito}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {formatDate(m.data_ida)}
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {m.data_volta ? (
                          <span className="font-semibold text-slate-900">{formatDate(m.data_volta)}</span>
                        ) : (
                          <span className="text-amber-600 font-bold italic">Em reparo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <DaysBadge 
                          days={m.dias_em_manutencao} 
                          isOngoing={m.status === 'em_manutencao'} 
                          prefix={true}
                        />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={m.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {m.status === 'em_manutencao' ? (
                          <button
                            onClick={() => onOpenRegistrarRetorno(m)}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg shadow-xs transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Retorno</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenRadioDetail(m.radio_id)}
                            title="Ver histórico do rádio"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE / TABLET CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {manutencoes.map((m) => (
              <div 
                key={m.id} 
                className={`bg-white p-4 rounded-2xl border shadow-xs space-y-3 ${
                  m.status === 'em_manutencao' ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <button
                      onClick={() => onOpenRadioDetail(m.radio_id)}
                      className="text-base font-black text-slate-900 hover:text-sky-600 text-left"
                    >
                      {m.identificador_ra} — {m.modelo}
                    </button>
                    <p className="text-xs text-slate-500">
                      Setor: <strong>{m.setor_nome || 'Sem setor'}</strong>
                    </p>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div>
                    <span className="text-slate-500 block">Defeito apresentado:</span>
                    <span className="font-semibold text-slate-800">{m.defeito}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Ida: </span>
                      <span className="font-bold text-slate-800">{formatDate(m.data_ida)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Volta: </span>
                      <span className="font-bold text-slate-800">
                        {m.data_volta ? formatDate(m.data_volta) : 'Em aberto'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <DaysBadge days={m.dias_em_manutencao} isOngoing={m.status === 'em_manutencao'} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onOpenRadioDetail(m.radio_id)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Ver Rádio</span>
                  </button>

                  {m.status === 'em_manutencao' && (
                    <button
                      onClick={() => onOpenRegistrarRetorno(m)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-1 h-2.5" />
                      <span>Registrar Retorno</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
