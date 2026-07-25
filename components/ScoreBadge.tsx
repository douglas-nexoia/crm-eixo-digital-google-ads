import React from 'react';
import { ScoreNivel } from '@/lib/types';

interface ScoreBadgeProps {
  nivel: ScoreNivel;
  pontos?: number;
  showPoints?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ nivel, pontos, showPoints = true }) => {
  const configs = {
    alto: {
      label: '🔥 Alto',
      bg: 'bg-red-950/40 text-red-400 border-red-800/50',
    },
    medio: {
      label: '⚠️ Médio',
      bg: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    },
    baixo: {
      label: '✅ Baixo',
      bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50',
    },
  };

  const config = configs[nivel] || configs.medio;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span>{config.label}</span>
      {showPoints && pontos !== undefined && (
        <span className="opacity-75">({pontos} pts)</span>
      )}
    </span>
  );
};
