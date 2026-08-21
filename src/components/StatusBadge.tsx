import React from 'react';
import { RadioStatus, ManutencaoStatus } from '../types';
import { CheckCircle2, Clock, Radio as RadioIcon, Check, AlertCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: RadioStatus | ManutencaoStatus | 'ativo' | 'inativo';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  switch (status) {
    case 'em_manutencao':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/50 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Em manutenção</span>
        </span>
      );
    case 'concluida':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Concluída</span>
        </span>
      );
    case 'em_uso':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-stone-200/80 text-stone-800 border border-stone-300 font-semibold ${sizeClasses[size]}`}>
          <RadioIcon className="w-3.5 h-3.5 text-stone-700" />
          <span>Em uso</span>
        </span>
      );
    case 'disponivel':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold ${sizeClasses[size]}`}>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Disponível</span>
        </span>
      );
    case 'ativo':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Ativo</span>
        </span>
      );
    case 'inativo':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-400/30 dark:text-slate-400 ${sizeClasses[size]}`}>
          <Ban className="w-3.5 h-3.5 text-slate-500" />
          <span>Inativo</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 ${sizeClasses[size]}`}>
          {status}
        </span>
      );
  }
};
