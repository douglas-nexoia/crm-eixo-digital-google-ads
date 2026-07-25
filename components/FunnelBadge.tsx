import React from 'react';
import { StatusFunil } from '@/lib/types';

interface FunnelBadgeProps {
  status: StatusFunil;
}

export const FunnelBadge: React.FC<FunnelBadgeProps> = ({ status }) => {
  const styles: Record<StatusFunil, string> = {
    'Novo': 'bg-blue-950/60 text-blue-400 border-blue-800/60',
    'Contatado': 'bg-purple-950/60 text-purple-400 border-purple-800/60',
    'Aceitou Diagnóstico': 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    'Em Negociação': 'bg-yellow-950/60 text-yellow-400 border-yellow-800/60',
    'Cliente': 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    'Descartado': 'bg-slate-800/60 text-slate-400 border-slate-700/60',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[status] || styles['Novo']}`}>
      {status}
    </span>
  );
};
