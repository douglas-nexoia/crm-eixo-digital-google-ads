-- ============================================================================
-- Passo 2 — Fecha a leitura e a escrita públicas da tabela `leads`
-- ============================================================================
--
-- PROBLEMA
-- A tabela `leads` tem hoje duas policies com USING (true):
--
--   "Leitura pública de diagnósticos"    SELECT  qual=true
--   "Permitir update em leads para anon" UPDATE  qual=true / with_check=true
--
-- Como a anon key é pública por design e viaja no bundle de toda página
-- (inclusive nos diagnósticos enviados a prospects), qualquer pessoa consegue
-- ler os 147 registros — nome, telefone, notas comerciais — e alterar
-- qualquer um deles.
--
-- PRÉ-REQUISITO
-- O login precisa estar funcionando. Estas duas policies são o que mantém o
-- CRM operante sem sessão; removê-las antes da autenticação existir deixaria
-- você sem o acesso antigo e sem o novo.
--
-- ORDEM DE EXECUÇÃO — importante, são duas fases separadas
--
-- Rodar tudo de uma vez derruba o diagnóstico durante os minutos do deploy:
-- o código novo lê a view, o código antigo lê a tabela, e um dos dois estaria
-- sempre quebrado no intervalo. Em duas fases o corte é sem downtime:
--
--   FASE A (abaixo)  — cria a view. Puramente aditivo, nada deixa de funcionar.
--   → deploy do código novo, que passa a ler a view
--   → confirme um diagnóstico abrindo em aba anônima
--   FASE B (no fim)  — derruba as policies abertas. É aqui que o buraco fecha.
--
-- Se algo der errado entre A e B, nada foi perdido: o estado antigo segue
-- válido e é só não rodar a fase B.
-- ============================================================================


-- ============================================================================
-- FASE A — criar a view (rodar AGORA, antes do deploy)
-- ============================================================================
-- Janela estreita para o relatório que vai ao prospect: apenas as 12 colunas
-- que a página realmente renderiza.
--
-- Ficam de fora, e deixam de ser públicos:
--   telefone, instagram, facebook  — canais de contato
--   status_funil, notas, data_contato, mensagem_sugerida, mensagem_editada
--                                  — dado comercial interno do funil
--
-- nicho/cidade saem resolvidos via coalesce com `buscas`, o que de quebra
-- elimina o fallback `lead.nicho || lead.buscas?.nicho` do frontend.

create or replace view public.diagnosticos_publicos as
select
  l.id,
  l.slug,
  l.nome,
  coalesce(l.nicho,  b.nicho)  as nicho,
  coalesce(l.cidade, b.cidade) as cidade,
  l.site,
  l.gmb_nota,
  l.gmb_avaliacoes,
  l.posicao_maps,
  l.score_pontos,
  l.score_nivel,
  l.score_detalhes,
  -- A página usa `busca_id` como porteiro antes de buscar os concorrentes
  -- (diagnostico/[id]/page.tsx:45); sem ele o comparativo vem vazio.
  -- Não é dado sensível: é só a FK da busca, e `buscas` segue fechada ao anon.
  -- Precisa ficar por último — CREATE OR REPLACE VIEW só aceita colunas novas
  -- no fim da lista.
  l.busca_id
from public.leads l
left join public.buscas b on b.id = l.busca_id;

-- A view roda com o privilégio do dono e atravessa DE PROPÓSITO o RLS de
-- `leads`. É exatamente isso que mantém o diagnóstico público funcionando
-- depois que as policies abertas caírem na fase B.
--
-- O linter do Supabase vai sinalizar "security definer view" — aqui é
-- intencional, e é seguro porque a view não expõe nenhuma coluna sensível.
alter view public.diagnosticos_publicos set (security_invoker = off);

grant select on public.diagnosticos_publicos to anon, authenticated;


-- ============================================================================
-- FASE B — fechar a tabela (rodar SÓ DEPOIS do deploy, com o diagnóstico
--          já confirmado abrindo em aba anônima)
-- ============================================================================
-- A partir daqui `leads` só responde a sessões autenticadas, via a policy
-- "Todas operações para autenticados" que já existe no banco.

drop policy if exists "Leitura pública de diagnósticos"    on public.leads;
drop policy if exists "Permitir update em leads para anon" on public.leads;

-- ============================================================================
-- VERIFICAÇÃO — rode depois e confira o resultado
-- ============================================================================
--
-- Devem sobrar apenas as policies de `authenticated`:
--
--   select tablename, policyname, cmd, qual
--   from pg_policies where schemaname = 'public';
--
-- E a view deve devolver linhas sem nenhuma coluna de contato:
--
--   select * from public.diagnosticos_publicos limit 1;
-- ============================================================================
