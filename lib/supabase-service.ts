// Adicionando busca paginada ao serviço do Supabase
import { supabase } from './supabase';
import { Busca, Lead, ScoutJSONFormat } from './types';
import { gerarMensagemPadrao } from './mensagem-template';

export async function getBuscasFromSupabase(limit = 10): Promise<Busca[]> {
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

// Buscar leads com paginação e filtros diretamente no banco de dados (Server-Side)
export async function getLeadsPaginadosFromSupabase(params: GetLeadsParams): Promise<GetLeadsResponse> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('leads')
    .select('*, buscas(nicho, cidade)', { count: 'exact' });

  if (params.scoreNivel && params.scoreNivel !== 'todos') {
    query = query.eq('score_nivel', params.scoreNivel);
  }

  if (params.statusFunil && params.statusFunil !== 'todos') {
    query = query.eq('status_funil', params.statusFunil);
  }

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

export async function getLeadBySlugOrIdFromSupabase(slugOrId: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar lead por slug:', error);
    return null;
  }
  return data;
}

export async function updateLeadInSupabase(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar lead no Supabase:', error);
    return null;
  }
  return data;
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
