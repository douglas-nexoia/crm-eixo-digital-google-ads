'use client';

import React from 'react';
import { Smartphone, Zap, MessageSquare } from 'lucide-react';
import { obterCenarioUrgencia } from '@/lib/cenarios-urgencia';

interface JornadaClienteUrgenteProps {
  nicho?: string | null;
  cidadeCurta: string;
  nomeEmpresa?: string | null;
}

export function JornadaClienteUrgente({ nicho, cidadeCurta, nomeEmpresa }: JornadaClienteUrgenteProps) {
  const cenario = obterCenarioUrgencia(nicho, nomeEmpresa);

  return (
    <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
      {/* Cabeçalho do Bloco */}
      <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
          03. Comportamento do Consumidor
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-tight">
          Como o cliente decide quando precisa de {cenario.rotuloServico}
        </h2>
        <p className="text-sm sm:text-base text-zinc-700 mt-2 max-w-[65ch]">
          Entenda como quem está com pressa em {cidadeCurta || 'sua região'} escolhe um técnico no celular em menos de 60 segundos.
        </p>
      </div>

      {/* Sequência em 3 Etapas Visuais */}
      <div className="p-5 sm:p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Etapa 1 */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Etapa 1 · A Pane
              </span>
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                O problema acontece de repente
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {cenario.fraseDescricao}
              </p>
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Etapa 2 · A Busca no Celular
              </span>
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                Pesquisa imediata no Google
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                Digita <em>&ldquo;{cenario.termoBuscaExemplo} em {cidadeCurta || 'minha cidade'}&rdquo;</em>. Mais de <strong>70% dos cliques imediatos</strong> vão para os 2 primeiros links patrocinados do topo.
              </p>
            </div>
          </div>

          {/* Etapa 3 */}
          <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Etapa 3 · O Contato Rápido
              </span>
              <h3 className="text-base font-bold text-zinc-900 mb-1.5">
                Clica e abre o WhatsApp
              </h3>
              <p className="text-sm text-zinc-700 leading-relaxed">
                O cliente não quer formulários: quem tem botão direto para WhatsApp e boa avaliação no Maps fecha o atendimento na hora.
              </p>
            </div>
          </div>
        </div>

        {/* Fechamento Factual do Bloco 03 */}
        <div className="border-l-4 border-emerald-600 bg-emerald-50/70 p-4 sm:p-5 rounded-r-xl">
          <p className="text-sm sm:text-base text-emerald-950 font-medium leading-relaxed">
            <strong>A regra de ouro:</strong> Quem está com {cenario.fraseProblema} só chama quem está nos primeiros resultados com WhatsApp direto. Se você não aparece no topo, não concorre a esse chamado.
          </p>
        </div>
      </div>
    </section>
  );
}
