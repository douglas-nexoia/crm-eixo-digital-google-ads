export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, cidade, nicho, telefone, site } = body;

    if (!nome || !cidade || !telefone) {
      return NextResponse.json(
        { success: false, error: 'Nome da empresa, cidade e WhatsApp são obrigatórios.' },
        { status: 400 }
      );
    }

    const nichoFinal = nicho || 'Assistência Técnica de Eletrodomésticos';
    const telLimpo = telefone.replace(/\D/g, '');

    // 1. Gerar slug padronizado
    const normalizarSlug = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const slugBase = `${normalizarSlug(nome)}-${normalizarSlug(cidade)}`;
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    // 2. Criar registro na tabela buscas
    const { data: busca, error: buscaErr } = await supabase
      .from('buscas')
      .insert({
        nicho: nichoFinal,
        cidade,
        data_busca: new Date().toISOString(),
        total_encontradas: 1,
        resumo_json: {
          tipo: 'inbound_form',
          origem: 'Inbound - Formulário Instagram/Web',
          empresa_alvo: nome,
        },
      })
      .select('id')
      .single();

    const buscaId = busca?.id || null;

    // 3. Inserir ou atualizar lead no Supabase
    const payloadLead = {
      busca_id: buscaId,
      nicho: nichoFinal,
      cidade,
      nome,
      telefone: telLimpo,
      site: site || null,
      gmb_nota: null,
      gmb_avaliacoes: null,
      gmb_verificado: false,
      site_https: site ? site.startsWith('https://') : false,
      site_responsivo: false,
      score_pontos: 40,
      score_nivel: 'medio',
      score_detalhes: ['Lead Inbound via Formulário de Anúncio'],
      posicao_maps: 4,
      status_funil: 'Novo',
      slug,
      notas: `[FORMULÁRIO INBOUND] Solicitado via página web.\nWhatsApp: ${telLimpo}\nSite: ${site || 'Não informado'}`,
      created_at: new Date().toISOString(),
    };

    const { data: novoLead, error: leadErr } = await supabase
      .from('leads')
      .insert(payloadLead)
      .select('id, slug')
      .single();

    if (leadErr) {
      console.error('Erro ao salvar lead:', leadErr);
    }

    const urlDiagnostico = `https://crm.eixodigitalbr.com.br/diagnostico/${slug}`;

    // 4. Disparar notificação pelo WhatsApp via Edge Function (se configurada)
    try {
      const msgWhatsApp = `Olá! Tudo bem? Aqui é o Douglas da Eixo Digital.\n\nRecebi sua solicitação de diagnóstico gratuito para a *${nome}* em ${cidade}.\n\nSeu laudo de posicionamento no Google e estimativa de retorno em anúncios já está pronto:\n👉 ${urlDiagnostico}\n\nDá uma olhada e qualquer dúvida me chama aqui!`;
      
      await supabase.functions.invoke('whatsapp-send', {
        body: { telefone: telLimpo, mensagem: msgWhatsApp },
      }).catch(() => {});
    } catch (e) {
      console.warn('Aviso no envio automático de WhatsApp:', e);
    }

    return NextResponse.json({
      success: true,
      slug,
      urlDiagnostico,
      leadId: novoLead?.id,
    });
  } catch (err: any) {
    console.error('Erro na API de solicitação:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao processar a solicitação.' },
      { status: 500 }
    );
  }
}
