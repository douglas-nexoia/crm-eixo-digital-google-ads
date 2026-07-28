-- ============================================================================
-- Novo estágio do funil: "Diagnóstico Enviado"
-- ============================================================================
-- Rodar no SQL Editor do Supabase ANTES do deploy. Sem isto, o CHECK rejeita
-- a gravação e o envio do diagnóstico falha ao salvar o status.
--
-- Por que: até agora, enviar o link marcava o lead como "Aceitou Diagnóstico".
-- Mas enviar é ação sua — o prospect não aceitou nada. O funil contava o seu
-- próprio clique como conversão, e o número do dashboard media esforço, não
-- resultado.
--
-- A partir daqui:
--   Contatado           -> abordagem enviada        (ação sua)
--   Diagnóstico Enviado -> link do relatório enviado (ação sua)
--   Aceitou Diagnóstico -> pediu a análise avançada  (ação do prospect)
--
-- "Aceitou Diagnóstico" passa a ser o único estágio movido por quem está do
-- outro lado, e por isso o único que mede de verdade.

alter table public.leads
  drop constraint if exists leads_status_funil_check;

alter table public.leads
  add constraint leads_status_funil_check
  check (status_funil in (
    'Novo',
    'Contatado',
    'Diagnóstico Enviado',
    'Aceitou Diagnóstico',
    'Em Negociação',
    'Cliente',
    'Descartado'
  ));

-- ----------------------------------------------------------------------------
-- Reclassificação dos registros existentes
-- ----------------------------------------------------------------------------
-- Todo lead hoje marcado como "Aceitou Diagnóstico" chegou lá pelo envio do
-- link, não por um pedido do prospect — a tela de pedido ainda não existia.
-- Mantê-los onde estão inflaria a nova métrica logo na estreia.
--
-- Confira antes de rodar:
--   select id, nome, status_funil from public.leads
--   where status_funil = 'Aceitou Diagnóstico';

update public.leads
set status_funil = 'Diagnóstico Enviado'
where status_funil = 'Aceitou Diagnóstico';
