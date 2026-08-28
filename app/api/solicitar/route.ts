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

async function consultarPageSpeedEdge(urlBruta: string) {
  try {
    let url = urlBruta.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const apiKey =
      process.env.GOOGLE_PAGESPEED_API_KEY ||
      'AIzaSyBV3ip3kdalaj8yrnJEyCqW7QGBqr_bRGM';

    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=mobile&category=performance&key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout seguro

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const lh = data.lighthouseResult || {};
    const categorias = lh.categories || {};
    const audits = lh.audits || {};

    const scoreBruto = categorias.performance?.score;
    const score = scoreBruto != null ? Math.round(scoreBruto * 100) : null;

    const lcpMs = audits['largest-contentful-paint']?.numericValue;
    const lcp_segundos = lcpMs != null ? Number((lcpMs / 1000).toFixed(2)) : null;

    let status = 'Bom';
    if (lcp_segundos != null) {
      if (lcp_segundos <= 2.5 && (score ?? 0) >= 80) status = 'Excelente';
      else if (lcp_segundos <= 3.5) status = 'Bom';
      else if (lcp_segundos <= 4.5 || (score ?? 0) < 50) status = 'Moderado';
      else status = 'Crítico';
    }

    return {
      url,
      score,
      lcp_segundos,
      status,
    };
  } catch (err) {
    console.warn('PageSpeed Edge timeout or error:', err);
    return null;
  }
}

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

    // 2. Rodar auditoria ao vivo do Google PageSpeed se houver site informado
    let psResult = null;
    let siteFinal = site ? site.trim() : null;

    if (siteFinal && siteFinal.length > 3) {
      if (!siteFinal.startsWith('http://') && !siteFinal.startsWith('https://')) {
        siteFinal = `https://${siteFinal}`;
      }
      psResult = await consultarPageSpeedEdge(siteFinal);
    }

    const scoreDetalhes: string[] = ['Lead Inbound via Formulário de Anúncio'];
    let resumoPageSpeed = 'Sem site informado';
    let siteHttps = false;
    let siteResponsivo = false;

    if (siteFinal) {
      siteHttps = siteFinal.startsWith('https://');
      if (psResult) {
        siteResponsivo = true;
        resumoPageSpeed = `Score ${psResult.score}/100 | LCP: ${psResult.lcp_segundos}s (${psResult.status})`;
        if (psResult.lcp_segundos && psResult.lcp_segundos > 3.5) {
          scoreDetalhes.push(`Site Mobile Lento (${psResult.lcp_segundos}s no Google PageSpeed)`);
        } else if (psResult.score && psResult.score >= 80) {
          scoreDetalhes.push(`Site Rápido no Celular (Score ${psResult.score}/100)`);
        }
      } else {
        resumoPageSpeed = `Site cadastrado: ${siteFinal}`;
      }
    }

    // 3. Criar registro na tabela buscas
    const { data: busca } = await supabase
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
          pagespeed: psResult,
        },
      })
      .select('id')
      .single();

    const buscaId = busca?.id || null;

    // 4. Inserir lead no Supabase com os dados reais de PageSpeed
    const payloadLead = {
      busca_id: buscaId,
      nicho: nichoFinal,
      cidade,
      nome,
      telefone: telLimpo,
      site: siteFinal || null,
      gmb_nota: null,
      gmb_avaliacoes: null,
      gmb_verificado: false,
      site_https: siteHttps,
      site_responsivo: siteResponsivo,
      score_pontos: psResult?.score ? Math.round((psResult.score * 0.4) + 20) : 40,
      score_nivel: psResult?.score && psResult.score >= 70 ? 'alto' : 'medio',
      score_detalhes: scoreDetalhes,
      posicao_maps: 4,
      status_funil: 'Novo',
      slug,
      notas: `[FORMULÁRIO INBOUND] Solicitado via página web.\nWhatsApp: ${telLimpo}\nSite: ${siteFinal || 'Não informado'}\nPageSpeed Mobile: ${resumoPageSpeed}`,
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

    // 5. Disparar notificação pelo WhatsApp via Edge Function autenticada
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
      pagespeed: psResult,
    });
  } catch (err: any) {
    console.error('Erro na API de solicitação:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao processar a solicitação.' },
      { status: 500 }
    );
  }
}
