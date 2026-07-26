// Geração da mensagem de abordagem via OpenAI.
//
// Saiu da rota /api/openai/generate do Next para manter todo segredo num lugar
// só: a chave vive nos secrets do Supabase, e o Cloudflare passa a hospedar
// apenas o front.
//
// A verificação de JWT padrão do Supabase NÃO basta como autenticação: a anon
// key é um JWT válido e é pública. Sem exigir um usuário real, qualquer
// visitante do site poderia queimar os créditos da OpenAI.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Método não permitido.' }, 405);
  }

  try {
    // 1. Exige sessão de usuário real, não a anon key -------------------------
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return json({ success: false, error: 'Não autorizado.' }, 401);
    }

    // 2. Credencial ----------------------------------------------------------
    const apiKey = Deno.env.get('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      console.error('OPENAI_API_KEY não configurada nos secrets.');
      return json({ success: false, error: 'Geração por IA não configurada.' }, 500);
    }

    // 3. Entrada -------------------------------------------------------------
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return json({ success: false, error: 'Prompt é obrigatório.' }, 400);
    }

    // 4. Geração -------------------------------------------------------------
    const resposta = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um especialista em vendas B2B e copywriting da Eixo Digital. Seu trabalho é criar mensagens curtas, persuasivas e amigáveis para abordagem via WhatsApp comercial.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!resposta.ok) {
      const texto = await resposta.text();
      console.error('OpenAI respondeu', resposta.status, texto);
      return json(
        { success: false, error: `Erro HTTP ${resposta.status} na OpenAI.`, details: texto },
        resposta.status
      );
    }

    const dados = await resposta.json();
    const gerada = dados.choices?.[0]?.message?.content?.trim();

    if (!gerada) {
      return json({ success: false, error: 'OpenAI retornou conteúdo vazio.' }, 500);
    }

    return json({ success: true, text: gerada });
  } catch (erro) {
    console.error('Falha ao gerar mensagem:', erro);
    return json(
      { success: false, error: erro instanceof Error ? erro.message : 'Erro interno.' },
      500
    );
  }
});
