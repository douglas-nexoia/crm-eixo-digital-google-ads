'use client';

import React from 'react';
import { termoDoNicho } from '@/lib/demanda-busca';
import { Smartphone, Zap, MessageSquare, ArrowRight } from 'lucide-react';

interface JornadaClienteUrgenteProps {
  nicho?: string | null;
  cidadeCurta: string;
}

export function JornadaClienteUrgente({ nicho, cidadeCurta }: JornadaClienteUrgenteProps) {
  const termo = termoDoNicho(nicho) || 'assistência técnica';

  return (
    <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
      {/* Cabeçalho do Bloco */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
          03. Comportamento do Consumidor
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
          Como o cliente decide quando um aparelho quebra em {cidadeCurta || 'sua região'}
        </h2>
        <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
          Entender a cabeça da pessoa com urgência explica por que os anúncios no topo do Google decidem mais de 70% das ordens de serviço.
        </p>
      </div>

      {/* Sequência em 3 Etapas Visuais */}
      <div className="p-5 sm:p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Etapa 1 */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Etapa 1 · A Urgência
              </span>
              <h3 className="text-sm font-bold text-zinc-900 mb-1.5">
                A pane acontece de surpresa
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                A geladeira esquenta com comida dentro, o ar-condicionado para no calor ou a máquina de lavar trava cheia de água. A pessoa precisa de socorro <strong>hoje</strong>.
              </p>
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Etapa 2 · A Busca no Celular
              </span>
              <h3 className="text-sm font-bold text-zinc-900 mb-1.5">
                Pesquisa com pressa no Google
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                A pessoa digita <em>&ldquo;{termo} em {cidadeCurta || 'minha cidade'}&rdquo;</em>. Mais de <strong>70% dos cliques imediatos</strong> acontecem nos 2 primeiros links patrocinados do topo.
              </p>
            </div>
          </div>

          {/* Etapa 3 */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-sm mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Etapa 3 · O Chamado Imediato
              </span>
              <h3 className="text-sm font-bold text-zinc-900 mb-1.5">
                Clica e cai no WhatsApp
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Ninguém quer ler textos longos ou preencher formulários: quem tem um botão rápido de WhatsApp e boa reputação fecha a visita técnica na hora.
              </p>
            </div>
          </div>
        </div>

        {/* Fechamento Factual do Bloco 03 */}
        <div className="border-l-3 border-emerald-700 bg-emerald-50/50 p-3.5 sm:p-4 rounded-r-lg">
          <p className="text-xs sm:text-[13px] text-emerald-950 leading-relaxed">
            <strong>A regra de ouro do serviço local:</strong> Quem está com um aparelho quebrado em casa não pesquisa até a 10ª ou 15ª opção da lista. O cliente chama quem está nos primeiros links com um canal direto no WhatsApp. Se você não está no topo, você não concorre a esse serviço.
          </p>
        </div>
      </div>
    </section>
  );
}
