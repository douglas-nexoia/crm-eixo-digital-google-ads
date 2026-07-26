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

/**
 * Normaliza para o formato internacional que o WhatsApp espera.
 *
 * Os telefones vêm do scraper com o zero de tronco nacional na frente
 * ("011991053149"). Prefixar 55 sem removê-lo gera "55011991053149", que o
 * WhatsApp não resolve — é a origem do "no LID found ... from server".
 *
 * O teste de DDI é preso ao comprimento (12 ou 13) de propósito: 55 também é
 * o DDD do Rio Grande do Sul, e um celular de lá sem DDI ("55991053149", 11
 * dígitos) precisa receber o 55 na frente, não ser confundido com um número
 * que já está internacionalizado.
 */
function formatarNumero(bruto: string): string | null {
  let n = String(bruto).replace(/\D/g, '');

  if (n.startsWith('00')) n = n.slice(2);          // saída internacional 00XX
  if (n.startsWith('55') && (n.length === 12 || n.length === 13)) return n;
  n = n.replace(/^0+/, '');                        // zero de tronco

  // DDD (2) + assinante (8 fixo, 9 celular)
  return n.length === 10 || n.length === 11 ? `55${n}` : null;
}

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

    const numero = formatarNumero(telefone);

    if (!numero) {
      return json(
        { success: false, error: `Telefone em formato não reconhecido: ${telefone}` },
        400
      );
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
      console.error('Evolution GO respondeu', resposta.status, 'para', numero, texto);
      // O motivo real vem no corpo; sem ele a tela mostrava só "Erro HTTP 500"
      // e não dava para saber se era número, instância ou credencial.
      const motivo = (dados as { error?: string })?.error ?? texto.slice(0, 200);
      return json(
        {
          success: false,
          error: `Evolution recusou o envio (HTTP ${resposta.status}): ${motivo}`,
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
