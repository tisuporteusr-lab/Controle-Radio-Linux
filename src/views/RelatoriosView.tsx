import React, { useState, useEffect } from 'react';
import { RelatorioData, Setor } from '../types';
import { api, formatDate, formatToday, exportToCSV, exportRelatorioToPDF } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DaysBadge } from '../components/DaysBadge';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  Building2,
  Radio,
  RefreshCw
} from 'lucide-react';

interface RelatoriosViewProps {
  setores: Setor[];
  onOpenRadioDetail: (radioId: number) => void;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  setores,
  onOpenRadioDetail,
}) => {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [setorId, setSetorId] = useState<string>('todos');
  const [modelo, setModelo] = useState<string>('todos');

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRelatorios({
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        setor_id: setorId !== 'todos' ? setorId : undefined,
        modelo: modelo !== 'todos' ? modelo : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelatorios();
  }, [dataInicio, dataFim, setorId, modelo]);

  // Fast period presets
  const handlePresetPeriod = (type: 'thisMonth' | 'last90' | 'thisYear' | 'all') => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');

    if (type === 'thisMonth') {
      setDataInicio(`${y}-${m}-01`);
      setDataFim(`${y}-${m}-${d}`);
    } else if (type === 'last90') {
      const past = new Date();
      past.setDate(past.getDate() - 90);
      const py = past.getFullYear();
      const pm = String(past.getMonth() + 1).padStart(2, '0');
      const pd = String(past.getDate()).padStart(2, '0');
      setDataInicio(`${py}-${pm}-${pd}`);
      setDataFim(`${y}-${m}-${d}`);
    } else if (type === 'thisYear') {
      setDataInicio(`${y}-01-01`);
      setDataFim(`${y}-${m}-${d}`);
    } else {
      setDataInicio('');
      setDataFim('');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!data || !data.records.length) return;

    const rows = data.records.map(r => ({
      ra: r.identificador_ra,
      serie: r.numero_serie,
      modelo: r.modelo,
      fornecedor: r.fornecedor || 'Mendonça',
      setor: r.setor_nome || 'Não definido',
      defeito: r.defeito,
      servico_realizado: r.servico_realizado || '',
      data_ida: formatDate(r.data_ida),
      data_volta: r.data_volta ? formatDate(r.data_volta) : 'Em aberto',
      dias: r.dias_em_manutencao,
      status: r.status === 'concluida' ? 'Concluída' : 'Em Manutenção'
    }));

    const headers = [
      { key: 'ra', label: 'Identificador RA' },
      { key: 'serie', label: 'Número de Série' },
      { key: 'modelo', label: 'Modelo' },
      { key: 'fornecedor', label: 'Fornecedor' },
      { key: 'setor', label: 'Setor de Origem' },
      { key: 'defeito', label: 'Defeito Reportado' },
      { key: 'servico_realizado', label: 'Serviço Realizado' },
      { key: 'data_ida', label: 'Data de Envio' },
      { key: 'data_volta', label: 'Data de Retorno' },
      { key: 'dias', label: 'Dias em Reparo' },
      { key: 'status', label: 'Status' },
    ];

    exportToCSV(`relatorio-manutencoes-radios-${formatToday()}`, rows, headers);
  };

  // PDF Export
  const handleExportPDF = () => {
    if (!data) return;
    const filterParts: string[] = [];
    if (dataInicio || dataFim) {
      filterParts.push(`Período: ${dataInicio ? formatDate(dataInicio) : 'início'} até ${dataFim ? formatDate(dataFim) : 'hoje'}`);
    } else {
      filterParts.push('Todo o Histórico');
    }
    if (setorId !== 'todos') {
      const s = setores.find(sec => String(sec.id) === String(setorId));
      if (s) filterParts.push(`Setor: ${s.nome}`);
    }
    if (modelo !== 'todos') {
      filterParts.push(`Modelo: ${modelo}`);
    }

    exportRelatorioToPDF(data, filterParts.join(' | '));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-sky-600" />
            <span>Relatórios & Análise Operacional</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Métricas de confiabilidade, tempo médio de reparo e exportação de dados
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={!data || data.records.length === 0}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!data || data.records.length === 0}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-slate-400 uppercase tracking-wider mr-1">Atalhos de Período:</span>
          <button
            onClick={() => handlePresetPeriod('thisMonth')}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Este Mês
          </button>
          <button
            onClick={() => handlePresetPeriod('last90')}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Últimos 90 Dias
          </button>
          <button
            onClick={() => handlePresetPeriod('thisYear')}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Este Ano
          </button>
          <button
            onClick={() => handlePresetPeriod('all')}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Todo o Histórico
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Data Inicial (Ida)</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Data Final (Ida)</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Filtrar por Setor</label>
            <select
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="todos">Todos os Setores</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold uppercase text-[10px] mb-1">Filtrar por Modelo</label>
            <select
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="todos">Todos os Modelos</option>
              <option value="Motorola DP450">Motorola DP450</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-2">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Processando estatísticas e relatórios...</p>
        </div>
      ) : error || !data ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error || 'Erro ao carregar dados'}</span>
        </div>
      ) : (
        <>
          {/* Summary Badges (Section #13 requirement) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Registros
              </span>
              <p className="text-3xl font-black text-slate-900">{data.summary.total_filtrado}</p>
              <span className="text-xs text-slate-500 mt-1 block">no período selecionado</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                Em Andamento
              </span>
              <p className="text-3xl font-black text-amber-950">{data.summary.em_andamento}</p>
              <span className="text-xs text-amber-700/80 mt-1 block">no fornecedor Mendonça</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Concluídas
              </span>
              <p className="text-3xl font-black text-emerald-950">{data.summary.concluidas}</p>
              <span className="text-xs text-emerald-700/80 mt-1 block">retornos finalizados</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-xs bg-blue-50/20">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Tempo Médio de Reparo
              </span>
              <p className="text-3xl font-black text-blue-950">
                {data.summary.tempo_medio_dias} <span className="text-base font-bold text-blue-700">dias</span>
              </p>
              <span className="text-xs text-blue-700/80 mt-1 block">tempo de permanência</span>
            </div>
          </div>

          {/* Ranking Cards: Top Problem Radios & Top Defects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rádios que mais apresentaram problemas (Section #13 requirement) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Rádios com Maior Frequência de Manutenção
                  </h3>
                  <p className="text-xs text-slate-400">Identificação de equipamentos recorrentes</p>
                </div>
              </div>

              {data.top_problem_radios.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Nenhum rádio registrado no período.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_problem_radios.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{item.ra}</span>
                          <span className="text-slate-500 font-medium">({item.setor})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 pl-7 block">
                          Série: {item.serial} • {item.modelo}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-rose-700 block text-sm">
                          {item.count} {item.count === 1 ? 'manutenção' : 'manutenções'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {item.total_dias} dias acumulados
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Defeitos mais frequentes (Section #13 requirement) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Defeitos Mais Frequentes Reportados
                  </h3>
                  <p className="text-xs text-slate-400">Análise de falhas típicas de campo</p>
                </div>
              </div>

              {data.top_defects.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">Nenhum defeito registrado no período.</p>
              ) : (
                <div className="space-y-3">
                  {data.top_defects.map((def, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800 font-semibold">{def.defeito}</span>
                        <span className="font-bold text-slate-900">{def.total} ocorrências</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (def.total / (data.summary.total_filtrado || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full Detailed Grid Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Lista Analítica de Manutenções Filtradas ({data.records.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">RA</th>
                    <th className="py-3 px-4">Nº de Série</th>
                    <th className="py-3 px-4">Setor</th>
                    <th className="py-3 px-4">Defeito</th>
                    <th className="py-3 px-4">Data Ida</th>
                    <th className="py-3 px-4">Data Volta</th>
                    <th className="py-3 px-4">Tempo</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.identificador_ra}</td>
                      <td className="py-3 px-4 text-slate-600">{r.numero_serie}</td>
                      <td className="py-3 px-4 text-slate-700">{r.setor_nome || '-'}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs">{r.defeito}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{formatDate(r.data_ida)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {r.data_volta ? formatDate(r.data_volta) : <span className="text-amber-600 font-semibold">Em aberto</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <DaysBadge days={r.dias_em_manutencao} isOngoing={r.status === 'em_manutencao'} prefix={false} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
