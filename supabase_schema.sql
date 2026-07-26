-- Script de criação das tabelas no Supabase Postgres para o CRM Eixo Digital

-- Tabela de Buscas (Registros de coletas do EIXO-SCOUT)
CREATE TABLE IF NOT EXISTS public.buscas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nicho TEXT NOT NULL,
    cidade TEXT NOT NULL,
    data_busca TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_encontradas INTEGER DEFAULT 0,
    resumo_json JSONB,
    arquivo_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Leads (Empresas encontradas e auditadas)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    busca_id UUID REFERENCES public.buscas(id) ON DELETE CASCADE,
    -- Desnormalizados de `buscas`: o CRM filtra e ordena por eles direto, e a
    -- view pública do diagnóstico precisa deles sem poder ler `buscas`.
    nicho TEXT,
    cidade TEXT,
    nome TEXT NOT NULL,
    telefone TEXT,
    site TEXT,
    gmb_nota NUMERIC(3, 1),
    -- Sem DEFAULT: NULL significa "não coletado", distinto de 0 avaliações reais.
    gmb_avaliacoes INTEGER,
    gmb_verificado BOOLEAN DEFAULT FALSE,
    site_https BOOLEAN DEFAULT FALSE,
    site_responsivo BOOLEAN DEFAULT FALSE,
    instagram TEXT,
    facebook TEXT,
    score_pontos INTEGER DEFAULT 0,
    score_nivel TEXT CHECK (score_nivel IN ('baixo', 'medio', 'alto')),
    score_detalhes TEXT[],
    posicao_maps INTEGER,
    status_funil TEXT DEFAULT 'Novo' CHECK (status_funil IN ('Novo', 'Contatado', 'Aceitou Diagnóstico', 'Em Negociação', 'Cliente', 'Descartado')),
    mensagem_sugerida TEXT,
    mensagem_editada TEXT,
    data_contato TIMESTAMP WITH TIME ZONE,
    notas TEXT,
    slug TEXT UNIQUE,
    -- Não existe `updated_at` aqui, e é proposital. O código já tentou gravar
    -- essa coluna e o PostgREST rejeitava toda escrita com PGRST204 — em
    -- silêncio, porque o erro era engolido. Se um dia ela for desejada, crie a
    -- coluna antes de voltar a enviá-la.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de busca e filtros
CREATE INDEX IF NOT EXISTS idx_leads_nicho_cidade ON public.leads(busca_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status_funil);
CREATE INDEX IF NOT EXISTS idx_leads_score_nivel ON public.leads(score_nivel);
CREATE INDEX IF NOT EXISTS idx_leads_slug ON public.leads(slug);

-- ============================================================================
-- RLS — reconciliado com o banco em 2026-07-26
-- ============================================================================
-- ATENÇÃO: este arquivo já divergiu do banco no passado, e os nomes das
-- policies aqui não batiam com os reais. Antes de escrever qualquer migration,
-- confirme o estado corrente com:
--
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'public';
--
-- Trate o retorno dessa consulta como a verdade, não este arquivo.
-- ============================================================================

ALTER TABLE public.buscas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Ambas as tabelas só respondem a sessões autenticadas. Não há acesso anônimo:
-- a anon key é pública por design e viaja no bundle de toda página, então
-- qualquer policy aberta aqui equivale a expor a base inteira na internet.
CREATE POLICY "Todas operações para autenticados" ON public.leads
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Todas operações nas buscas para autenticados" ON public.buscas
    FOR ALL USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Janela pública do diagnóstico
-- ----------------------------------------------------------------------------
-- O relatório em /diagnostico/[id] vai por WhatsApp para o prospect, que não
-- tem login. Em vez de abrir a tabela, ele lê esta view — que expõe só as
-- colunas do relatório e deixa de fora telefone, redes sociais e todo o dado
-- comercial do funil (status_funil, notas, data_contato, mensagens).
--
-- A view roda com o privilégio do dono e atravessa de propósito o RLS de
-- `leads`; é isso que a mantém legível sem sessão. O linter do Supabase
-- sinaliza "security definer view", e aqui é intencional.

CREATE OR REPLACE VIEW public.diagnosticos_publicos AS
SELECT
    l.id,
    l.slug,
    l.nome,
    COALESCE(l.nicho,  b.nicho)  AS nicho,
    COALESCE(l.cidade, b.cidade) AS cidade,
    l.site,
    l.gmb_nota,
    l.gmb_avaliacoes,
    l.posicao_maps,
    l.score_pontos,
    l.score_nivel,
    l.score_detalhes,
    l.busca_id
FROM public.leads l
LEFT JOIN public.buscas b ON b.id = l.busca_id;

ALTER VIEW public.diagnosticos_publicos SET (security_invoker = off);

GRANT SELECT ON public.diagnosticos_publicos TO anon, authenticated;
