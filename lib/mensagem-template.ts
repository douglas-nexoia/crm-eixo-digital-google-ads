import { Lead } from './types';

export function gerarMensagemPadrao(lead: Partial<Lead>, nicho?: string, cidade?: string): string {
  const nome = lead.nome || 'Empresa';
  const nota = lead.gmb_nota ? `nota ${lead.gmb_nota}` : 'nota abaixo do ideal';
  const posicao = lead.posicao_maps ? `#${lead.posicao_maps}` : 'fora do topo';
  const falhas = lead.score_detalhes && lead.score_detalhes.length > 0 
    ? lead.score_detalhes.slice(0, 3).join(', ') 
    : 'falhas de otimização no perfil e presença web';

  return `Olá! Tudo bem?

Notei que a ${nome} está em ${posicao} no Google Maps em ${cidade || 'sua região'} com ${nota}.

Fiz um diagnóstico rápido e identifiquei alguns pontos que estão fazendo concorrentes passarem na frente (ex: ${falhas}).

Preparamos um relatório comparativo gratuito mostrando exatamente como colocar sua empresa no topo do Google. Posso te enviar por aqui?`;
}
