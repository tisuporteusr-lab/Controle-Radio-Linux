import React, { useState, useEffect } from 'react';
import { Manutencao } from '../types';
import { api, formatToday, formatDate } from '../services/api';
import { X, CheckCircle2, Clock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

interface RegistrarRetornoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  manutencao: Manutencao | null;
}

export const RegistrarRetornoModal: React.FC<RegistrarRetornoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  manutencao
}) => {
  const [dataVolta, setDataVolta] = useState<string>(formatToday());
  const [servicoRealizado, setServicoRealizado] = useState<string>('');
  const [statusRetorno, setStatusRetorno] = useState<'em_uso' | 'disponivel'>('em_uso');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && manutencao) {
      setDataVolta(formatToday());
      setServicoRealizado('');
      setStatusRetorno('em_uso');
      setError(null);
    }
  }, [isOpen, manutencao]);

  if (!isOpen || !manutencao) return null;

  // Real-time calculation of duration in days
  const calculateDaysDiff = () => {
    if (!manutencao.data_ida || !dataVolta) return 0;
    const start = new Date(manutencao.data_ida);
    const end = new Date(dataVolta);
    const d1 = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const d2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const diff = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  const daysCalculated = calculateDaysDiff();
  const isInvalidDate = dataVolta < manutencao.data_ida;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataVolta) {
      setError('A data de retorno é obrigatória');
      return;
    }
    if (isInvalidDate) {
      setError(`A data de retorno não pode ser anterior à data de ida (${formatDate(manutencao.data_ida)})`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.registrarRetorno(manutencao.id, {
        data_volta: dataVolta,
        servico_realizado: servicoRealizado.trim(),
        status_retorno_radio: statusRetorno
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar retorno do rádio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-200 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registrar Retorno da Manutenção</h2>
              <p className="text-xs text-emerald-200">Rádio {manutencao.identificador_ra} ({manutencao.modelo})</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Maintenance Context Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Identificador RA:</span>
              <span className="font-bold text-slate-900 text-sm">{manutencao.identificador_ra}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Nº de Série / Modelo:</span>
              <span className="font-semibold text-slate-800">{manutencao.numero_serie} • {manutencao.modelo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Setor de Origem:</span>
              <span className="font-semibold text-slate-800">{manutencao.setor_nome || 'Não informado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Data de Ida:</span>
              <span className="font-bold text-amber-700">{formatDate(manutencao.data_ida)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block font-medium mb-0.5">Defeito Reportado:</span>
              <span className="font-medium text-slate-900 bg-white p-2 rounded-lg border border-slate-200 block">
                {manutencao.defeito}
              </span>
            </div>
          </div>

          {/* Dynamic Calculation Highlight */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-emerald-950">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs text-emerald-800 block font-medium">Tempo total de permanência:</span>
                <span className="text-sm font-bold text-emerald-900">
                  {isInvalidDate ? 'Data inválida' : `${daysCalculated} ${daysCalculated === 1 ? 'dia' : 'dias'} em manutenção`}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-emerald-700">
              Cálculo Automático
            </div>
          </div>

          {/* Data de Retorno */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Data de Retorno do Rádio *
            </label>
            <input
              type="date"
              value={dataVolta}
              min={manutencao.data_ida}
              onChange={(e) => setDataVolta(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Serviço Realizado */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Observações do Serviço Realizado / Peças Trocadas
            </label>
            <textarea
              rows={2}
              value={servicoRealizado}
              onChange={(e) => setServicoRealizado(e.target.value)}
              placeholder="Ex: Troca de placa mãe, substituição de antena, limpeza interna e teste de RF concluído pelo fornecedor Mendonça..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          {/* Novo Status do Rádio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Novo Status do Rádio *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  statusRetorno === 'em_uso' 
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold' 
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="statusRetorno"
                  value="em_uso"
                  checked={statusRetorno === 'em_uso'}
                  onChange={() => setStatusRetorno('em_uso')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <p className="font-bold">Em uso</p>
                  <p className="text-slate-500 text-[11px]">Retorna ao setor de origem</p>
                </div>
              </label>

              <label 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  statusRetorno === 'disponivel' 
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold' 
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="statusRetorno"
                  value="disponivel"
                  checked={statusRetorno === 'disponivel'}
                  onChange={() => setStatusRetorno('disponivel')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <p className="font-bold">Disponível</p>
                  <p className="text-slate-500 text-[11px]">Fica na reserva / estoque</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidDate}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Concluir Manutenção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
