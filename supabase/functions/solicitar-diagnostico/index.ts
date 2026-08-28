// Pedido de diagnóstico avançado, disparado da página pública do relatório.
//
// Esta função é chamada SEM sessão — quem clica é o prospect, que não tem
// login. Isso a torna o único ponto do sistema onde um anônimo provoca uma
// escrita no banco e um envio de WhatsApp, então ela carrega três travas:
//
//   1. Não aceita telefone. Recebe só o id/slug do lead e busca o número no
//      servidor. O único destinatário possível é o dono daquele diagnóstico —
//      não dá para mandar mensagem para um número arbitrário, que é o que
//      transformaria a instância num relay de spam.
//   2. É idempotente. Lead já marcado devolve sucesso sem reenviar, o que mata
//      clique repetido, F5 e tentativa de loop.
//   3. Escreve dois campos e nada mais: status_funil e notas.
//
// Pior cenário de abuso: uma mensagem de confirmação para alguém que já tinha
// recebido o link. Autolimitado.
//
// A função whatsapp-send continua exigindo usuário logado — ela aceita
// telefone livre e é usada pelo CRM. As duas não se misturam de propósito.

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mesma normalização da whatsapp-send: o scraper traz o zero de tronco. */
function formatarNumero(bruto: string): string | null {
  let n = String(bruto).replace(/\D/g, '');

  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('55') && (n.length === 12 || n.length === 13)) return n;
  n = n.replace(/^0+/, '');

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
    const { leadId } = await req.json();

    if (!leadId || typeof leadId !== 'string' || leadId.length > 200) {
      return json({ success: false, error: 'Identificador inválido.' }, 400);
    }

    // Service role: a tabela `leads` não responde a anônimo, e é isso que
    // mantém o resto do CRM fechado. Aqui a chave fica no servidor e a função
    // só faz a operação estreita descrita no topo.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const campo = UUID.test(leadId) ? 'id' : 'slug';

    const { data: lead, error: erroBusca } = await supabase
      .from('leads')
      .select('id, nome, telefone, status_funil, notas')
      .eq(campo, leadId)
      .single();

    if (erroBusca || !lead) {
      return json({ success: false, error: 'Diagnóstico não encontrado.' }, 404);
    }

    // Trava 2: já pediu, não repete o envio.
    if (lead.status_funil === 'Aceitou Diagnóstico') {
      return json({ success: true, jaSolicitado: true });
    }

    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const hora = agora.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });

    const registro = `[${data} às ${hora}] CLICOU para falar no WhatsApp comercial pela página do relatório`;
    const notas = lead.notas ? `${registro}\n${lead.notas}` : registro;

    // Grava no banco: atualiza status_funil para 'Aceitou Diagnóstico'
    const { error: erroUpdate } = await supabase
      .from('leads')
      .update({ status_funil: 'Aceitou Diagnóstico', notas })
      .eq('id', lead.id);

    if (erroUpdate) {
      console.error('Falha ao registrar o pedido:', erroUpdate.message);
      return json({ success: false, error: 'Não foi possível registrar o pedido.' }, 500);
    }

    // O pedido está registrado no CRM. O cliente é redirecionado diretamente pelo navegador para o WhatsApp comercial.
    return json({ success: true, jaSolicitado: false });
  } catch (erro) {
    console.error('Falha ao solicitar diagnóstico:', erro);
    return json(
      { success: false, error: erro instanceof Error ? erro.message : 'Erro interno.' },
      500
    );
  }
});
