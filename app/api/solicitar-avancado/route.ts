export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://cqvixmdkjvlgoeqxbavf.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRranZsZ29lcXhiYXZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDk5MTY1MiwiZXhwIjoyMTAwNTY3NjUyfQ.3zl51IFQqr2xKEdFR_nsp_RgAfI2BhrtTHMckSy3bA0';

const supabase = createClient(supabaseUrl, supabaseKey);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId } = body;

    if (!leadId || typeof leadId !== 'string' || leadId.length > 200) {
      return NextResponse.json({ success: false, error: 'Identificador inválido.' }, { status: 400 });
    }

    const campo = UUID.test(leadId) ? 'id' : 'slug';

    const { data: lead, error: erroBusca } = await supabase
      .from('leads')
      .select('id, nome, status_funil, notas')
      .eq(campo, leadId)
      .single();

    if (erroBusca || !lead) {
      return NextResponse.json({ success: false, error: 'Diagnóstico não encontrado.' }, { status: 404 });
    }

    if (lead.status_funil === 'Aceitou Diagnóstico') {
      return NextResponse.json({ success: true, jaSolicitado: true });
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

    const { error: erroUpdate } = await supabase
      .from('leads')
      .update({ status_funil: 'Aceitou Diagnóstico', notas })
      .eq('id', lead.id);

    if (erroUpdate) {
      console.error('Falha ao registrar o pedido:', erroUpdate.message);
      return NextResponse.json({ success: false, error: 'Não foi possível registrar o pedido.' }, { status: 500 });
    }

    // O pedido está registrado no CRM. O cliente é redirecionado diretamente pelo navegador para o WhatsApp comercial.
    // Nenhum envio automático de WhatsApp via Evolution é feito.
    return NextResponse.json({ success: true, jaSolicitado: false });
  } catch (erro) {
    console.error('Falha ao solicitar diagnóstico:', erro);
    return NextResponse.json(
      { success: false, error: erro instanceof Error ? erro.message : 'Erro interno.' },
      { status: 500 }
    );
  }
}
