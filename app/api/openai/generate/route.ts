import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    // Credencial server-side apenas: NEXT_PUBLIC_ vazaria a chave no bundle do cliente.
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY não configurada' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em vendas B2B e copywriting da Eixo Digital. Seu trabalho é criar mensagens curtas, persuanivas e amigáveis para abordagem via WhatsApp comercial.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Erro HTTP ${response.status} na OpenAI: ${errText}`
      }, { status: response.status });
    }

    const data = await response.json();
    const mensagemGerada = data.choices?.[0]?.message?.content?.trim();

    if (!mensagemGerada) {
      return NextResponse.json({ success: false, error: 'OpenAI retornou conteúdo vazio.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      text: mensagemGerada
    });

  } catch (err: any) {
    console.error('Erro na API Server-Side da OpenAI:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Erro de conexão com o servidor da OpenAI.'
    }, { status: 500 });
  }
}
