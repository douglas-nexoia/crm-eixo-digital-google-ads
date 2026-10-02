'use client';

import React from 'react';
import { Lead } from '@/lib/types';
import { obterCenarioUrgencia } from '@/lib/cenarios-urgencia';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface QuadroComparativoProps {
  lead: Lead;
  cidadeCurta: string;
  empresa: string;
}

export function QuadroComparativoLadoALado({ lead, cidadeCurta, empresa }: QuadroComparativoProps) {
  const temGmb = !!(lead.gmb_nota != null && (lead.gmb_avaliacoes || 0) > 0);
  const nota = lead.gmb_nota ?? 0;
  const avaliacoes = lead.gmb_avaliacoes ?? 0;
  const cenario = obterCenarioUrgencia(lead.nicho, empresa);
  const termo = cenario.rotuloServico;

  return (
    <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
      {/* Cabeçalho do Bloco */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
          02. Comparativo Prático de Mercado
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
          Sua empresa vs. Quem mais fatura em {cidadeCurta || 'sua região'}
        </h2>
        <p className="text-sm sm:text-base text-zinc-700 mt-2 max-w-[65ch]">
          Sem teorias: veja os 4 pilares práticos que decidem quem fica com os serviços de {termo} todos os dias.
        </p>
      </div>

      {/* Grid Comparativo de Duas Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
        {/* Coluna 1: A Sua Empresa */}
        <div className="p-5 sm:p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Situação Atual
                </span>
                <h3 className="text-base sm:text-lg font-black text-zinc-900 truncate max-w-[260px]">
                  {empresa}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                Sua Empresa
              </span>
            </div>

            <div className="space-y-4">
              {/* Item 1: Topo do Google */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  1. Presença no Topo do Google
                </div>
                {lead.anuncio_detectado ? (
                  <div className="flex items-start gap-2.5 text-sm text-emerald-900 font-semibold bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Anúncios ativos identificados no leilão.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-sm text-rose-900 bg-rose-50/70 p-3 rounded-lg border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Ausente no topo.</strong> Quem pesquisa socorro no celular não encontra sua assistência nos primeiros links.</span>
                  </div>
                )}
              </div>

              {/* Item 2: Reputação & Avaliações */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  2. Reputação &amp; Prova Social
                </div>
                {temGmb ? (
                  <div className="flex items-start gap-2.5 text-sm text-zinc-800 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <span className="text-base">⭐</span>
                    <div>
                      <strong className="text-zinc-900 font-bold">{nota.toFixed(1)} estrelas</strong> ({avaliacoes} avaliações no Google).
                      <span className="text-xs text-zinc-500 block mt-0.5">
                        {nota >= 4.5
                          ? 'Excelente satisfação dos clientes atendidos.'
                          : 'Avaliações registradas na sua ficha do Maps.'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-sm text-rose-900 bg-rose-50/70 p-3 rounded-lg border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Sem avaliações públicas suficientes no Maps para gerar confiança imediata no celular.</span>
                  </div>
                )}
              </div>

              {/* Item 3: Contato no WhatsApp */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  3. Página de Contato no Celular
                </div>
                {lead.site ? (
                  <div className="flex items-start gap-2.5 text-sm text-zinc-800 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-900">Possui página web:</span>
                      <span className="block text-xs text-zinc-500 truncate max-w-[240px]">
                        {lead.site.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-sm text-rose-900 bg-rose-50/70 p-3 rounded-lg border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Sem página própria.</strong> O cliente não tem um botão direto para iniciar conversa no WhatsApp.</span>
                  </div>
                )}
              </div>

              {/* Item 4: Destino dos Chamados */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  4. Destino dos Chamados de Hoje
                </div>
                <div className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  Depende principalmente de <strong>indicação boca a boca</strong> ou clientes que já possuem seu contato salvo.
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
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  Padrão do Topo
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Líderes em {cidadeCurta || 'sua região'}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                Mais Faturam
              </span>
            </div>

            <div className="space-y-4">
              {/* Item 1: Topo do Google */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  1. Presença no Topo do Google
                </div>
                <div className="flex items-start gap-2.5 text-sm text-emerald-950 bg-emerald-100/60 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span><strong>Sempre nas 2 primeiras posições.</strong> Aparecem no exato instante em que o cliente pesquisa no celular.</span>
                </div>
              </div>

              {/* Item 2: Reputação & Avaliações */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  2. Reputação &amp; Prova Social
                </div>
                <div className="flex items-start gap-2.5 text-sm text-emerald-950 bg-emerald-100/60 p-3 rounded-lg border border-emerald-200">
                  <span className="text-base">⭐</span>
                  <div>
                    <strong className="text-emerald-950 font-bold">Nota 4.8 a 5.0</strong> com 60 a 200+ avaliações locais ativas.
                    <span className="text-xs text-emerald-800 block mt-0.5">
                      Coletam avaliações com frequência dos clientes atendidos na semana.
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 3: Contato no WhatsApp */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  3. Página de Contato no Celular
                </div>
                <div className="flex items-start gap-2.5 text-sm text-emerald-950 bg-emerald-100/60 p-3 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Página rápida (&lt; 1s):</strong>
                    <span className="block text-xs text-emerald-800">
                      Botão grande de WhatsApp visível no primeiro segundo da tela.
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 4: Destino dos Chamados */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  4. Destino dos Chamados de Hoje
                </div>
                <div className="text-sm text-emerald-950 font-medium bg-emerald-100/60 p-3 rounded-lg border border-emerald-200">
                  Absorvem mais de <strong>70% de todos os novos chamados com urgência</strong> que buscam no Google hoje.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fechamento Factual do Bloco 02 */}
      <div className="p-4 sm:p-5 bg-white border-t border-zinc-200">
        <div className="border-l-4 border-emerald-600 bg-emerald-50/70 p-4 sm:p-5 rounded-r-xl">
          <p className="text-sm sm:text-base text-emerald-950 font-medium leading-relaxed">
            <strong>O diagnóstico real:</strong> A sua empresa já tem a qualidade técnica comprovada. O que separa você dos líderes é apenas a estrutura do topo: <strong>anúncio ativo no leilão + página rápida com WhatsApp direto</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}
