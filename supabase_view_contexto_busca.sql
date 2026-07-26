-- ============================================================================
-- Contexto da busca no diagnóstico público
-- ============================================================================
-- Rodar no SQL Editor do Supabase antes (ou junto) do deploy.
--
-- Por que: `posicao_maps` é a posição num momento e num ponto específicos. O
-- dono do negócio vai conferir do próprio celular, logado e com outra
-- geolocalização, ver um número diferente e concluir que o relatório é
-- inventado. Declarar o termo, o local e a data da coleta é o que protege a
-- credibilidade da página inteira.
--
-- A view precisa ser recriada por completo: CREATE OR REPLACE VIEW não deixa
-- inserir coluna no meio, só acrescentar no fim. Por isso `data_busca` entra
-- como última coluna, depois de `busca_id`.

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
  l.busca_id,
  -- Data em que o robô coletou o ranking. Não é dado sensível: é o carimbo da
  -- coleta, e é justamente o que o relatório precisa mostrar.
  b.data_busca
from public.leads l
left join public.buscas b on b.id = l.busca_id;

-- Recriar a view descarta as configurações anteriores, então as duas linhas
-- abaixo precisam ser reaplicadas junto.
alter view public.diagnosticos_publicos set (security_invoker = off);

grant select on public.diagnosticos_publicos to anon, authenticated;
