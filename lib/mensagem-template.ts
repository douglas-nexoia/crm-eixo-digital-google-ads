import { Lead } from './types';

/**
 * Gera a mensagem padrão comercial usando o nome real da Cidade
 */
export function gerarMensagemPadrao(lead: Partial<Lead>, nichoParam?: string, cidadeParam?: string): string {
  const nomeEmpresa = lead.nome || 'sua empresa';
  const cidade = lead.cidade || cidadeParam || lead.buscas?.cidade || 'sua região';
  const posicao = lead.posicao_maps ? `${lead.posicao_maps}ª` : '4ª';
  const nota = lead.gmb_nota ? String(lead.gmb_nota) : '4';

  const falhas: string[] = [];
  
  if (lead.gmb_avaliacoes !== undefined && lead.gmb_avaliacoes < 10) {
    falhas.push(`Poucas avaliações no GMB (${lead.gmb_avaliacoes})`);
  }
  if (!lead.site) {
    falhas.push('Sem site cadastrado');
  } else if (!lead.site_https) {
    falhas.push('Site sem certificado de segurança (HTTPS)');
  }
  if (!lead.instagram) {
    falhas.push('Sem Instagram');
  }
  if (!lead.facebook) {
    falhas.push('Sem Facebook');
  }

  const textoFalhas = falhas.length > 0
    ? falhas.slice(0, 3).join(', ')
    : 'Pontos fracos na otimização do perfil do Google';

  // Usar o nome exato da Cidade
  const localizacaoTexto = cidade !== 'sua região' ? `em ${cidade}` : 'em sua região';

  return `Olá! Tudo bem?

Notei que a ${nomeEmpresa} está atualmente na ${posicao} posição (fora do Top 3 que atrai a maioria dos clientes) nas buscas do Google ${localizacaoTexto}, estando com nota ${nota}.

Fiz um diagnóstico rápido e identifiquei alguns fatores que fazem concorrentes diretos receberem mais chamadas (ex: ${textoFalhas}).

Gostaria de ver o relatório comparativo gratuito que montei para colocar a ${nomeEmpresa} no topo do Google?`;
}
