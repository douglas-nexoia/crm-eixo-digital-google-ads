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
      error: 'Evolution API não configurada. Defina as variáveis NEXT_PUBLIC_EVOLUTION_API_URL, NEXT_PUBLIC_EVOLUTION_API_KEY e NEXT_PUBLIC_EVOLUTION_INSTANCE no .env'
    };
  }

  // Limpar e formatar o número (remover caracteres não numéricos)
  let numeroLimpo = telefone.replace(/\D/g, '');
  
  // Garantir código do país (55 para Brasil)
  if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
    numeroLimpo = '55' + numeroLimpo;
  }

  try {
    // Normalizar a URL removendo barras no final
    const baseUrl = apiUrl.trim().replace(/\/+$/, '');
    const instanceName = instance.trim();
    
    // Endpoint padrão da Evolution API v1 / v2
    const endpoint = `${baseUrl}/message/sendText/${instanceName}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey.trim()
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

    const responseText = await response.text();
    let data: any = {};

    // Tentar converter resposta para JSON com segurança
    try {
      data = JSON.parse(responseText);
    } catch {
      // Se não for JSON (ex: erro HTML ou resposta de texto)
      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP ${response.status} ao conectar na Evolution API. Verifique a URL do servidor e o nome da Instância.`
        };
      }
    }

    if (!response.ok) {
      const msgErro = data?.response?.message || data?.message || data?.error || `Erro ${response.status} na Evolution API`;
      return {
        success: false,
        error: Array.isArray(msgErro) ? msgErro.join(', ') : String(msgErro)
      };
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso pelo WhatsApp!'
    };
  } catch (err: any) {
    console.error('Erro de requisição na Evolution API:', err);
    return {
      success: false,
      error: err.message || 'Falha de conexão de rede ao tentar contatar o servidor da Evolution API.'
    };
  }
}
