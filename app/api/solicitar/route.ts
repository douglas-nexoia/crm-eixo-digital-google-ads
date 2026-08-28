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

    // 4. Disparar notificação pelo WhatsApp via Edge Function autenticada
    try {
      const msgWhatsApp = `Olá! Tudo bem? Aqui é o Douglas da Eixo Digital.\n\nRecebi sua solicitação de diagnóstico gratuito para a *${nome}* em ${cidade}.\n\nSeu laudo de posicionamento no Google e estimativa de retorno em anúncios já está pronto:\n👉 ${urlDiagnostico}\n\nDá uma olhada e qualquer dúvida me chama aqui!`;

      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: 'suporte.eixodigital@gmail.com',
      });

      if (linkData?.properties?.hashed_token) {
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRranZsZ29lcXhiYXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTE2NTIsImV4cCI6MjEwMDU2NzY1Mn0.A_8wogQgOicXzK71ju_Gqes-kXdH59IR8AVtxVAErcM';
        const publicClient = createClient(supabaseUrl, anonKey);
        const { data: sessionData } = await publicClient.auth.verifyOtp({
          token_hash: linkData.properties.hashed_token,
          type: 'magiclink',
        });

        const token = sessionData?.session?.access_token;
        if (token) {
          const authedClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });

          await authedClient.functions.invoke('whatsapp-send', {
            body: { telefone: telLimpo, mensagem: msgWhatsApp },
          });
        }
      }
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
