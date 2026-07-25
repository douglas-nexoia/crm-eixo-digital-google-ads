import { Lead } from './types';

export function gerarMensagemPadrao(lead: Partial<Lead>, nicho?: string, cidade?: string): string {
  const nome = lead.nome || 'Empresa';
  const nota = lead.gmb_nota ? `nota ${lead.gmb_nota}` : 'uma nota abaixo do ideal';
  
  let textoPosicao = 'fora das primeiras posições';
  if (lead.posicao_maps) {
    if (lead.posicao_maps <= 3) {
      textoPosicao = `na ${lead.posicao_maps}ª posição`;
    } else {
      textoPosicao = `na ${lead.posicao_maps}ª posição (fora do Top 3 que atrai a maioria dos clientes)`;
    }
  }

  const falhas = lead.score_detalhes && lead.score_detalhes.length > 0 
    ? lead.score_detalhes.slice(0, 3).join(', ') 
    : 'pontos de melhoria no perfil do Google e site';

  return `Olá! Tudo bem?

Notei que a ${nome} está atualmente ${textoPosicao} nas buscas do Google em ${cidade || 'sua região'}, estando com ${nota}.

Fiz um diagnóstico rápido e identifiquei alguns fatores que fazem concorrentes diretos receberem mais chamadas (ex: ${falhas}).

Preparamos um relatório comparativo gratuito mostrando como colocar sua empresa no topo do Google. Posso te enviar o link por aqui?`;
}
