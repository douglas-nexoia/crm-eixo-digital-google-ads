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
    nome TEXT NOT NULL,
    telefone TEXT,
    site TEXT,
    gmb_nota NUMERIC(3, 1),
    gmb_avaliacoes INTEGER DEFAULT 0,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de busca e filtros
CREATE INDEX IF NOT EXISTS idx_leads_nicho_cidade ON public.leads(busca_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status_funil);
CREATE INDEX IF NOT EXISTS idx_leads_score_nivel ON public.leads(score_nivel);
CREATE INDEX IF NOT EXISTS idx_leads_slug ON public.leads(slug);

-- Habilitar RLS (Row Level Security) - Leitura pública para diagnósticos, restrito para o restante
ALTER TABLE public.buscas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para public.leads
CREATE POLICY "Permitir leitura pública de diagnósticos" ON public.leads
    FOR SELECT USING (true);

CREATE POLICY "Permitir todas operações para usuários autenticados" ON public.leads
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir todas operações nas buscas para autenticados" ON public.buscas
    FOR ALL USING (auth.role() = 'authenticated');
