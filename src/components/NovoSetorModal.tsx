import React, { useState, useEffect } from 'react';
import { Setor } from '../types';
import { api } from '../services/api';
import { X, Building2, AlertTriangle } from 'lucide-react';

interface NovoSetorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setorToEdit?: Setor | null;
}

export const NovoSetorModal: React.FC<NovoSetorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  setorToEdit
}) => {
  const [nome, setNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (setorToEdit) {
        setNome(setorToEdit.nome);
        setDescricao(setorToEdit.descricao || '');
        setStatus(setorToEdit.status);
      } else {
        setNome('');
        setDescricao('');
        setStatus('ativo');
      }
    }
  }, [isOpen, setorToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('O nome do setor é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        status
      };

      if (setorToEdit) {
        await api.updateSetor(setorToEdit.id, payload);
      } else {
        await api.createSetor(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar setor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F0] rounded-3xl shadow-2xl border border-[#E5DEC9] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {setorToEdit ? 'Editar Setor / Local' : 'Novo Setor / Local'}
              </h2>
              <p className="text-xs text-stone-300">Setores onde os rádios operam</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Nome do Setor *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Expedição, Portaria, Segurança..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Descrição do Setor (Opcional)
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Área de carregamento e logística externa..."
              className="w-full px-3.5 py-2 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {setorToEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Status do Setor
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ativo">Ativo (Permite novos rádios)</option>
                <option value="inativo">Inativo (Desabilitado para novos rádios)</option>
              </select>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-300 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : setorToEdit ? 'Salvar Alterações' : 'Cadastrar Setor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
