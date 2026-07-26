'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDiagnosticoPublicoBySlugOrId, getTopConcorrentesDoMesmoNicho } from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import {
  AlertTriangle, MessageCircle, MapPin, Megaphone,
  CheckCircle2, Sparkles, Zap, ArrowUpRight
} from 'lucide-react';

type LinhaComparativo = {
  id: string;
  nome: string;
  posicao_maps: number;
  gmb_nota?: number | null;
  gmb_avaliacoes?: number | null;
  isLead: boolean;
};

/**
 * O bloco local do Google mostra 3 resultados: o limiar comercial é o Top 3,
 * não o 1º lugar. Posição 4 a 10 ainda está na primeira página — afirmar o
 * contrário é um erro que o dono do negócio confere em 10 segundos.
 */
function rotuloPosicao(posicao?: number): string | null {
  if (!posicao) return null;
  if (posicao <= 3) return '🎉 No Top 3 de destaque';
  if (posicao <= 10) return '⚠️ Primeira página, fora do Top 3';
  return '⚠️ Fora da primeira página';
}

export default function DiagnosticoPublicoPage() {
  const params = useParams();
  const slugParam = (params.id as string) || '';

  const [lead, setLead] = useState<Lead | null>(null);
  const [concorrentesTop, setConcorrentesTop] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const MEU_NUMERO_WHATSAPP = '5511944530448';

  useEffect(() => {
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

        try {
          if (found.busca_id) {
            const topConcorrentes = await getTopConcorrentesDoMesmoNicho(found);
            setConcorrentesTop(topConcorrentes);
          } else {
            const allLocal = getLocalLeads();
            const topLocal = allLocal
              .filter(l => l.id !== found?.id && l.busca_id === found?.busca_id)
              .sort((a, b) => a.posicao_maps - b.posicao_maps)
              .slice(0, 3);
            setConcorrentesTop(topLocal);
          }
        } catch {
          setConcorrentesTop([]);
        }
      }

      setLoading(false);
    }

    loadData();
  }, [slugParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col items-center justify-center p-6 space-y-4 font-inter">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#94A3B8] text-sm font-medium">Gerando diagnóstico de visibilidade digital...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col items-center justify-center p-6 text-center space-y-4 font-inter">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold font-outfit text-white">Diagnóstico Não Encontrado</h2>
          <p className="text-sm text-[#94A3B8]">
            Verifique se a empresa está cadastrada ou se o link enviado possui o identificador correto.
          </p>
        </div>
      </div>
    );
  }

  // A view pública já entrega `nicho` resolvido; `buscas` é o formato antigo,
  // que ainda chega pelo fallback do localStorage.
  const nichoLead = lead.nicho || lead.buscas?.nicho;

  // null/undefined = a coleta não trouxe o dado. Mostrar "0" nesse caso é
  // afirmar algo que o dono sabe ser falso, e derruba o relatório inteiro.
  const temAvaliacoes = lead.gmb_avaliacoes !== null && lead.gmb_avaliacoes !== undefined;

  /**
   * Todos na mesma tabela, ordenados pela posição real. O lead não é mais
   * fixado no topo: se ele está em #6, aparece abaixo dos líderes — é essa
   * distância que comunica o problema.
   */
  const linhasComparativo: LinhaComparativo[] = [
    {
      id: lead.id,
      nome: lead.nome,
      posicao_maps: lead.posicao_maps,
      gmb_nota: lead.gmb_nota,
      gmb_avaliacoes: lead.gmb_avaliacoes,
      isLead: true,
    },
    ...concorrentesTop.map(c => ({
      id: c.id,
      nome: c.nome,
      posicao_maps: c.posicao_maps,
      gmb_nota: c.gmb_nota,
      gmb_avaliacoes: c.gmb_avaliacoes,
      isLead: false,
    })),
  ].sort((a, b) => (a.posicao_maps ?? 999) - (b.posicao_maps ?? 999));

  // Posições que existem entre duas linhas e não estão sendo exibidas.
  function lacunaAntesDe(idx: number): number {
    if (idx === 0) return 0;
    const anterior = linhasComparativo[idx - 1].posicao_maps;
    const atual = linhasComparativo[idx].posicao_maps;
    if (!anterior || !atual) return 0;
    return Math.max(0, atual - anterior - 1);
  }

  // Se nenhum líder tem site, o ranking está sendo disputado só no perfil do
  // Google — e o espaço do tráfego pago está vazio na região.
  const lideresSemSite = concorrentesTop.length > 0 && concorrentesTop.every(c => !c.site);

  // Só é "1º colocado" quem está de fato em #1. A versão anterior caía no
  // primeiro item da lista e chegava a chamar o #2 de líder.
  const primeiroColocado = concorrentesTop.find(c => c.posicao_maps === 1) || null;

  // Afirmar "nota inferior à sua" exige os dois números na mão: antes isso
  // imprimia "nota undefined" quando o concorrente vinha sem nota coletada.
  const lideraComNotaMenor =
    primeiroColocado !== null &&
    typeof primeiroColocado.gmb_nota === 'number' &&
    typeof lead.gmb_nota === 'number' &&
    primeiroColocado.gmb_nota < lead.gmb_nota;

  // Quem já está no Top 3 não tem o que "entrar"; a meta dele é subir dentro dele.
  const metaPosicional = lead.posicao_maps && lead.posicao_maps <= 3
    ? 'de disputar as primeiras posições da região'
    : 'de entrar no Top 3 da região';

  function linkWhatsApp(mensagem: string): string {
    return `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
  }

  const linkGeral = linkWhatsApp(
    `Olá! Vi o relatório de presença digital da empresa *${lead.nome}* no Google e gostaria de saber como colocar nossa empresa no topo do Google!`
  );
  const linkOrganico = linkWhatsApp(
    `Olá! Vi o diagnóstico de visibilidade da *${lead.nome}* e quero cuidar do nosso perfil no Google Meu Negócio.`
  );
  const linkPago = linkWhatsApp(
    `Olá! Vi o diagnóstico de visibilidade da *${lead.nome}* e quero aparecer no Google agora, com site e anúncios.`
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] antialiased font-inter pb-24 relative overflow-x-hidden selection:bg-[#10B981] selection:text-[#08130F]">

      {/* Glow Effect Sutil do Design System no Hero (blur 100px, opacidade 0.12) */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] pointer-events-none rounded-full"
        style={{
          background: 'radial-[#10B981]',
          backgroundColor: '#10B981',
          filter: 'blur(100px)',
          opacity: 0.12,
        }}
      />

      {/* Header Sticky - Design System (blur 12px, rgba(11,15,25,0.85), altura 76px) */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/85 backdrop-blur-[12px] border-b border-[rgba(255,255,255,0.08)] h-[76px] px-4 sm:px-8 flex items-center">
        <div className="max-w-[1100px] w-full mx-auto flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#10B981] flex items-center justify-center font-outfit font-extrabold text-[#08130F] text-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full">
                  Relatório Oficial
                </span>
                <span className="text-xs text-[#64748B] hidden sm:inline">• Eixo Digital</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold font-outfit text-white leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {lead.nome}
              </h1>
            </div>
          </div>

          {nichoLead ? (
            <span className="text-xs font-semibold text-[#94A3B8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[999px] capitalize truncate max-w-[140px] sm:max-w-none">
              {nichoLead}
            </span>
          ) : (
            <a
              href={linkGeral}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#22C55E] text-[#08130F] font-bold text-xs px-3.5 py-2 rounded-[10px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#08130F]" />
              <span className="hidden sm:inline">Contato</span>
            </a>
          )}
        </div>
      </header>

      {/* Conteúdo Principal (Largura Máxima 1100px centralizado) */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-12 relative z-10">

        {/* Hero Banner / Resumo executivo */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-1.5 rounded-[999px] text-xs font-semibold text-[#10B981]">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span>DIAGNÓSTICO EXCLUSIVO DE VISIBILIDADE DIGITAL</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-outfit text-[#F1F5F9] leading-tight tracking-tight">
            Análise de Desempenho no Google para <span className="text-[#10B981]">{lead.nome}</span>
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-2xl mx-auto font-inter">
            Comparações em tempo real de posicionamento no Google Maps, nota de clientes, estrutura de site e oportunidades de crescimento na sua região.
          </p>
        </section>

        {/* Seção 1: Posição Atual no Google */}
        <section className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-outfit tracking-wider uppercase text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-[999px]">
              01. Posição Atual
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
              Sua Presença no Google Maps
            </h2>
          </div>

          <div className={`grid grid-cols-1 gap-4 ${temAvaliacoes ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>

            {/* Metric 1 */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-5 rounded-[16px] space-y-2 text-center flex flex-col justify-center">
              <span className="text-xs text-[#94A3B8] uppercase font-semibold tracking-wider">Posição no Maps</span>
              <div className="text-4xl font-extrabold font-outfit flex items-center justify-center gap-1">
                {lead.posicao_maps ? (
                  <span className={lead.posicao_maps <= 3 ? 'text-[#10B981]' : 'text-amber-400'}>
                    #{lead.posicao_maps}
                  </span>
                ) : (
                  <span className="text-[#64748B] text-2xl">N/A</span>
                )}
              </div>
              {rotuloPosicao(lead.posicao_maps) && (
                <span className="text-xs text-[#64748B]">
                  {rotuloPosicao(lead.posicao_maps)}
                </span>
              )}
            </div>

            {/* Metric 2 */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-5 rounded-[16px] space-y-2 text-center flex flex-col justify-center">
              <span className="text-xs text-[#94A3B8] uppercase font-semibold tracking-wider">Nota de Avaliação</span>
              <div className="text-4xl font-extrabold font-outfit text-amber-400 flex items-center justify-center gap-1">
                <span>{lead.gmb_nota ? lead.gmb_nota.toFixed(1) : 'N/A'}</span>
              </div>
              <div className="flex justify-center text-amber-400 text-sm">
                {'★'.repeat(Math.round(lead.gmb_nota || 0))}
                <span className="text-slate-700">{'★'.repeat(5 - Math.round(lead.gmb_nota || 0))}</span>
              </div>
            </div>

            {/* Metric 3 — só existe quando a coleta trouxe o número */}
            {temAvaliacoes && (
              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-5 rounded-[16px] space-y-2 text-center flex flex-col justify-center">
                <span className="text-xs text-[#94A3B8] uppercase font-semibold tracking-wider">Total de Opiniões</span>
                <div className="text-4xl font-extrabold font-outfit text-[#F1F5F9]">
                  {lead.gmb_avaliacoes}
                </div>
                <span className="text-xs text-[#64748B]">
                  Comentários verificados
                </span>
              </div>
            )}

          </div>
        </section>

        {/* Seção 2: Comparativo com Líderes do Nicho */}
        <section className="bg-[#0B0F19] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-outfit tracking-wider uppercase text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-[999px]">
                02. Concorrência
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
                Comparativo com os Líderes da Região
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
            <table className="w-full text-left text-xs sm:text-sm text-[#F1F5F9] border-collapse min-w-[500px]">
              <thead className="bg-[#0E1424] text-[#94A3B8] font-outfit uppercase font-bold text-[11px] tracking-wider border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="p-4">Empresa</th>
                  <th className="p-4 text-center">Posição</th>
                  <th className="p-4 text-center">Nota no Google</th>
                  <th className="p-4 text-center">Avaliações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">

                {linhasComparativo.map((linha, idx) => {
                  const lacuna = lacunaAntesDe(idx);

                  return (
                    <React.Fragment key={linha.id}>
                      {lacuna > 0 && (
                        <tr className="bg-[rgba(255,255,255,0.01)]">
                          <td colSpan={4} className="px-4 py-2.5 text-center text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                            ┈┈┈ {lacuna} {lacuna === 1 ? 'posição' : 'posições'} no meio do caminho ┈┈┈
                          </td>
                        </tr>
                      )}

                      <tr
                        className={
                          linha.isLead
                            ? 'bg-[#10B981]/10 text-white font-bold border-l-4 border-[#10B981]'
                            : 'hover:bg-[rgba(255,255,255,0.03)] transition-colors text-[#94A3B8]'
                        }
                      >
                        <td className="p-4">
                          {linha.isLead ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                              <span className="font-outfit text-base text-white">{linha.nome}</span>
                              <span className="text-[10px] bg-[#10B981] text-[#08130F] font-bold px-2 py-0.5 rounded-[999px] uppercase">
                                Sua Empresa
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-200">{linha.nome}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {linha.isLead ? (
                            <span className="font-outfit font-black text-lg text-[#10B981]">
                              #{linha.posicao_maps || 'N/A'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-[999px] bg-slate-900 text-amber-300 text-xs font-bold border border-amber-400/20">
                              #{linha.posicao_maps}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-amber-400">
                          ⭐ {linha.gmb_nota ? linha.gmb_nota.toFixed(1) : 'N/A'}
                        </td>
                        <td className={`p-4 text-center ${linha.isLead ? 'text-white font-bold' : 'text-slate-300'}`}>
                          {linha.gmb_avaliacoes !== null && linha.gmb_avaliacoes !== undefined
                            ? linha.gmb_avaliacoes
                            : <span className="text-[#64748B]">—</span>}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Card de Insight: o espaço do tráfego pago está vazio na região */}
          {lideresSemSite && (
            <div className="bg-[#0E1424] border border-amber-500/30 rounded-[16px] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-outfit uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Oportunidade Comercial Identificada!</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                Nenhum dos {concorrentesTop.length === 1 ? 'líderes' : `${concorrentesTop.length} líderes`} da sua região
                {' '}tem <strong className="text-white">site próprio</strong>. Todos disputam a primeira posição apenas com o perfil do Google.
              </p>
              {lead.site ? (
                <p className="text-[#10B981] font-semibold">
                  👉 A {lead.nome} já tem o ativo que nenhum concorrente do topo construiu. O que falta é tráfego chegando até ele.
                </p>
              ) : (
                <p className="text-[#10B981] font-semibold">
                  👉 Quem entra com site e anúncio compete num espaço que ninguém está ocupando — e aparece <strong>acima</strong> dos primeiros colocados, na área paga, já na primeira semana.
                </p>
              )}
            </div>
          )}

          {/* Quando todos têm site, o argumento é a nota: o lead já é melhor
              avaliado que quem está em #1. */}
          {!lideresSemSite && lideraComNotaMenor && primeiroColocado && (
            <div className="bg-[#0E1424] border border-amber-500/30 rounded-[16px] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-outfit uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Oportunidade Comercial Identificada!</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                O <strong className="text-white">1º colocado ({primeiroColocado.nome})</strong> está no topo com nota{' '}
                {primeiroColocado.gmb_nota?.toFixed(1)} — <strong className="text-white">abaixo da sua, {lead.gmb_nota?.toFixed(1)}</strong>.
                A diferença não está na satisfação dos seus clientes, e sim na otimização do perfil no Google.
              </p>
              <p className="text-[#10B981] font-semibold">
                👉 Quem seus clientes avaliam melhor é a {lead.nome}. Com o perfil trabalhado, sua empresa tem plenas condições {metaPosicional}.
              </p>
            </div>
          )}
        </section>

        {/* Seção 3: Falhas Identificadas */}
        <section className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold font-outfit tracking-wider uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-[999px]">
              03. Oportunidades
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
              Gargalos de Visibilidade a Corrigir
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lead.score_detalhes && lead.score_detalhes.length > 0 ? (
              lead.score_detalhes.map((falha, idx) => (
                <div
                  key={idx}
                  className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-4 rounded-[16px] text-xs sm:text-sm text-[#F1F5F9] flex items-start gap-3 hover:border-red-500/40 transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  <span className="font-medium leading-relaxed">{falha}</span>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-5 rounded-[16px] text-center text-sm text-[#94A3B8]">
                Seu perfil possui boas configurações base, mas pode multiplicar o volume de clientes com tráfego pago e SEO local avançado.
              </div>
            )}
          </div>
        </section>

        {/* Seção 4: Os dois caminhos do Google — orgânico e pago, sem hierarquia */}
        <section className="bg-[#0E1424] border border-[#10B981]/30 rounded-[20px] p-6 sm:p-10 md:p-12 space-y-8 shadow-2xl relative overflow-hidden">

          <div className="space-y-4 max-w-2xl mx-auto text-center">
            <div className="inline-block">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-4 py-1.5 rounded-[999px]">
                Plano de Ação Personalizado
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-outfit text-white leading-tight">
              Pronto para colocar a {lead.nome} no topo do Google?
            </h2>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              O <strong className="text-white">anúncio</strong> é o caminho pago para aparecer primeiro.
              O <strong className="text-white">Google Meu Negócio</strong> é o caminho orgânico.
              O melhor cenário é ocupar os dois.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Caminho orgânico */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">Caminho Orgânico</span>
                  <h3 className="text-lg font-bold font-outfit text-white leading-tight">Gestão do Google Meu Negócio</h3>
                </div>
              </div>

              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Aparecer para quem já está buscando na sua região, sem pagar por clique.
              </p>

              <ul className="space-y-2 text-sm text-[#F1F5F9] flex-1">
                {[
                  'Publicações e fotos semanais no perfil',
                  'Estratégia para aumentar as avaliações',
                  'Respostas a todos os comentários',
                  'Perfil otimizado para a busca local',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-[#64748B] leading-relaxed border-t border-[rgba(255,255,255,0.08)] pt-3">
                Constrói ao longo dos meses e continua rendendo depois. Meta: <strong className="text-[#94A3B8]">Top 3 do Google Maps na sua região</strong>.
              </p>

              <a
                href={linkOrganico}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.05)] hover:bg-[#10B981] hover:text-[#08130F] border border-[#10B981]/40 text-[#10B981] font-bold px-6 py-3.5 rounded-[10px] transition-all text-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Quero cuidar do meu perfil</span>
              </a>
            </div>

            {/* Caminho pago */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">Caminho Pago</span>
                  <h3 className="text-lg font-bold font-outfit text-white leading-tight">Site + Google Ads</h3>
                </div>
              </div>

              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Aparecer hoje, acima de todo mundo, e trazer o cliente direto para o seu WhatsApp.
              </p>

              <ul className="space-y-2 text-sm text-[#F1F5F9] flex-1">
                {[
                  'Site de alta conversão com seus trabalhos',
                  'Botão direto para o WhatsApp',
                  'Campanhas no Google Ads na sua região',
                  'Acompanhamento de resultado por contato',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-[#64748B] leading-relaxed border-t border-[rgba(255,255,255,0.08)] pt-3">
                Resultado desde a primeira semana, com investimento que você controla. Funciona <strong className="text-[#94A3B8]">independente da posição orgânica</strong>.
              </p>

              <a
                href={linkPago}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#22C55E] text-[#08130F] font-bold px-6 py-3.5 rounded-[10px] shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all text-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-[#08130F]" />
                <span>Quero aparecer no Google agora</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

          </div>

          <p className="text-center text-sm sm:text-base text-[#F1F5F9] font-semibold max-w-2xl mx-auto leading-relaxed">
            Um traz cliente sem custo por clique, o outro traz cliente amanhã.
            <span className="text-[#10B981]"> Quem faz os dois aparece duas vezes na mesma busca.</span>
          </p>

        </section>

      </main>

      {/* Footer Estático */}
      <footer className="text-center py-8 text-[#64748B] text-xs border-t border-[rgba(255,255,255,0.08)] mt-12">
        <p>© Eixo Digital • Presença & Estratégia de Tração no Google</p>
      </footer>

    </div>
  );
}
