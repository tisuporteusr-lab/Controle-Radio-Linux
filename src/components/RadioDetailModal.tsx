import React, { useState, useEffect, useRef } from 'react';
import { RadioDetailResponse } from '../types';
import { api, formatDate } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { DaysBadge } from './DaysBadge';
import { useAuth } from '../context/AuthContext';
import { 
  X, Radio, Clock, Wrench, Shield, Calendar, AlertCircle, FileText, Trash2, 
  Eye, Download, UploadCloud, CheckCircle2, AlertTriangle, Paperclip
} from 'lucide-react';

interface RadioDetailModalProps {
  radioId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSendMaintenance?: (radioId: number) => void;
  onDeleteRadio?: (radioId: number) => void;
  onRadioUpdated?: () => void;
}

export const RadioDetailModal: React.FC<RadioDetailModalProps> = ({
  radioId,
  isOpen,
  onClose,
  onSendMaintenance,
  onDeleteRadio,
  onRadioUpdated
}) => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<RadioDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Termo upload / delete state
  const [uploadingTermo, setUploadingTermo] = useState<boolean>(false);
  const [termoActionError, setTermoActionError] = useState<string | null>(null);
  const [termoSuccessMsg, setTermoSuccessMsg] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && radioId) {
      setTermoActionError(null);
      setTermoSuccessMsg(null);
      loadDetail(radioId);
    } else {
      setData(null);
    }
  }, [isOpen, radioId]);

  const loadDetail = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRadioDetail(id);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar detalhes do rádio');
    } finally {
      setLoading(false);
    }
  };

  const handleTermoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !radioId) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setTermoActionError('Por favor, selecione apenas arquivos em formato PDF (.pdf).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setTermoActionError('O arquivo PDF não pode ultrapassar 25MB.');
      return;
    }

    try {
      setUploadingTermo(true);
      setTermoActionError(null);
      setTermoSuccessMsg(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          await api.uploadTermoPdf(radioId, {
            termo_pdf_base64: base64,
            termo_pdf_nome: file.name
          });
          setTermoSuccessMsg('Termo de uso anexado com sucesso!');
          loadDetail(radioId);
          if (onRadioUpdated) onRadioUpdated();
        } catch (err: any) {
          setTermoActionError(err.message || 'Erro ao fazer upload do termo');
        } finally {
          setUploadingTermo(false);
        }
      };
      reader.onerror = () => {
        setTermoActionError('Erro ao ler arquivo.');
        setUploadingTermo(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setTermoActionError(err.message || 'Erro ao anexar arquivo');
      setUploadingTermo(false);
    } finally {
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleRemoveTermo = async () => {
    if (!radioId) return;
    if (!confirm('Deseja realmente remover o termo de uso anexado a este rádio?')) return;

    try {
      setUploadingTermo(true);
      setTermoActionError(null);
      setTermoSuccessMsg(null);
      await api.deleteTermoPdf(radioId);
      setTermoSuccessMsg('Termo de uso removido com sucesso!');
      loadDetail(radioId);
      if (onRadioUpdated) onRadioUpdated();
    } catch (err: any) {
      setTermoActionError(err.message || 'Erro ao remover termo');
    } finally {
      setUploadingTermo(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF7F0] rounded-3xl shadow-2xl border border-[#E5DEC9] w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-stone-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black tracking-tight text-white">
                  RÁDIO {data?.radio.identificador_ra || '...'}
                </h2>
                {data && <StatusBadge status={data.radio.status} size="sm" />}
              </div>
              <p className="text-xs text-stone-300">
                {data?.radio.modelo} • Fornecedor: {data?.radio.fornecedor}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center text-stone-500 space-y-2">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium">Carregando ficha e histórico do rádio...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Radio Specification Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-[#E5DEC9]">
                <div>
                  <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">Número de Série</span>
                  <span className="text-sm font-bold text-stone-900">{data.radio.numero_serie}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">Modelo</span>
                  <span className="text-sm font-bold text-stone-900">{data.radio.modelo}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">Setor Atual</span>
                  <span className="text-sm font-bold text-stone-900">{data.radio.setor_nome || 'Não definido'}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-stone-400 block tracking-wider">Fornecedor / Locação</span>
                  <span className="text-sm font-bold text-stone-900">{data.radio.fornecedor}</span>
                </div>
              </div>

              {/* Statistical Metrics Blocks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold mb-1">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Total Manutenções</span>
                  </div>
                  <span className="text-2xl font-black text-blue-950">{data.stats.total_manutencoes}</span>
                  <span className="text-[11px] text-blue-700/80 block mt-0.5">vezes enviado</span>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dias em Reparo</span>
                  </div>
                  <span className="text-2xl font-black text-amber-950">{data.stats.total_dias_manutencao}</span>
                  <span className="text-[11px] text-amber-700/80 block mt-0.5">dias acumulados</span>
                </div>

                <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-2xl">
                  <div className="flex items-center gap-2 text-stone-600 text-xs font-semibold mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Último Envio</span>
                  </div>
                  <span className="text-base font-bold text-stone-900">{formatDate(data.stats.ultima_manutencao)}</span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">data de ida</span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold mb-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Status Operacional</span>
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={data.radio.status} size="sm" />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DO TERMO DE USO ASSINADO (PDF) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DEC9] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                      Termo de Uso e Responsabilidade Assinado (PDF)
                    </h3>
                  </div>

                  {data.radio.termo_pdf_nome ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Termo Anexado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium rounded-full w-fit">
                      Sem termo anexado
                    </span>
                  )}
                </div>

                {termoSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{termoSuccessMsg}</span>
                  </div>
                )}

                {termoActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{termoActionError}</span>
                  </div>
                )}

                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleTermoUpload}
                  className="hidden"
                />

                {data.radio.termo_pdf_nome ? (
                  <div className="p-4 bg-[#FAF7F0] border border-[#E5DEC9] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-900 truncate">
                          {data.radio.termo_pdf_nome}
                        </p>
                        <p className="text-xs text-stone-500">
                          {data.radio.termo_pdf_uploaded_at
                            ? `Enviado em ${formatDate(data.radio.termo_pdf_uploaded_at)}`
                            : 'Arquivo PDF registrado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={api.getTermoPdfUrl(data.radio.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir / Visualizar PDF</span>
                      </a>

                      <a
                        href={api.getTermoPdfUrl(data.radio.id)}
                        download={data.radio.termo_pdf_nome || 'termo_assinado.pdf'}
                        className="p-2 text-stone-600 hover:text-stone-900 bg-white border border-[#E5DEC9] hover:bg-stone-100 rounded-xl transition-colors"
                        title="Baixar arquivo PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            disabled={uploadingTermo}
                            onClick={() => uploadInputRef.current?.click()}
                            className="px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-[#E5DEC9] hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50"
                            title="Substituir PDF existente"
                          >
                            Substituir
                          </button>

                          <button
                            type="button"
                            disabled={uploadingTermo}
                            onClick={handleRemoveTermo}
                            className="p-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                            title="Remover termo anexado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF7F0] border border-[#E5DEC9] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        Nenhum termo de uso ou recibo de entrega assinado foi anexado a este rádio ainda.
                      </span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        disabled={uploadingTermo}
                        onClick={() => uploadInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50"
                      >
                        <UploadCloud className="w-4 h-4 text-amber-700" />
                        <span>{uploadingTermo ? 'Enviando...' : 'Anexar Termo (PDF)'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Maintenance History Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-stone-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                      Histórico Completo de Manutenções
                    </h3>
                  </div>
                  <span className="text-xs text-stone-500">
                    {data.history.length} {data.history.length === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {data.history.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-[#E5DEC9] text-stone-500 text-xs">
                    Este rádio nunca precisou ser enviado para manutenção.
                  </div>
                ) : (
                  <div className="border border-[#E5DEC9] rounded-2xl overflow-hidden shadow-xs bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EFE9D9] text-stone-700 font-bold uppercase border-b border-[#E5DEC9]">
                        <tr>
                          <th className="py-2.5 px-3">Data Ida</th>
                          <th className="py-2.5 px-3">Data Volta</th>
                          <th className="py-2.5 px-3">Defeito Apresentado</th>
                          <th className="py-2.5 px-3">Serviço Realizado</th>
                          <th className="py-2.5 px-3 text-center">Permanência</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5DEC9] bg-white">
                        {data.history.map((m) => (
                          <tr key={m.id} className="hover:bg-amber-50/50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">
                              {formatDate(m.data_ida)}
                            </td>
                            <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                              {m.data_volta ? formatDate(m.data_volta) : (
                                <span className="font-semibold text-amber-600">Em aberto</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-800 max-w-xs">
                              {m.defeito}
                            </td>
                            <td className="py-3 px-3 text-stone-600 max-w-xs truncate">
                              {m.servico_realizado || m.observacoes || '-'}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <DaysBadge days={m.dias} isOngoing={m.status === 'em_manutencao'} prefix={false} />
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <StatusBadge status={m.status} size="sm" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-[#EFE9D9] px-6 py-4 border-t border-[#E5DEC9] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            {isAdmin ? 'Ações administrativas disponíveis para este rádio.' : 'Histórico de manutenções e termo de uso.'}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isAdmin && data && onDeleteRadio && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteRadio(data.radio.id);
                }}
                className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                title="Excluir este rádio e seu histórico"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Rádio</span>
              </button>
            )}
            {data?.radio.status !== 'em_manutencao' && data?.radio.status !== 'inativo' && onSendMaintenance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSendMaintenance(data.radio.id);
                }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Enviar para Manutenção</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-[#E5DEC9] rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
