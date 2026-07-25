import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { telefone, mensagem } = await req.json();

    const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
    const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY;
    const instance = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE;

    if (!apiUrl || !apiKey || !instance) {
      return NextResponse.json(
        { success: false, error: 'Chaves da WhatsApp API não configuradas no .env' },
        { status: 400 }
      );
    }

    // Limpar e formatar o número (remover não dígitos)
    let numeroLimpo = (telefone || '').replace(/\D/g, '');
    if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
      numeroLimpo = '55' + numeroLimpo;
    }

    const baseUrl = apiUrl.trim().replace(/\/+$/, '');
    const instanceName = instance.trim();

    // 1. Tentar endpoint padrão /message/sendText/:instance
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

    // 2. Se der 404, tentar o formato alternativo da Evolution GO /message/sendText
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
        return NextResponse.json({
          success: false,
          error: `Erro HTTP ${response.status} na WhatsApp API (${baseUrl}). Verifique a URL e Instância.`
        }, { status: response.status });
      }
    }

    if (!response.ok) {
      const msgErro = data?.response?.message || data?.message || data?.error || `Erro ${response.status} na API`;
      return NextResponse.json({
        success: false,
        error: Array.isArray(msgErro) ? msgErro.join(', ') : String(msgErro)
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso pelo WhatsApp!'
    });

  } catch (err: any) {
    console.error('Erro no servidor ao enviar WhatsApp:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Erro interno de servidor ao tentar conectar ao WhatsApp.'
    }, { status: 500 });
  }
}
