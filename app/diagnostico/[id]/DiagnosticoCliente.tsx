'use client';

import React, { useState, useEffect } from 'react';
import {
  getDiagnosticoPublicoBySlugOrId,
  solicitarDiagnosticoAvancado,
} from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { termoDoNicho } from '@/lib/demanda-busca';
import {
  AlertTriangle, MessageCircle, ArrowUpRight, CheckCircle2,
  Printer, ShieldCheck, Clock, Zap, Wrench, Check
} from 'lucide-react';
import { SolicitarDiagnostico } from '@/components/SolicitarDiagnostico';
import { MapaRaioAtendimento } from '@/components/MapaRaioAtendimento';
import { QuadroComparativoLadoALado } from '@/components/QuadroComparativoLadoALado';
import { JornadaClienteUrgente } from '@/components/JornadaClienteUrgente';

/**
 * Nome curto para exibição amigável sem poluir a diagramação.
 */
function nomeCurto(nome: string): string {
  const antesDoSufixo = nome.split(/\s[-–—|]\s/)[0].trim();
  const base = antesDoSufixo.length >= 3 ? antesDoSufixo : nome.trim();
  return base.length > 40 ? `${base.slice(0, 40).trim()}…` : base;
}

export default function DiagnosticoCliente({ slug }: { slug: string }) {
  const slugParam = slug || '';

  const isSolicitar =
    slugParam === 'solicitar' ||
    slugParam === 'novo' ||
    slugParam === 'gratis';

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(!isSolicitar);
  const [pedido, setPedido] = useState<'idle' | 'enviando' | 'feito' | 'erro'>('idle');

  const MEU_NUMERO_WHATSAPP = '5511944530448';

  useEffect(() => {
    if (isSolicitar) {
      setLoading(false);
      return;
    }

    async function loadData() {
      if (!slugParam) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let found: Lead | null = await getDiagnosticoPublicoBySlugOrId(slugParam);

      if (!found) {
        const allLocal = getLocalLeads();
        found = allLocal.find(l => l.slug === slugParam || l.id === slugParam || l.nome.toLowerCase().includes(slugParam.toLowerCase())) || null;
      }

      if (found) {
        setLead(found);
      }

      setLoading(false);
    }

    loadData();
  }, [slugParam, isSolicitar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-700 flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-10 h-10 border-[3px] border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Carregando diagnóstico de atendimento local...</p>
      </div>
    );
  }

  if (isSolicitar) {
    return <SolicitarDiagnostico />;
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-zinc-900">Diagnóstico não localizado</h2>
          <p className="text-sm text-zinc-600">
            Verifique se a empresa está cadastrada ou se o link enviado possui o identificador correto.
          </p>
        </div>
      </div>
    );
  }

  const nichoLead = lead.nicho || lead.buscas?.nicho;
  const cidadeLead = lead.cidade || lead.buscas?.cidade;
  const cidadeCurta = (cidadeLead || '').split('/')[0].trim();
  const empresa = nomeCurto(lead.nome);
  const termo = termoDoNicho(nichoLead) || 'assistência técnica';

  const dataColeta = (() => {
    if (!lead.data_busca) return null;
    const data = new Date(lead.data_busca);
    return Number.isNaN(data.getTime()) ? null : data.toLocaleDateString('pt-BR');
  })();

  async function handleConversarWhatsApp() {
    if (!lead || pedido === 'enviando') return;

    setPedido('enviando');

    try {
      await solicitarDiagnosticoAvancado(lead.slug || lead.id);
    } catch {
      // Segue para abrir o WhatsApp mesmo se o rastreamento interno falhar
    }

    setPedido('feito');
    const msg = `Olá Douglas! Vi o diagnóstico da ${empresa} em ${cidadeCurta} e o mapa de 35 km. Quero entender como funciona para a minha assistência.`;
    const url = `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  const SITE_EIXO = 'https://eixodigitalbr.com.br';

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 antialiased font-inter">
      {/* Estilos para impressão e visual de laudo pericial */}
      <style>{`
        @media print {
          .nao-imprimir { display: none !important; }
          body { background: #fff !important; }
          .folha { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          section { break-inside: avoid; }
        }
      `}</style>

      <div className="folha max-w-[880px] mx-auto bg-white sm:my-8 shadow-sm sm:rounded-xl overflow-hidden">
        {/* ── Capa Executiva ────────────────────────────────────────────── */}
        <header className="px-5 sm:px-10 pt-8 sm:pt-12 pb-6 border-b border-zinc-200">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                E
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900 block leading-tight">Eixo Digital</span>
                <span className="text-[10px] text-zinc-500 block leading-tight">Estratégia Local para Assistências Técnicas</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="nao-imprimir hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-emerald-800 border border-zinc-300 hover:border-emerald-700 rounded-md px-3 py-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Laudo</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-3">
            <Wrench className="w-3.5 h-3.5 text-emerald-700" />
            <span>Diagnóstico Prático de Captação a Domicílio</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 leading-tight tracking-tight mb-2">
            {empresa}
          </h1>

          {empresa !== lead.nome && (
            <p className="text-xs sm:text-sm text-zinc-500 leading-snug mb-4 max-w-[65ch]">
              {lead.nome}
            </p>
          )}

          <p className="text-sm sm:text-[15px] text-zinc-700 leading-relaxed max-w-[65ch]">
            Análise objetiva de como a sua assistência pode captar os clientes com urgência de <strong>{cidadeCurta || 'sua região'}</strong> e cidades vizinhas no Google, direcionando os orçamentos direto para o seu WhatsApp.
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 mt-6 pt-5 border-t border-zinc-100 text-xs">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Segmento de Atuação</dt>
              <dd className="font-semibold text-zinc-800 capitalize">{termo}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Região da Sede</dt>
              <dd className="font-semibold text-zinc-800">{cidadeLead || 'Região Metropolitana'}</dd>
            </div>
            {dataColeta && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Levantamento em</dt>
                <dd className="font-semibold text-zinc-800 tabular-nums">{dataColeta}</dd>
              </div>
            )}
          </dl>
        </header>

        {/* ── Conteúdo Modular (Cada bloco entrega uma conclusão fechada) ── */}
        <main className="px-5 sm:px-10 py-8 sm:py-10 space-y-10 sm:space-y-12">

          {/* ── BLOCO 1: O Território e o Raio de 35 km ── */}
          <MapaRaioAtendimento
            cidade={cidadeLead}
            nomeEmpresa={empresa}
            nicho={nichoLead}
          />

          {/* ── BLOCO 2: Comparativo Prático de Mercado (Lado a Lado) ── */}
          <QuadroComparativoLadoALado
            lead={lead}
            cidadeCurta={cidadeCurta}
            empresa={empresa}
          />

          {/* ── BLOCO 3: Como o Cliente Decide na Prática (A Jornada Urgente) ── */}
          <JornadaClienteUrgente
            nicho={nichoLead}
            cidadeCurta={cidadeCurta}
          />

          {/* ── BLOCO 4: Plano de Ação em 48 Horas & Transparência Total ── */}
          <section className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 sm:p-6 border-b border-zinc-200 bg-zinc-50/70">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800 block mb-1">
                04. Plano Prático de Implementação
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight leading-snug">
                Como colocar a {empresa} no topo do Google em 48 horas úteis
              </h2>
              <p className="text-sm text-zinc-650 mt-1 max-w-[65ch]">
                Sem enrolação ou reuniões conceituais: estruturamos a operação da sua assistência em 3 etapas diretas.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* As 3 Frentes de Execução */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs mb-2">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 mb-1">Anúncios no Topo</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Campanhas no Google Ads ativadas exclusivamente para buscas de conserto urgente no seu raio de 35 km.
                  </p>
                </div>

                <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs mb-2">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 mb-1">Página no WhatsApp</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Página ultra-rápida (&lt; 1s de carga) com botão direto para o seu WhatsApp, evitando que o cliente desista.
                  </p>
                </div>

                <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50/50">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs mb-2">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 mb-1">Mapa &amp; Avaliações</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Otimização da sua ficha do Google para converter clientes satisfeitos em avaliações 5 estrelas contínuas.
                  </p>
                </div>
              </div>

              {/* Transparência Factual de Investimento (Sem cálculos mágicos) */}
              <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Transparência de Custos (Sem Pegadinhas):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded-lg border border-zinc-200">
                    <span className="font-bold text-zinc-900 block mb-1">Saldo de Anúncios no Google:</span>
                    <p className="text-zinc-600 leading-relaxed">
                      A partir de <strong>R$ 25 a R$ 35/dia</strong> (crédito pago diretamente para o Google). Você controla o limite de investimento e só paga quando alguém clica para consertar.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-lg border border-zinc-200">
                    <span className="font-bold text-zinc-900 block mb-1">Assessoria da Eixo Digital:</span>
                    <p className="text-zinc-600 leading-relaxed">
                      Cuidamos da configuração técnica dos anúncios, criamos a página rápida de WhatsApp e prestamos suporte contínuo diretamente com o Douglas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box de Ação & CTA Sem Pressão */}
              <div className="nao-imprimir pt-4 border-t border-zinc-100">
                {pedido === 'feito' ? (
                  <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 max-w-lg">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <span>Redirecionando para o WhatsApp...</span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">
                      Estamos abrindo a conversa com o Douglas para tirar suas dúvidas sobre o raio de atendimento da <strong>{empresa}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-xl">
                    <div>
                      <h3 className="text-lg font-black text-zinc-900 mb-1">
                        Quer ver como ficaria a {empresa} no topo da sua região?
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-650 leading-relaxed">
                        Podemos mapear juntos o seu raio de atendimento exato e tirar todas as suas dúvidas no WhatsApp, sem compromisso e sem reuniões demoradas.
                      </p>
                    </div>

                    <button
                      onClick={handleConversarWhatsApp}
                      disabled={pedido === 'enviando'}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-extrabold px-7 py-3.5 rounded-xl transition-all text-sm cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {pedido === 'enviando' ? 'Redirecionando...' : 'Conversar com o Douglas no WhatsApp'}
                      </span>
                    </button>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-zinc-500">
                      <a
                        href={`https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(`Olá Douglas! Vi o diagnóstico da ${empresa} em ${cidadeCurta} e o raio de 35 km. Quero entender como funciona para a minha assistência.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 font-medium transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Falar direto pelo link do WhatsApp</span>
                      </a>

                      <a
                        href={SITE_EIXO}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-zinc-600 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 font-medium transition-colors"
                      >
                        <span>Conhecer a Eixo Digital</span>
                        <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

        </main>

        {/* ── Rodapé Sóbrio ────────────────────────────────────────────── */}
        <footer className="px-5 sm:px-10 py-5 border-t border-zinc-200 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-2 bg-zinc-50">
          <span>© Eixo Digital · Presença &amp; Captação de Serviços Locais</span>
          <span>eixodigitalbr.com.br</span>
        </footer>
      </div>
    </div>
  );
}
