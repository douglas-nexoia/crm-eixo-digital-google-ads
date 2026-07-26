import { Lead } from './types';
import { supabase } from './supabase';
import { gerarMensagemPadrao } from './mensagem-template';

/**
 * Gera a mensagem de abordagem pela Edge Function do Supabase.
 *
 * O invoke anexa sozinho o token da sessão atual — é ele que a função usa para
 * confirmar que quem chama é um usuário logado, e não alguém de posse da anon
 * key queimando créditos da OpenAI.
 *
 * Qualquer falha cai no template local: é melhor uma mensagem padrão do que
 * nenhuma mensagem.
 */
export async function gerarMensagemAbordagemIA(
  lead: Lead,
  nichoParam?: string,
  cidadeParam?: string
): Promise<string> {
  const nomeEmpresa = lead.nome;
  const nicho = lead.nicho || nichoParam || lead.buscas?.nicho || 'serviços';
  const cidade = lead.cidade || cidadeParam || lead.buscas?.cidade || 'sua cidade';
  const posicao = lead.posicao_maps ? `${lead.posicao_maps}ª` : '4ª';
  const nota = lead.gmb_nota ? String(lead.gmb_nota) : '4.0';

  const falhasTexto = lead.score_detalhes && lead.score_detalhes.length > 0
    ? lead.score_detalhes.join(', ')
    : 'Poucas avaliações e perfil do Google desatualizado';

  const prompt = `Crie uma mensagem persuasiva e amigável de abordagem comercial via WhatsApp para um cliente em potencial de ${nicho} na cidade de ${cidade}.

Dados da empresa:
- Nome da empresa: ${nomeEmpresa}
- Posição atual no Google Maps: ${posicao} posição (fora do Top 3 que recebe 80% das chamadas)
- Nota no Google: ${nota}
- Cidade: ${cidade}
- Principais falhas identificadas: ${falhasTexto}

Regras da mensagem:
1. Comece com uma saudação amigável.
2. Destaque que a empresa ${nomeEmpresa} está na ${posicao} posição nas buscas do Google em ${cidade}.
3. Mencione com tato 1 ou 2 falhas identificadas que os concorrentes estão usando para passar na frente.
4. Termine convidando o cliente para ver o relatório de diagnóstico digital gratuito.
5. Use emojis de forma sutil e profissional.
6. A mensagem DEVE ser em português do Brasil e pronta para colar no WhatsApp.`;

  try {
    const { data, error } = await supabase.functions.invoke('openai-generate', {
      body: { prompt }
    });

    if (error) {
      console.error('Falha ao gerar mensagem com IA, usando o template:', error.message);
      return gerarMensagemPadrao(lead, nicho, cidade);
    }

    if (data?.success && data.text) {
      return data.text;
    }

    console.error('IA não retornou texto, usando o template:', data?.error);
    return gerarMensagemPadrao(lead, nicho, cidade);

  } catch (error) {
    console.error('Erro de conexão ao regerar com IA:', error);
    return gerarMensagemPadrao(lead, nicho, cidade);
  }
}
