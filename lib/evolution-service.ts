/**
 * Envio de WhatsApp via Edge Function do Supabase.
 *
 * Saiu da rota /api/whatsapp/send do Next porque o Cloudflare Workers recusa
 * fetch para endereço IP literal, e o Evolution responde em http://<ip>:4000.
 *
 * O invoke anexa sozinho o token da sessão atual no Authorization — é ele que
 * a função usa para confirmar que quem chama é um usuário logado.
 */

import { supabase } from './supabase';

export interface EvolutionSendResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function enviarMensagemEvolutionAPI(
  telefone: string,
  mensagem: string
): Promise<EvolutionSendResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: { telefone, mensagem },
    });

    if (error) {
      // Em erro HTTP o corpo da resposta vem em error.context, não em message.
      let detalhe = error.message;
      try {
        const corpo = await (error as { context?: Response }).context?.json();
        if (corpo?.error) detalhe = corpo.error;
      } catch {
        // sem corpo legível: fica o error.message mesmo
      }
      return { success: false, error: detalhe };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Falha ao disparar a mensagem.' };
    }

    return {
      success: true,
      message: data.message || 'Mensagem enviada com sucesso pelo WhatsApp!',
    };
  } catch (err) {
    console.error('Erro ao chamar a função de WhatsApp:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha de conexão com o serviço de envio.',
    };
  }
}
