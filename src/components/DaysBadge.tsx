import React from 'react';
import { Clock } from 'lucide-react';

interface DaysBadgeProps {
  days: number;
  isOngoing?: boolean;
  prefix?: boolean;
}

export const DaysBadge: React.FC<DaysBadgeProps> = ({ days, isOngoing = false, prefix = true }) => {
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  if (isOngoing) {
    if (days >= 15) {
      colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    } else if (days >= 7) {
      colorStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    } else {
      colorStyle = 'bg-stone-100 text-stone-700 border-stone-300';
    }
  }

  const text = isOngoing
    ? (prefix ? `Em manutenção há ${days} ${days === 1 ? 'dia' : 'dias'}` : `${days} ${days === 1 ? 'dia' : 'dias'}`)
    : `${days} ${days === 1 ? 'dia' : 'dias'}`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md border ${colorStyle}`}>
      <Clock className="w-3 h-3" />
      <span>{text}</span>
    </span>
  );
};
