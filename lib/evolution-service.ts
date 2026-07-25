/**
 * Serviço de Integração com Evolution API (WhatsApp)
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
  const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
  const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY;
  const instance = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    return {
      success: false,
      error: 'Evolution API não configurada. Defina as variáveis EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE.'
    };
  }

  // Limpar e formatar o número (remover não digitos)
  let numeroLimpo = telefone.replace(/\D/g, '');
  
  // Garantir código do país (55 para Brasil se não tiver)
  if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
    numeroLimpo = '55' + numeroLimpo;
  }

  try {
    // Endpoint padrão da Evolution API (v1 / v2 endpoint sendText)
    const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: numeroLimpo,
        text: mensagem,
        options: {
          delay: 1200,
          presence: 'composing'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.response?.message || data?.message || 'Falha no disparo via Evolution API'
      };
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso pelo WhatsApp!'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro de conexão com o servidor da Evolution API'
    };
  }
}
