import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { telefone, mensagem } = await req.json();

    if (!telefone || !mensagem) {
      return NextResponse.json(
        { success: false, error: 'Telefone e mensagem são obrigatórios.' },
        { status: 400 }
      );
    }

    // Credenciais server-side apenas: nunca usar NEXT_PUBLIC_, que vaza no bundle do cliente.
    const apiUrl = process.env.EVOLUTION_API_URL?.trim();
    const apiKey = process.env.EVOLUTION_API_KEY?.trim();
    const instanceName = process.env.EVOLUTION_INSTANCE?.trim();

    if (!apiUrl || !apiKey || !instanceName) {
      console.error('Evolution não configurada: defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE.');
      return NextResponse.json(
        { success: false, error: 'Integração de WhatsApp não configurada no servidor.' },
        { status: 500 }
      );
    }

    // Formatar número de telefone (remover não numéricos)
    let formattedNumber = telefone.replace(/\D/g, '');
    if (!formattedNumber.startsWith('55') && formattedNumber.length >= 10) {
      formattedNumber = `55${formattedNumber}`;
    }

    const cleanBaseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const endpoint = `${cleanBaseUrl}/send/text`;

    const payload = {
      instance: instanceName,
      number: formattedNumber,
      text: mensagem
    };

    // Fazer requisição com User-Agent de navegador para evitar bloqueios de WAF da Evolution
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error('Erro HTTP na Evolution GO:', response.status, responseText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro HTTP ${response.status} na Evolution GO.`,
          details: responseText
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso pelo WhatsApp!',
      data
    });

  } catch (error: any) {
    console.error('Erro no Proxy da Evolution API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao tentar enviar a mensagem de WhatsApp.' },
      { status: 500 }
    );
  }
}
