import React, { useState, useEffect } from 'react';
import { DashboardData, Manutencao } from '../types';
import { api, formatDate } from '../services/api';
import { DaysBadge } from '../components/DaysBadge';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Radio, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  Building2, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  History,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNovaManutencao: () => void;
  onOpenRegistrarRetorno: (manutencao: Manutencao) => void;
  onOpenRadioDetail: (radioId: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNovaManutencao,
  onOpenRegistrarRetorno,
  onOpenRadioDetail,
  onNavigateTab,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 space-y-3">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium">Carregando indicadores operacionais...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <span>{error || 'Não foi possível carregar os dados'}</span>
        </div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-rose-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const { metrics, active_maintenances, sector_distribution, recent_activity } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total de Rádios */}
        <div 
          onClick={() => onNavigateTab('radios')}
          className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium mb-2">
            <span>Total Rádios</span>
            <div className="p-1.5 rounded-lg bg-stone-200/70 group-hover:bg-amber-100 text-stone-700">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{metrics.total_radios}</p>
          <span className="text-[11px] text-stone-500 mt-0.5 block">cadastrados ativos</span>
        </div>

        {/* Em Uso */}
        <div 
          onClick={() => onNavigateTab('radios')}
          className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-700 text-xs font-semibold mb-2">
            <span>Rádios em Uso</span>
            <div className="p-1.5 rounded-lg bg-stone-200/70 group-hover:bg-amber-100 text-stone-800">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{metrics.radios_em_uso}</p>
          <span className="text-[11px] text-stone-500 mt-0.5 block">operando nos setores</span>
        </div>

        {/* Em Manutenção */}
        <div 
          onClick={() => onNavigateTab('manutencoes')}
          className="bg-[#FAF7F0] p-4 rounded-2xl border border-amber-300 shadow-xs hover:shadow-md hover:border-amber-400 bg-amber-50/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-2">
            <span>Em Manutenção</span>
            <div className="p-1.5 rounded-lg bg-amber-100 group-hover:bg-amber-200 text-amber-900">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">{metrics.radios_em_manutencao}</p>
          <span className="text-[11px] text-amber-800 font-medium mt-0.5 block">no conserto (Mendonça)</span>
        </div>

        {/* Disponíveis */}
        <div 
          onClick={() => onNavigateTab('radios')}
          className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-2">
            <span>Disponíveis</span>
            <div className="p-1.5 rounded-lg bg-emerald-100/70 group-hover:bg-emerald-200 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">{metrics.radios_disponiveis}</p>
          <span className="text-[11px] text-emerald-700/90 mt-0.5 block">estoque / reserva</span>
        </div>

        {/* Total de Manutenções */}
        <div 
          onClick={() => onNavigateTab('relatorios')}
          className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-600 text-xs font-semibold mb-2">
            <span>Histórico Total</span>
            <div className="p-1.5 rounded-lg bg-stone-200/70 group-hover:bg-amber-100 text-stone-700">
              <History className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{metrics.total_manutencoes}</p>
          <span className="text-[11px] text-stone-500 mt-0.5 block">envios registrados</span>
        </div>

        {/* Em Andamento */}
        <div 
          onClick={() => onNavigateTab('manutencoes')}
          className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E5DEC9] shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-stone-600 text-xs font-semibold mb-2">
            <span>Em Aberto</span>
            <div className="p-1.5 rounded-lg bg-stone-200/70 group-hover:bg-amber-100 text-stone-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{metrics.manutencoes_em_andamento}</p>
          <span className="text-[11px] text-stone-500 mt-0.5 block">aguardando retorno</span>
        </div>
      </div>

      {/* RÁDIOS ATUALMENTE EM MANUTENÇÃO */}
      <div className="bg-[#FAF7F0] rounded-3xl border border-[#E5DEC9] shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E5DEC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-800 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Rádios Atualmente em Manutenção
              </h2>
              <p className="text-xs text-stone-500">
                Equipamentos que estão no fornecedor Mendonça com contador automático de dias
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-200/70 text-amber-900 self-start sm:self-auto border border-amber-300">
            {active_maintenances.length} {active_maintenances.length === 1 ? 'rádio em reparo' : 'rádios em reparo'}
          </span>
        </div>

        {active_maintenances.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
            <p className="text-base font-bold text-stone-800">Nenhum rádio em manutenção no momento</p>
            <p className="text-xs text-stone-400">Todos os rádios comunicadores estão operacionais ou disponíveis no estoque.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5DEC9]">
            {active_maintenances.map((m) => (
              <div 
                key={m.id} 
                className="p-5 sm:p-6 hover:bg-amber-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onOpenRadioDetail(m.radio_id)}
                      className="text-base font-black text-stone-900 hover:text-amber-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>{m.identificador_ra}</span>
                      <span className="text-stone-500 font-normal text-sm">— {m.modelo}</span>
                    </button>
                    <DaysBadge days={m.dias_em_manutencao} isOngoing={true} />
                    <span className="text-xs text-stone-600 font-medium px-2 py-0.5 rounded-md bg-stone-200/70">
                      Setor: {m.setor_nome || 'Não informado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-stone-600">
                    <div>
                      <span className="text-stone-400 font-medium">Defeito: </span>
                      <span className="font-semibold text-stone-800">{m.defeito}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 font-medium">Nº Série: </span>
                      <span className="font-medium text-stone-700">{m.numero_serie}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 font-medium">Enviado em: </span>
                      <span className="font-semibold text-stone-800">{formatDate(m.data_ida)}</span>
                    </div>
                  </div>

                  {m.observacoes && (
                    <p className="text-xs text-stone-600 italic bg-stone-100 p-2 rounded-lg border border-stone-200">
                      "{m.observacoes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                  <button
                    onClick={() => onOpenRadioDetail(m.radio_id)}
                    className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors"
                  >
                    Ver Histórico
                  </button>
                  <button
                    onClick={() => onOpenRegistrarRetorno(m)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registrar Retorno</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid: Sector Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setores Distribution */}
        <div className="bg-[#FAF7F0] rounded-3xl border border-[#E5DEC9] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Rádios por Setor</h3>
            </div>
            <button
              onClick={() => onNavigateTab('setores')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Gerenciar</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {sector_distribution.map((sec, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800">{sec.setor_nome}</span>
                  <div className="space-x-2">
                    <span className="font-bold text-stone-900">{sec.total_radios} rádios</span>
                    {sec.em_manutencao > 0 && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                        {sec.em_manutencao} em conserto
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-amber-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (sec.total_radios / (metrics.total_radios || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Maintenance Activity */}
        <div className="bg-[#FAF7F0] rounded-3xl border border-[#E5DEC9] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-stone-200/70 text-stone-700 rounded-xl">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Últimas Movimentações</h3>
            </div>
            <button
              onClick={() => onNavigateTab('manutencoes')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Ver Todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recent_activity.map((act) => (
              <div key={act.id} className="p-3 bg-white rounded-2xl border border-[#E5DEC9] flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{act.identificador_ra}</span>
                    <span className="text-stone-500 font-medium">({act.setor_nome || 'Sem setor'})</span>
                  </div>
                  <p className="text-stone-600 truncate max-w-xs">{act.defeito}</p>
                  <p className="text-[11px] text-stone-400">
                    Ida: {formatDate(act.data_ida)} {act.data_volta ? `• Retorno: ${formatDate(act.data_volta)} (${act.dias} dias)` : ''}
                  </p>
                </div>
                <StatusBadge status={act.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
