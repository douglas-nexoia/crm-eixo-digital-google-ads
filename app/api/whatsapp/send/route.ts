import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { telefone, mensagem } = await req.json();

    const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || 'http://67.205.153.151:4000';
    const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY;
    const instance = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE;

    if (!apiKey || !instance) {
      return NextResponse.json(
        { success: false, error: 'Chaves da WhatsApp API (Evolution GO) não configuradas no .env' },
        { status: 400 }
      );
    }

    // Limpar e formatar o número (remover não dígitos)
    let numeroLimpo = (telefone || '').replace(/\D/g, '');
    
    // Garantir DDI 55 se o número for do Brasil (10 ou 11 dígitos)
    if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
      numeroLimpo = '55' + numeroLimpo;
    }

    const baseUrl = apiUrl.trim().replace(/\/+$/, '');
    const instanceName = instance.trim();

    // Endpoint exato da Evolution GO
    const endpoint = `${baseUrl}/message/sendText/${instanceName}`;

    // Payload no formato exato da Evolution GO
    const payload = {
      number: numeroLimpo,
      textMessage: {
        text: mensagem
      },
      options: {
        delay: 1200,
        presence: 'composing'
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey.trim()
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data: any = {};

    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: `Erro HTTP ${response.status} na Evolution GO. Verifique o servidor (${baseUrl}) e a Instância (${instanceName}).`
        }, { status: response.status });
      }
    }

    if (!response.ok) {
      const msgErro = data?.response?.message || data?.message || data?.error || `Erro ${response.status} na API Evolution GO`;
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
      error: err.message || 'Erro interno ao conectar ao servidor da Evolution GO.'
    }, { status: 500 });
  }
}
