import { Lead } from './types';
import { gerarMensagemPadrao } from './mensagem-template';

/**
 * Gera mensagem de abordagem usando OpenAI GPT-4o-mini ou Fallback para template
 */
export async function gerarMensagemAbordagemIA(lead: Partial<Lead>, nicho?: string, cidade?: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  // Se não houver chave da OpenAI configurada, usar o gerador de template nativo
  if (!apiKey) {
    return gerarMensagemPadrao(lead, nicho, cidade);
  }

  const prompt = `Você é um especialista em prospecção da agência "Eixo Digital" (especialista em colocar empresas locais no topo do Google).
Escreva uma mensagem curta, direta e amigável para envio pelo WhatsApp abordando a empresa "${lead.nome || 'Empresa'}".

Dados da empresa prospectada:
- Cidade/Nicho: ${cidade || 'sua região'} / ${nicho || 'serviços'}
- Posição no Google Maps: ${lead.posicao_maps ? `${lead.posicao_maps}ª posição` : 'fora das primeiras posições'}
- Nota no Google (GMB): ${lead.gmb_nota || 'sem nota'}
- Principais falhas no perfil/site: ${lead.score_detalhes ? lead.score_detalhes.join(', ') : 'sem site/sem otimização'}

Instruções da mensagem:
1. Comece cumprimentando amigavelmente.
2. Mencione que notou a posição dela no Google Maps de forma construtiva (ex: "vi que sua empresa está na Xª posição, fora do Top 3 que atrai a maioria das chamadas").
3. Ofereça um relatório/diagnóstico comparativo gratuito com os concorrentes locais.
4. Termine com uma pergunta simples para ela responder se deseja receber.
5. Não use termos técnicos em inglês nem códigos como #4.
6. Texto formatado para WhatsApp (máximo 4 a 5 parágrafos curtos).`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.warn('Falha na resposta da OpenAI. Usando gerador padrao.');
      return gerarMensagemPadrao(lead, nicho, cidade);
    }

    const data = await response.json();
    const mensagemIA = data.choices?.[0]?.message?.content?.trim();
    
    return mensagemIA || gerarMensagemPadrao(lead, nicho, cidade);
  } catch (err) {
    console.error('Erro de integração OpenAI:', err);
    return gerarMensagemPadrao(lead, nicho, cidade);
  }
}
