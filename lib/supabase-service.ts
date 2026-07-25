import { supabase } from './supabase';
import { Busca, Lead, ScoutJSONFormat } from './types';
import { gerarMensagemPadrao } from './mensagem-template';

// 1. Obter Nichos e Cidades Únicos diretamente da tabela 'leads' (ou 'buscas')
export async function getNichosECidadesUnicosFromSupabase(): Promise<{ nichos: string[]; cidades: string[] }> {
  try {
    const { data: leadsData } = await supabase
      .from('leads')
      .select('nicho, cidade');

    const { data: buscasData } = await supabase
      .from('buscas')
      .select('nicho, cidade');

    const nichosSet = new Set<string>();
    const cidadesSet = new Set<string>();

    if (leadsData) {
      leadsData.forEach(item => {
        if (item.nicho && item.nicho.trim()) nichosSet.add(item.nicho.trim());
        if (item.cidade && item.cidade.trim()) cidadesSet.add(item.cidade.trim());
      });
    }

    if (buscasData) {
      buscasData.forEach(item => {
        if (item.nicho && item.nicho.trim()) nichosSet.add(item.nicho.trim());
        if (item.cidade && item.cidade.trim()) cidadesSet.add(item.cidade.trim());
      });
    }

    const nichos = Array.from(nichosSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
    const cidades = Array.from(cidadesSet).filter(Boolean).sort((a, b) => a.localeCompare(b));

    return { nichos, cidades };
  } catch (err) {
    console.error('Erro ao buscar nichos e cidades únicos:', err);
    return { nichos: [], cidades: [] };
  }
}

export async function getBuscasFromSupabase(limit = 100): Promise<Busca[]> {
  const { data, error } = await supabase
    .from('buscas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar buscas no Supabase:', error);
    return [];
  }
  return data || [];
}

export interface GetLeadsParams {
  page?: number;
  pageSize?: number;
  nicho?: string;
  cidade?: string;
  scoreNivel?: string;
  statusFunil?: string;
  buscaTexto?: string;
}

export interface GetLeadsResponse {
  leads: Lead[];
  totalCount: number;
  totalPages: number;
}

// 2. Consulta Direta de Leads no Supabase usando as novas colunas 'nicho' e 'cidade'
export async function getLeadsPaginadosFromSupabase(params: GetLeadsParams): Promise<GetLeadsResponse> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' });

  // Filtro por segmento/nicho nativo da tabela leads
  if (params.nicho && params.nicho !== 'todos' && params.nicho !== 'Todos') {
    query = query.ilike('nicho', `%${params.nicho}%`);
  }

  // Filtro por cidade nativo da tabela leads
  if (params.cidade && params.cidade !== 'todos' && params.cidade !== 'Todas') {
    query = query.ilike('cidade', `%${params.cidade}%`);
  }

  // Filtro por nível de score
  if (params.scoreNivel && params.scoreNivel !== 'todos') {
    query = query.eq('score_nivel', params.scoreNivel);
  }

  // Filtro por status do funil
  if (params.statusFunil && params.statusFunil !== 'todos') {
    query = query.eq('status_funil', params.statusFunil);
  }

  // Busca por nome da empresa
  if (params.buscaTexto) {
    query = query.ilike('nome', `%${params.buscaTexto}%`);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error('Erro ao buscar leads paginados no Supabase:', error);
    return { leads: [], totalCount: 0, totalPages: 0 };
  }

  const total = count || 0;
  return {
    leads: data || [],
    totalCount: total,
    totalPages: Math.ceil(total / pageSize)
  };
}

export async function getLeadsFromSupabase(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('posicao_maps', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Erro ao buscar leads no Supabase:', error);
    return [];
  }
  return data || [];
}

