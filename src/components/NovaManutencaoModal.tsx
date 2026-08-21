import React, { useState, useEffect } from 'react';
import { Radio, Setor } from '../types';
import { api, formatToday } from '../services/api';
import { X, Wrench, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface NovaManutencaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRadioId?: number | null;
}

export const NovaManutencaoModal: React.FC<NovaManutencaoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRadioId = null
}) => {
  const [radios, setRadios] = useState<Radio[]>([]);
  const [selectedRadioId, setSelectedRadioId] = useState<number | string>(initialRadioId || '');
  const [dataIda, setDataIda] = useState<string>(formatToday());
  const [defeito, setDefeito] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setDataIda(formatToday());
      setDefeito('');
      setObservacoes('');
      loadAvailableRadios();
      if (initialRadioId) {
        setSelectedRadioId(initialRadioId);
      }
    }
  }, [isOpen, initialRadioId]);

  const loadAvailableRadios = async () => {
    try {
      const data = await api.getRadios();
      // Only radios not inactive and not currently in maintenance (or the initial one if preselected)
      const available = data.filter(r => 
        r.status !== 'inativo' && (r.status !== 'em_manutencao' || r.id === initialRadioId)
      );
      setRadios(available);
      if (!selectedRadioId && available.length > 0 && !initialRadioId) {
        setSelectedRadioId(available[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar rádios');
    }
  };

  const selectedRadio = radios.find(r => String(r.id) === String(selectedRadioId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRadioId) {
      setError('Por favor, selecione um rádio');
      return;
    }
    if (!dataIda) {
      setError('A data de envio é obrigatória');
      return;
    }
    if (!defeito.trim()) {
      setError('Descreva o defeito apresentado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createManutencao({
        radio_id: Number(selectedRadioId),
        data_ida: dataIda,
        defeito: defeito.trim(),
        observacoes: observacoes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar manutenção');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Enviar Rádio para Manutenção</h2>
              <p className="text-xs text-slate-300">Fornecedor Mendonça • Motorola DP450</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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

          {/* Radio Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Selecione o Rádio (Identificador RA) *
            </label>
            <select
              value={selectedRadioId}
              onChange={(e) => setSelectedRadioId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            >
              <option value="">Selecione um rádio...</option>
              {radios.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.identificador_ra} — {r.modelo} ({r.setor_nome || 'Sem setor'})
                </option>
              ))}
            </select>
          </div>

          {/* Auto-filled details card */}
          {selectedRadio && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Número de Série:</span>
                <span className="text-slate-900 font-semibold">{selectedRadio.numero_serie}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Modelo:</span>
                <span className="text-slate-900 font-semibold">{selectedRadio.modelo}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Setor de Uso:</span>
                <span className="text-slate-900 font-semibold">{selectedRadio.setor_nome || 'Não definido'}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Fornecedor / Locador:</span>
                <span className="text-slate-900 font-semibold">{selectedRadio.fornecedor || 'Mendonça'}</span>
              </div>
            </div>
          )}

          {/* Data de Ida */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Data de Ida para Manutenção *
            </label>
            <input
              type="date"
              value={dataIda}
              onChange={(e) => setDataIda(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          {/* Defeito Apresentado */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Defeito Apresentado *
            </label>
            <input
              type="text"
              value={defeito}
              onChange={(e) => setDefeito(e.target.value)}
              placeholder="Ex: Não liga, ruído no áudio, botão PTT com mau contato..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Observações Adicionais (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Usuário relatou queda no setor de expedição..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
            />
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>Ao salvar, o status do rádio será alterado automaticamente para <strong>"Em manutenção"</strong> e o contador de dias será iniciado.</span>
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
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar Envio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
