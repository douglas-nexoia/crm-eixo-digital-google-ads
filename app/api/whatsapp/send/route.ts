import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { telefone, mensagem } = await req.json();

    const apiUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || 'http://67.205.153.151:4000';
    const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY;
    const instance = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || process.env.EVOLUTION_INSTANCE;

    if (!apiKey || !instance) {
      return NextResponse.json(
        { success: false, error: 'Chaves da WhatsApp API não configuradas no .env' },
        { status: 400 }
      );
    }

    let numeroLimpo = (telefone || '').replace(/\D/g, '');
    if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
      numeroLimpo = '55' + numeroLimpo;
    }

    const baseUrl = apiUrl.trim().replace(/\/+$/, '');
    const instanceName = instance.trim();

    // Lista de Variações de Endpoints suportadas pela Evolution GO
    const endpointsToTry = [
      {
        url: `${baseUrl}/message/sendText/${instanceName}`,
        body: {
          number: numeroLimpo,
          textMessage: { text: mensagem },
          options: { delay: 1200, presence: 'composing' }
        }
      },
      {
        url: `${baseUrl}/message/sendText`,
        body: {
          instanceName: instanceName,
          instance: instanceName,
          number: numeroLimpo,
          textMessage: { text: mensagem },
          text: mensagem,
          options: { delay: 1200, presence: 'composing' }
        }
      },
      {
        url: `${baseUrl}/message/sendText/${instanceName}`,
        body: {
          number: numeroLimpo,
          text: mensagem,
          options: { delay: 1200, presence: 'composing' }
        }
      }
    ];

    let lastStatus = 404;
    let lastResponseText = '';

    // Testar as variações até obter sucesso ou resposta diferente de 404
    for (const item of endpointsToTry) {
      try {
        const response = await fetch(item.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey.trim(),
            'instance': instanceName
          },
          body: JSON.stringify(item.body)
        });

        lastStatus = response.status;
        lastResponseText = await response.text();

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: 'Mensagem enviada com sucesso pelo WhatsApp!'
          });
        }

        // Se o erro não for 404 (ex: 401 Unauthorized ou erro de parâmetro), quebrar o loop para retornar a mensagem real
        if (response.status !== 404) {
          break;
        }
      } catch (e) {
        console.warn(`Tentativa em ${item.url} falhou, tentando próximo...`);
      }
    }

    // Se chegou aqui, tratar o erro
    let data: any = {};
    try {
      data = JSON.parse(lastResponseText);
    } catch {}

    const msgErro = data?.response?.message || data?.message || data?.error || `Erro HTTP ${lastStatus} na Evolution GO`;

    return NextResponse.json({
      success: false,
      error: `${Array.isArray(msgErro) ? msgErro.join(', ') : String(msgErro)} (URL: ${baseUrl}, Instância: ${instanceName})`
    }, { status: lastStatus });

  } catch (err: any) {
    console.error('Erro no servidor ao enviar WhatsApp:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Erro interno ao conectar ao servidor da Evolution GO.'
    }, { status: 500 });
  }
}
