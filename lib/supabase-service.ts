import { supabase } from './supabase';
import { Lead, Busca } from './types';
import { gerarMensagemPadrao } from './mensagem-template';

// Reexportado para não quebrar quem já importava o client daqui.
export { supabase };

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
    gmb_avaliacoes: item.gmb?.avaliacoes ?? null,
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
    // Antes gravava um "Olá! Vi a empresa X no Google." que ia como está para
    // o prospect — e, por não ser vazio, nunca caía no template lá na frente.
    mensagem_sugerida: item.mensagem_sugerida || gerarMensagemPadrao(
      {
        nome: item.nome,
        posicao_maps: item.posicao_maps,
        gmb_nota: item.gmb?.nota ?? null,
      },
      parsedData.nicho,
      parsedData.cidade
    ),
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
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    page = 1,
    pageSize = 20,
    nicho = 'todos',
    cidade = 'todos',
    scoreNivel = 'todos',
    statusFunil = 'todos',
    buscaTexto = '',
    sortField = 'posicao_maps',
    sortOrder = 'asc'
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

    // `posicao_maps` só existe dentro de uma busca (segmento + cidade), então
    // ordenar por ela com várias cidades juntas empilha o #1 de cada uma como
    // se estivessem empatadas. Agrupar por cidade antes mantém cada ranking
    // inteiro e legível.
    if (sortField === 'posicao_maps' && cidade === 'todos') {
      query = query.order('cidade', { ascending: true, nullsFirst: false });
    }

    // A ordenação precisa acontecer aqui, sobre o conjunto filtrado inteiro.
    // Ordenar no cliente só reorganizaria as 20 linhas da página atual.
    query = query
      .order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false })
      .range(from, to);

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

    if (!leadAtual.busca_id && !nichoLead) return [];

    // Roda na rota pública do diagnóstico, então lê a view — a tabela `leads`
    // não responde mais sem sessão.
    let query = supabase
      .from('diagnosticos_publicos')
      .select('*')
      .neq('id', leadAtual.id)
      // Sem posição não existe comparativo, e um null quebraria a ordenação e
      // o cálculo de lacuna da tabela.
      .not('posicao_maps', 'is', null);

    if (leadAtual.busca_id) {
      // `posicao_maps` só tem sentido dentro da busca que a gerou: é a posição
      // naquele nicho *naquela cidade*. Comparar por nicho+cidade via ilike
      // deixa passar registros de outra busca — e o relatório do cliente exibe
      // dois "#1" lado a lado. A busca é o recorte exato.
      query = query.eq('busca_id', leadAtual.busca_id);
    } else {
      query = query.ilike('nicho', `%${nichoLead}%`);
      if (cidadeLead) {
        query = query.ilike('cidade', `%${cidadeLead}%`);
      }
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
 * Pedido de diagnóstico avançado, feito pelo prospect na página do relatório.
 *
 * Roda sem sessão, então toda a lógica sensível fica na Edge Function: aqui só
 * vai o identificador do lead. O telefone nunca sai do servidor — é o que
 * impede a instância de WhatsApp de virar relay para número arbitrário.
 */
export async function solicitarDiagnosticoAvancado(
  leadId: string
): Promise<{ success: boolean; jaSolicitado?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('solicitar-diagnostico', {
      body: { leadId },
    });

    if (error) {
      let detalhe = error.message;
      try {
        const corpo = await (error as { context?: Response }).context?.json();
        if (corpo?.error) detalhe = corpo.error;
      } catch {
        // sem corpo legível: fica o error.message
      }
      return { success: false, error: detalhe };
    }

    return data ?? { success: false, error: 'Resposta vazia do servidor.' };
  } catch (err) {
    console.error('Erro ao solicitar diagnóstico avançado:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha de conexão.',
    };
  }
}

/**
 * Leitura pública do diagnóstico.
 *
 * Usa a view `diagnosticos_publicos`, que expõe só as colunas do relatório —
 * sem telefone, redes sociais nem dado comercial do funil. É a única porta de
 * leitura sem sessão que sobrou depois do passo 2 do RLS.
 *
 * O CRM autenticado continua usando getLeadBySlugOrIdFromSupabase, que lê a
 * tabela inteira.
 */
export async function getDiagnosticoPublicoBySlugOrId(slugOrId: string): Promise<Lead | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    let query = supabase.from('diagnosticos_publicos').select('*');
    query = isUuid ? query.eq('id', slugOrId) : query.eq('slug', slugOrId);

    const { data, error } = await query.single();
    if (error || !data) return null;

    return data as Lead;
  } catch (err) {
    console.error('Erro ao buscar diagnóstico público:', err);
    return null;
  }
}

/**
 * Busca lead por ID ou por Slug (tabela completa, exige sessão autenticada)
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
    // Nada de updated_at aqui: a coluna não existe em `leads` (nem no schema
    // nem no banco). Injetá-la fazia o PostgREST rejeitar o request inteiro com
    // PGRST204, e o retorno silencioso abaixo escondia isso — toda escrita
    // desta tela falhava sem aviso.
    const payload = { ...updates };

    delete (payload as any).buscas;

    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', leadId)
      .select();

    if (error) {
      console.error('Falha ao atualizar lead no Supabase:', error.message);
      return null;
    }

    // null aqui significa que nada foi gravado. Quem chama deve checar.
    return data?.[0] || null;
  } catch (err) {
    console.error('Erro ao atualizar lead no Supabase:', err);
    return null;
  }
}

/**
 * Insere um novo lead manualmente no Supabase (Fluxo Inbound ou Auditoria Direta)
 */
export async function addLeadToSupabase(lead: Partial<Lead>): Promise<Lead | null> {
  try {
    const payload = {
      ...lead,
      slug: lead.slug || `${lead.nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString()
    };

    // Garantir que objetos aninhados de buscas não entrem no insert direto
    delete (payload as any).buscas;

    const { data, error } = await supabase
      .from('leads')
      .insert([payload])
      .select();

    if (error) {
      console.error('Erro ao inserir lead no Supabase:', error.message);
      throw error;
    }

    return (data?.[0] as Lead) || null;
  } catch (err) {
    console.error('Erro ao adicionar lead no Supabase:', err);
    return null;
  }
}

