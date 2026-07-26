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

    const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || 'http://67.205.153.151:4000/';
    const apiKey = (process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || '5a4366b3-1833-49b1-ba66-ef5148021386').trim();
    const instanceName = (process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE || 'douglas-eixo-nexo-ia').trim();

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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
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
          error: `Erro HTTP ${response.status} na Evolution GO. Verifique a instância (${instanceName}) e a chave API.`,
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
