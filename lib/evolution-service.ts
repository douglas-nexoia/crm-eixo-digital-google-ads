/**
 * Serviço de Integração com Evolution API GO (Versão GoLang)
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
      error: 'WhatsApp API não configurada. Defina as variáveis NEXT_PUBLIC_EVOLUTION_API_URL, NEXT_PUBLIC_EVOLUTION_API_KEY e NEXT_PUBLIC_EVOLUTION_INSTANCE no .env'
    };
  }

  // Limpar e formatar o número (remover não dígitos)
  let numeroLimpo = telefone.replace(/\D/g, '');
  
  // Garantir código do país (55 para Brasil)
  if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
    numeroLimpo = '55' + numeroLimpo;
  }

  try {
    const baseUrl = apiUrl.trim().replace(/\/+$/, '');
    const instanceName = instance.trim();
    
    // Suporte aos endpoints da Evolution API v1/v2 e Evolution GO
    // Tenta primeiro o endpoint padrão /message/sendText/:instance
    let endpoint = `${baseUrl}/message/sendText/${instanceName}`;

    let bodyPayload: any = {
      number: numeroLimpo,
      text: mensagem
    };

    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey.trim(),
        'instance': instanceName
      },
      body: JSON.stringify(bodyPayload)
    });

    // Se der 404, tentar o formato alternativo /message/sendText (com instance na URL ou payload)
    if (response.status === 404) {
      endpoint = `${baseUrl}/message/sendText`;
      bodyPayload = {
        instance: instanceName,
        number: numeroLimpo,
        text: mensagem
      };

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey.trim(),
          'instance': instanceName
        },
        body: JSON.stringify(bodyPayload)
      });
    }

    const responseText = await response.text();
    let data: any = {};

    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        return {
          success: false,
          error: `Erro HTTP ${response.status} ao conectar no servidor de WhatsApp. Verifique se a URL (${baseUrl}) e o nome da Instância (${instanceName}) estão corretos.`
        };
      }
    }

    if (!response.ok) {
      const msgErro = data?.response?.message || data?.message || data?.error || `Erro ${response.status} no servidor de WhatsApp`;
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
    console.error('Erro de requisição na WhatsApp API:', err);
    return {
      success: false,
      error: err.message || 'Falha de conexão de rede ao tentar contatar a API do WhatsApp.'
    };
  }
}
