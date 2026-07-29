import React from 'react';
import { ScoreNivel } from '@/lib/types';

interface ScoreBadgeProps {
  nivel: ScoreNivel;
  pontos?: number;
  showPoints?: boolean;
}

/**
 * A escala mede OPORTUNIDADE de prospecção, não saúde do negócio.
 *
 * A versão anterior pintava "baixo" de verde com um ✅ e "alto" de vermelho.
 * Na tela de Explorar — que é onde se decide quem abordar — isso fazia o olho
 * pousar em selos verdes de aprovação que marcavam justamente os piores alvos
 * da base, enquanto o melhor lead vinha em vermelho de alerta.
 *
 * Agora o destaque visual acompanha o que merece ação: alta em verde, baixa
 * apagada em neutro. E os rótulos dizem "alta/baixa oportunidade" em vez de
 * "alto/baixo", que sozinho não informava do que se tratava.
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ nivel, pontos, showPoints = true }) => {
  const configs = {
    alto: {
      label: '🔥 Alta',
      bg: 'bg-emerald-950/50 text-emerald-300 border-emerald-600/60',
    },
    medio: {
      label: 'Média',
      bg: 'bg-amber-950/40 text-amber-400 border-amber-800/50',
    },
    baixo: {
      label: 'Baixa',
      bg: 'bg-slate-800/50 text-slate-400 border-slate-700/50',
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
