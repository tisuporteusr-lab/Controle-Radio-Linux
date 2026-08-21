import React, { useState, useEffect, useRef } from 'react';
import { Radio, Setor, RadioStatus } from '../types';
import { api } from '../services/api';
import { X, Radio as RadioIcon, AlertTriangle, Check, Plus, FileText, UploadCloud, Trash2, Eye, Paperclip } from 'lucide-react';

interface NovoRadioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  radioToEdit?: Radio | null;
  setores: Setor[];
}

export const NovoRadioModal: React.FC<NovoRadioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  radioToEdit,
  setores
}) => {
  const [numeroSerie, setNumeroSerie] = useState<string>('');
  const [identificadorRa, setIdentificadorRa] = useState<string>('');
  const [modelo, setModelo] = useState<string>('Motorola DP450');
  const [fornecedor, setFornecedor] = useState<string>('Mendonça');
  const [setorId, setSetorId] = useState<string | number>('');
  const [status, setStatus] = useState<RadioStatus>('em_uso');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Termo de Uso PDF state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [removeExistingPdf, setRemoveExistingPdf] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedFile(null);
      setFileBase64(null);
      setRemoveExistingPdf(false);

      if (radioToEdit) {
        setNumeroSerie(radioToEdit.numero_serie);
        setIdentificadorRa(radioToEdit.identificador_ra);
        setModelo(radioToEdit.modelo || 'Motorola DP450');
        setFornecedor(radioToEdit.fornecedor || 'Mendonça');
        setSetorId(radioToEdit.setor_id || '');
        setStatus(radioToEdit.status);
        setObservacoes(radioToEdit.observacoes || '');
      } else {
        setNumeroSerie('');
        setIdentificadorRa('');
        setModelo('Motorola DP450');
        setFornecedor('Mendonça');
        const activeSectors = setores.filter(s => s.status === 'ativo');
        setSetorId(activeSectors.length > 0 ? activeSectors[0].id : '');
        setStatus('em_uso');
        setObservacoes('');
      }
    }
  }, [isOpen, radioToEdit, setores]);

  const handleProcessFile = (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor, selecione apenas arquivos em formato PDF (.pdf).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('O arquivo PDF não pode ultrapassar 25MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setRemoveExistingPdf(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileBase64(result);
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo PDF.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileBase64(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificadorRa.trim()) {
      setError('O identificador RA é obrigatório (Ex: RA-025)');
      return;
    }
    if (!numeroSerie.trim()) {
      setError('O número de série é obrigatório');
      return;
    }
    if (!setorId) {
      setError('Selecione o setor/local de uso do rádio');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: any = {
        identificador_ra: identificadorRa.trim(),
        numero_serie: numeroSerie.trim(),
        modelo: modelo.trim() || 'Motorola DP450',
        fornecedor: fornecedor.trim() || 'Mendonça',
        setor_id: Number(setorId),
        status,
        observacoes: observacoes.trim(),
      };

      if (fileBase64 && selectedFile) {
        payload.termo_pdf_base64 = fileBase64;
        payload.termo_pdf_nome = selectedFile.name;
      } else if (removeExistingPdf) {
        payload.remover_termo_pdf = true;
      }

      if (radioToEdit) {
        await api.updateRadio(radioToEdit.id, payload);
      } else {
        await api.createRadio(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar rádio');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const existingTermo = radioToEdit?.termo_pdf_nome && !removeExistingPdf;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F0] rounded-3xl shadow-2xl border border-[#E5DEC9] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <RadioIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {radioToEdit ? 'Editar Rádio Comunicador' : 'Novo Rádio Comunicador'}
              </h2>
              <p className="text-xs text-stone-300">
                {radioToEdit ? `Modificando ${radioToEdit.identificador_ra}` : 'Cadastre o rádio no inventário'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Identificador RA */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Identificador RA *
              </label>
              <input
                type="text"
                value={identificadorRa}
                onChange={(e) => setIdentificadorRa(e.target.value)}
                placeholder="Ex: RA-025"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                required
              />
              <span className="text-[11px] text-stone-500 mt-1 block">Código único de identificação</span>
            </div>

            {/* Número de Série */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Número de Série *
              </label>
              <input
                type="text"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                placeholder="Ex: MOT-DP450-9921"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
              <span className="text-[11px] text-stone-500 mt-1 block">Número serial do fabricante</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Modelo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Modelo do Rádio *
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Motorola DP450"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Fornecedor / Locação
              </label>
              <input
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Mendonça"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Setor de Uso */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Setor / Local de Uso *
            </label>
            <select
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            >
              <option value="">Selecione o setor...</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === 'inativo'}>
                  {s.nome} {s.status === 'inativo' ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Inicial / Atual */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Status Atual do Rádio
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RadioStatus)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="em_uso">Em uso (Alocado no setor)</option>
              <option value="disponivel">Disponível (Reserva / Estoque)</option>
              <option value="em_manutencao">Em manutenção (No fornecedor)</option>
              <option value="inativo">Inativo (Desativado / Baixa)</option>
            </select>
          </div>

          {/* UPLOAD DO TERMO DE USO ASSINADO (PDF) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Termo de Responsabilidade / Uso Assinado (PDF)</span>
              </label>
              <span className="text-[11px] text-stone-500 font-medium">Opcional</span>
            </div>

            {/* If there is an existing term on edit and no new file selected */}
            {existingTermo && !selectedFile && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {radioToEdit?.termo_pdf_nome}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Termo assinado atualmente anexado a este rádio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={api.getTermoPdfUrl(radioToEdit!.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-100/70 rounded-lg transition-colors"
                    title="Visualizar PDF atual"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setRemoveExistingPdf(true)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Remover termo anexado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* If existing term was flagged for removal */}
            {radioToEdit?.termo_pdf_nome && removeExistingPdf && !selectedFile && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 mb-2">
                <span>O termo anterior será removido ao salvar.</span>
                <button
                  type="button"
                  onClick={() => setRemoveExistingPdf(false)}
                  className="font-bold underline text-rose-900 hover:text-rose-950"
                >
                  Desfazer remoção
                </button>
              </div>
            )}

            {/* New selected file preview */}
            {selectedFile ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-950 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {formatFileSize(selectedFile.size)} • Pronto para envio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    Trocar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Remover arquivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-amber-500 bg-amber-50/80 scale-[0.99]'
                    : 'border-[#E5DEC9] bg-white hover:bg-amber-50/30 hover:border-amber-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-amber-800 hover:underline">
                      Clique para selecionar o PDF
                    </span>{' '}
                    <span className="text-stone-500">ou arraste e solte aqui</span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Apenas arquivos .PDF (Termo assinado de entrega/responsabilidade) até 25MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Rádio do posto principal da portaria, termo assinado pelo colaborador..."
              className="w-full px-3.5 py-2 bg-white border border-[#E5DEC9] rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
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
              {loading ? 'Salvando...' : radioToEdit ? 'Salvar Alterações' : 'Cadastrar Rádio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
