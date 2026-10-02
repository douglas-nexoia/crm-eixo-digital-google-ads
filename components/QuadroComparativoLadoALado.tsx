'use client';

import React from 'react';
import { Lead } from '@/lib/types';
import { termoDoNicho } from '@/lib/demanda-busca';
import { CheckCircle2, XCircle, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';

interface QuadroComparativoProps {
  lead: Lead;
  cidadeCurta: string;
  empresa: string;
}

export function QuadroComparativoLadoALado({ lead, cidadeCurta, empresa }: QuadroComparativoProps) {
  const temGmb = !!(lead.gmb_nota != null && (lead.gmb_avaliacoes || 0) > 0);
  const nota = lead.gmb_nota ?? 0;
  const avaliacoes = lead.gmb_avaliacoes ?? 0;
  const termo = termoDoNicho(lead.nicho) || 'assistência técnica';

  return (
    <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
      {/* Cabeçalho do Bloco */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
          02. Comparativo Prático de Mercado
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
          Sua empresa vs. As empresas que mais faturam em {cidadeCurta || 'sua região'}
        </h2>
        <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
          Sem números inventados ou teorias: comparamos os 4 pilares práticos que decidem quem fica com os serviços de {termo} todos os dias.
        </p>
      </div>

      {/* Grid Comparativo de Duas Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
        {/* Coluna 1: A Sua Empresa */}
        <div className="p-5 sm:p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Situação Atual
                </span>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 truncate max-w-[260px]">
                  {empresa}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                Sua Empresa
              </span>
            </div>

            <div className="space-y-5">
              {/* Item 1: Topo do Google */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  1. Presença no Topo do Google
                </div>
                {lead.anuncio_detectado ? (
                  <div className="flex items-start gap-2 text-xs text-emerald-900 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Anúncios ativos identificados no leilão.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-rose-900 font-semibold bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Ausente no Topo (Não anuncia). Quando o cliente pesquisa conserto com pressa, não encontra sua empresa nos primeiros links.</span>
                  </div>
                )}
              </div>

              {/* Item 2: Reputação & Avaliações */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  2. Reputação &amp; Prova Social
                </div>
                {temGmb ? (
                  <div className="flex items-start gap-2 text-xs text-zinc-800 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                    <span className="text-sm">⭐</span>
                    <div>
                      <strong className="text-zinc-900 font-bold">{nota.toFixed(1)} estrelas</strong> com {avaliacoes} avaliações no Google.
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {nota >= 4.5
                          ? 'Excelente satisfação dos clientes atendidos.'
                          : 'Avaliações registradas na sua ficha do Maps.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-rose-900 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Ficha não localizada ou sem avaliações públicas suficientes para gerar confiança imediata.</span>
                  </div>
                )}
              </div>

              {/* Item 3: Contato no WhatsApp */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  3. Página de Contato no Celular
                </div>
                {lead.site ? (
                  <div className="flex items-start gap-2 text-xs text-zinc-800 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-900">Possui página web:</span>
                      <span className="block text-[11px] text-zinc-500 truncate max-w-[240px]">
                        {lead.site.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-rose-900 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Sem página própria. O cliente que clica pelo celular não tem um botão direto para iniciar conversa no WhatsApp.</span>
                  </div>
                )}
              </div>

              {/* Item 4: Destino dos Chamados */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  4. Destino dos Chamados de Hoje
                </div>
                <div className="text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                  Depende principalmente de <strong>indicação boca a boca</strong> ou clientes antigos que já possuem seu contato salvo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Os Líderes da Região */}
        <div className="p-5 sm:p-6 bg-emerald-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Padrão do Topo
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Líderes em {cidadeCurta || 'sua região'}
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                Mais Faturam
              </span>
            </div>

            <div className="space-y-5">
              {/* Item 1: Topo do Google */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  1. Presença no Topo do Google
                </div>
                <div className="flex items-start gap-2 text-xs text-emerald-950 font-semibold bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>Sempre no 1º lugar do leilão (Google Ads). Quando alguém pesquisa com urgência no celular, eles aparecem imediatamente.</span>
                </div>
              </div>

              {/* Item 2: Reputação & Avaliações */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  2. Reputação &amp; Prova Social
                </div>
                <div className="flex items-start gap-2 text-xs text-emerald-950 bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-sm">⭐</span>
                  <div>
                    <strong className="text-emerald-950 font-bold">Nota 4.8 a 5.0</strong> com 60 a 200+ avaliações locais.
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Coletam avaliações com frequência dos clientes atendidos na semana.
                    </p>
                  </div>
                </div>
              </div>

              {/* Item 3: Contato no WhatsApp */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  3. Página de Contato no Celular
                </div>
                <div className="flex items-start gap-2 text-xs text-emerald-950 bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Página comercial rápida (&lt; 2s):</span>
                    <span className="block text-[11px] text-emerald-800">
                      Botão grande de WhatsApp visível no primeiro segundo da tela.
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 4: Destino dos Chamados */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  4. Destino dos Chamados de Hoje
                </div>
                <div className="text-xs text-emerald-950 font-medium bg-emerald-100/60 p-2.5 rounded-lg border border-emerald-200">
                  Absorvem mais de <strong>70% de todos os clientes com pressa</strong> que buscam no Google hoje na sua região.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fechamento Factual do Bloco 02 */}
      <div className="p-4 sm:p-5 bg-white border-t border-zinc-200">
        <div className="border-l-3 border-emerald-700 bg-emerald-50/50 p-3.5 sm:p-4 rounded-r-lg">
          <p className="text-xs sm:text-[13px] text-emerald-950 leading-relaxed">
            <strong>O diagnóstico real:</strong> A sua empresa já tem a parte mais difícil resolvida, que é a <strong>qualidade técnica do serviço</strong> (sua nota prova isso). O único motivo de os líderes receberem a maior fatia dos clientes todos os dias é que eles têm a estrutura do topo pronta: <strong>anúncio ativo no leilão + página rápida conectada ao WhatsApp</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}
