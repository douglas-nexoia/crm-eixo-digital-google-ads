import { createClient } from '@supabase/supabase-js';
import { Lead, Busca } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cqvixmdkjvlgoeqxbavf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRranZsZ29lcXhiYXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTE2NTIsImV4cCI6MjEwMDU2NzY1Mn0.A_8wogQgOicXzK71ju_Gqes-kXdH59IR8AVtxVAErcM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Busca Nichos e Cidades Únicos diretamente da tabela leads
 */
export async function getNichosECidadesUnicosFromSupabase() {
  try {
    const { data: leadsData, error } = await supabase
      .from('leads')
      .select('nicho, cidade');

    if (error) throw error;

    const setNichos = new Set<string>();
    const setCidades = new Set<string>();

    (leadsData || []).forEach(item => {
      if (item.nicho && item.nicho.trim()) setNichos.add(item.nicho.trim().toLowerCase());
      if (item.cidade && item.cidade.trim()) setCidades.add(item.cidade.trim().toLowerCase());
    });

    return {
      nichos: Array.from(setNichos).sort(),
      cidades: Array.from(setCidades).sort()
    };
  } catch (err) {
    console.error('Erro ao buscar nichos/cidades unicos no Supabase:', err);
    return { nichos: [], cidades: [] };
  }
}

/**
 * Busca histórico de buscas importadas
 */
export async function getBuscasFromSupabase(): Promise<Busca[]> {
  try {
    const { data, error } = await supabase
      .from('buscas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Busca[]) || [];
  } catch (err) {
    console.error('Erro ao buscar buscas no Supabase:', err);
    return [];
  }
}

/**
 * Importa dados do JSON do EIXO-SCOUT diretamente para o Supabase
 */
export async function importScoutDataToSupabase(parsedData: any) {
  const buscaId = 'busca_' + Date.now();
  
  // Insere a busca
  const { data: busca, error: buscaError } = await supabase
    .from('buscas')
    .insert([{
      id: buscaId,
      nicho: parsedData.nicho,
      cidade: parsedData.cidade,
      data_busca: parsedData.data_busca || new Date().toISOString(),
      total_encontradas: parsedData.total_encontradas || (parsedData.ranking?.length || 0),
      resumo_json: parsedData.resumo || { alto: 0, medio: 0, baixo: 0 },
      created_at: new Date().toISOString()
    }])
    .select();

  if (buscaError) throw buscaError;

  // Prepara os leads
  const leadsToInsert = (parsedData.ranking || []).map((item: any, idx: number) => ({
    id: 'lead_' + Date.now() + '_' + idx,
    busca_id: buscaId,
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
    mensagem_sugerida: item.mensagem_sugerida || `Olá! Vi a empresa ${item.nome} no Google.`,
    mensagem_editada: null,
    data_contato: null,
    notas: null,
    slug: `${item.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
    created_at: new Date().toISOString()
  }));

  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .insert(leadsToInsert)
    .select();

  if (leadsError) throw leadsError;

  return { busca: busca?.[0], leadsCount: leads?.length || 0 };
}

/**
 * Busca leads com paginação nativa e filtros no Supabase
 */
export async function getLeadsPaginadosFromSupabase(params: {
  page?: number;
  pageSize?: number;
  nicho?: string;
  cidade?: string;
  scoreNivel?: string;
  statusFunil?: string;
  buscaTexto?: string;
}) {
  const {
    page = 1,
    pageSize = 20,
    nicho = 'todos',
    cidade = 'todos',
    scoreNivel = 'todos',
    statusFunil = 'todos',
    buscaTexto = ''
  } = params;

  try {
    let query = supabase.from('leads').select('*, buscas(nicho, cidade)', { count: 'exact' });

    if (nicho !== 'todos') {
      query = query.ilike('nicho', `%${nicho}%`);
    }

    if (cidade !== 'todos') {
      query = query.ilike('cidade', `%${cidade}%`);
    }

    if (scoreNivel !== 'todos') {
      query = query.eq('score_nivel', scoreNivel);
    }

    if (statusFunil !== 'todos') {
      query = query.eq('status_funil', statusFunil);
    }

    if (buscaTexto && buscaTexto.trim() !== '') {
      query = query.ilike('nome', `%${buscaTexto.trim()}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order('posicao_maps', { ascending: true }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      leads: (data as Lead[]) || [],
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 1
    };
  } catch (err) {
    console.error('Erro ao buscar leads paginados no Supabase:', err);
    return { leads: [], totalCount: 0, totalPages: 1 };
  }
}

/**
 * Busca a lista inteira de leads para exportação ou ranking
 */
export async function getLeadsFromSupabase(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*, buscas(nicho, cidade)')
      .order('posicao_maps', { ascending: true });

    if (error) throw error;
    return (data as Lead[]) || [];
  } catch (err) {
    console.error('Erro ao buscar todos os leads do Supabase:', err);
    return [];
  }
}

/**
 * Busca os Top Concorrentes ESTREITAMENTE do mesmo nicho.
 * Se não houver concorrentes suficientes do mesmo nicho, retorna apenas os que existirem.
 * Jamais compara nichos diferentes!
 */
export async function getTopConcorrentesDoMesmoNicho(leadAtual: Lead): Promise<Lead[]> {
  try {
    const nichoLead = leadAtual.nicho || leadAtual.buscas?.nicho || '';
    const cidadeLead = leadAtual.cidade || leadAtual.buscas?.cidade || '';

    if (!nichoLead) return [];

    let query = supabase
      .from('leads')
      .select('*')
      .neq('id', leadAtual.id)
      .ilike('nicho', `%${nichoLead}%`);

    if (cidadeLead) {
      query = query.ilike('cidade', `%${cidadeLead}%`);
    }

    const { data, error } = await query
      .order('posicao_maps', { ascending: true })
      .limit(3);

    if (error) throw error;

    return (data as Lead[]) || [];
  } catch (err) {
    console.error('Erro ao buscar top concorrentes:', err);
    return [];
  }
}

/**
 * Busca lead por ID ou por Slug
 */
export async function getLeadBySlugOrIdFromSupabase(slugOrId: string): Promise<Lead | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    let query = supabase.from('leads').select('*, buscas(nicho, cidade)');
    if (isUuid) {
      query = query.eq('id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }

    const { data, error } = await query.single();
    if (error || !data) return null;

    return data as Lead;
  } catch (err) {
    console.error('Erro ao buscar lead por slug/id:', err);
    return null;
  }
}

/**
 * Atualiza um lead no Supabase
 */
export async function updateLeadInSupabase(leadId: string, updates: Partial<Lead>) {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    delete (payload as any).buscas;

    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', leadId)
      .select();

    if (error) {
      console.warn('Supabase update aviso:', error.message);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error('Erro ao atualizar lead no Supabase:', err);
    return null;
  }
}
