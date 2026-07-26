// Envio de WhatsApp via Evolution GO.
//
// Por que mora aqui e não numa rota do Next: o Cloudflare Workers recusa
// fetch para endereço IP literal (devolve "error code: 1003", Direct IP Access
// Not Allowed), e o Evolution responde em http://<ip>:4000. O runtime Deno do
// Supabase não tem essa restrição — medido em 231ms na sonda.
//
// A verificação de JWT padrão do Supabase NÃO basta como autenticação: a anon
// key é um JWT válido e é pública. Por isso exigimos abaixo um usuário de
// verdade, senão qualquer visitante do site poderia disparar mensagens pela
// instância.

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
    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return json({ success: false, error: 'Não autorizado.' }, 401);
    }

    // 2. Credenciais ---------------------------------------------------------
    const apiUrl = Deno.env.get('EVOLUTION_API_URL')?.trim();
    const apiKey = Deno.env.get('EVOLUTION_API_KEY')?.trim();
    const instancia = Deno.env.get('EVOLUTION_INSTANCE')?.trim();

    if (!apiUrl || !apiKey || !instancia) {
      console.error('Faltam EVOLUTION_API_URL, EVOLUTION_API_KEY ou EVOLUTION_INSTANCE.');
      return json({ success: false, error: 'Integração de WhatsApp não configurada.' }, 500);
    }

    // 3. Entrada -------------------------------------------------------------
    const { telefone, mensagem } = await req.json();

    if (!telefone || !mensagem) {
      return json({ success: false, error: 'Telefone e mensagem são obrigatórios.' }, 400);
    }

    let numero = String(telefone).replace(/\D/g, '');
    if (!numero.startsWith('55') && numero.length >= 10) {
      numero = `55${numero}`;
    }

    // 4. Envio ---------------------------------------------------------------
    const base = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    const resposta = await fetch(`${base}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ instance: instancia, number: numero, text: mensagem }),
    });

    const texto = await resposta.text();
    let dados: unknown;
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = { raw: texto };
    }

    if (!resposta.ok) {
      console.error('Evolution GO respondeu', resposta.status, texto);
      return json(
        {
          success: false,
          error: `Erro HTTP ${resposta.status} na Evolution GO.`,
          details: texto,
        },
        resposta.status
      );
    }

    return json({
      success: true,
      message: 'Mensagem enviada com sucesso pelo WhatsApp!',
      data: dados,
    });
  } catch (erro) {
    console.error('Falha no envio de WhatsApp:', erro);
    return json(
      { success: false, error: erro instanceof Error ? erro.message : 'Erro interno.' },
      500
    );
  }
});
