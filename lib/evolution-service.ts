/**
 * Serviço de Integração com WhatsApp API chamando o Proxy Server-Side (sem erro de CORS)
 */

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
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        telefone,
        mensagem
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || `Erro ${response.status} ao disparar mensagem.`
      };
    }

    return {
      success: true,
      message: data.message || 'Mensagem enviada com sucesso pelo WhatsApp!'
    };
  } catch (err: any) {
    console.error('Erro ao chamar API interna de WhatsApp:', err);
    return {
      success: false,
      error: err.message || 'Falha de conexão com a API de envio de WhatsApp.'
    };
  }
}