// 3. Buscar os 3 melhores concorrentes do mesmo nicho e cidade diretamente na tabela 'leads'
export async function getTopConcorrentesDoMesmoNicho(leadAtual: Lead): Promise<Lead[]> {
  if (!leadAtual) return [];

  let query = supabase
    .from('leads')
    .select('*')
    .neq('id', leadAtual.id);

  if (leadAtual.nicho) {
    query = query.ilike('nicho', leadAtual.nicho);
  }
  if (leadAtual.cidade) {
    query = query.ilike('cidade', leadAtual.cidade);
  }

  const { data, error } = await query
    .order('posicao_maps', { ascending: true })
    .limit(3);

  if (error) {
    console.error('Erro ao buscar concorrentes nativos no Supabase:', error);
    return [];
  }

  return data || [];
}

export async function getLeadBySlugOrIdFromSupabase(slugOrId: string): Promise<Lead | null> {
  try {
    const { data: bySlug } = await supabase
      .from('leads')
      .select('*')
      .eq('slug', slugOrId)
      .maybeSingle();

    if (bySlug) return bySlug;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    if (isUuid) {
      const { data: byId } = await supabase
        .from('leads')
        .select('*')
        .eq('id', slugOrId)
        .maybeSingle();

      if (byId) return byId;
    }

    return null;
  } catch (err) {
    console.warn('Busca silenciosa de lead por slug/id:', err);
    return null;
  }
}

export async function updateLeadInSupabase(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase RLS bloqueou update direto:', error.message || error);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('Erro ao atualizar lead no Supabase:', err?.message || err);
    return null;
  }
}

export async function importScoutDataToSupabase(parsed: ScoutJSONFormat): Promise<{ busca: Busca; leadsCount: number }> {
  const { data: buscaData, error: buscaError } = await supabase
    .from('buscas')
    .insert({
      nicho: parsed.nicho,
      cidade: parsed.cidade,
      data_busca: parsed.data_busca || new Date().toISOString(),
      total_encontradas: parsed.total_encontradas || parsed.ranking.length,
      resumo_json: parsed.resumo || { alto: 0, medio: 0, baixo: 0 }
    })
    .select()
    .single();

  if (buscaError) throw new Error(`Erro ao criar busca no banco: ${buscaError.message}`);

  const leadsToInsert = parsed.ranking.map((item, index) => {
    const slugBase = `${item.nome}-${parsed.cidade}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}-${index}`;

    const tempLead: Partial<Lead> = {
      nome: item.nome,
      gmb_nota: item.gmb?.nota ?? null,
      posicao_maps: item.posicao_maps,
      score_detalhes: item.score?.detalhes || []
    };

    const msgSugerida = item.mensagem_sugerida || gerarMensagemPadrao(tempLead, parsed.nicho, parsed.cidade);

    return {
      busca_id: buscaData.id,
      nicho: parsed.nicho,
      cidade: parsed.cidade,
      nome: item.nome,
      telefone: item.telefone,
      site: item.site,
      gmb_nota: item.gmb?.nota ?? null,
      gmb_avaliacoes: item.gmb?.avaliacoes ?? 0,
      gmb_verificado: item.gmb?.verificado ?? false,
      site_https: item.site_auditoria?.https ?? false,
      site_responsivo: item.site_auditoria?.responsivo ?? false,
      instagram: item.redes_sociais?.instagram ?? null,
      facebook: item.redes_sociais?.facebook ?? null,
      score_pontos: item.score?.pontos ?? 0,
      score_nivel: item.score?.nivel ?? 'medio',
      score_detalhes: item.score?.detalhes ?? [],
      posicao_maps: item.posicao_maps,
      status_funil: 'Novo',
      mensagem_sugerida: msgSugerida,
      slug
    };
  });

  const { error: leadsError } = await supabase
    .from('leads')
    .insert(leadsToInsert);

  if (leadsError) throw new Error(`Erro ao salvar leads no banco: ${leadsError.message}`);

  return { busca: buscaData, leadsCount: leadsToInsert.length };
}
