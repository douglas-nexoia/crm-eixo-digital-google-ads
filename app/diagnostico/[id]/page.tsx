'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getLeadBySlugOrIdFromSupabase, getTopConcorrentesDoMesmoNicho } from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { 
  MapPin, AlertTriangle, Trophy, MessageCircle, Star, 
  ShieldAlert, CheckCircle2, XCircle, Sparkles, Zap, ArrowUpRight, Check
} from 'lucide-react';

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
      
      let found: Lead | null = await getLeadBySlugOrIdFromSupabase(slugParam);
      
      if (!found) {
        const allLocal = getLocalLeads();
        found = allLocal.find(l => l.slug === slugParam || l.id === slugParam || l.nome.toLowerCase().includes(slugParam.toLowerCase())) || null;
      }

      if (found) {
        setLead(found);
        
        try {
          if (found.busca_id) {
            const topConcorrentes = await getTopConcorrentesDoMesmoNicho(found.busca_id, found.id);
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

  const primeiroColocado = concorrentesTop.find(c => c.posicao_maps === 1) || concorrentesTop[0];
  
  const temInjusticaRanking = primeiroColocado && (
    (!primeiroColocado.site && lead.site) || 
    ((primeiroColocado.gmb_nota || 0) < (lead.gmb_nota || 0))
  );

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi o relatório de presença digital da empresa *${lead.nome}* no Google e gostaria de saber como colocar nossa empresa no topo do Google!`
  );
  
  const linkWhatsApp = `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${whatsappMsg}`;

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

          {lead.buscas?.nicho ? (
            <span className="text-xs font-semibold text-[#94A3B8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[999px] capitalize truncate max-w-[140px] sm:max-w-none">
              {lead.buscas.nicho}
            </span>
          ) : (
            <a
              href={linkWhatsApp}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
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
              <span className="text-xs text-[#64748B]">
                {lead.posicao_maps <= 3 ? '🎉 No Top 3 de Destaque' : '⚠️ Fora da Primeira Página'}
              </span>
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

            {/* Metric 3 */}
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-5 rounded-[16px] space-y-2 text-center flex flex-col justify-center">
              <span className="text-xs text-[#94A3B8] uppercase font-semibold tracking-wider">Total de Opiniões</span>
              <div className="text-4xl font-extrabold font-outfit text-[#F1F5F9]">
                {lead.gmb_avaliacoes || 0}
              </div>
              <span className="text-xs text-[#64748B]">
                Comentários verificados
              </span>
            </div>

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
                  <th className="p-4 text-center">Site Próprio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                
                {/* Linha do Lead Atual */}
                <tr className="bg-[#10B981]/10 text-white font-bold border-l-4 border-[#10B981]">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="font-outfit text-base text-white">{lead.nome}</span>
                      <span className="text-[10px] bg-[#10B981] text-[#08130F] font-bold px-2 py-0.5 rounded-[999px] uppercase">
                        Sua Empresa
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-outfit font-black text-lg text-[#10B981]">
                    #{lead.posicao_maps || 'N/A'}
                  </td>
                  <td className="p-4 text-center font-bold text-amber-400">
                    ⭐ {lead.gmb_nota ? lead.gmb_nota.toFixed(1) : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    {lead.site ? (
                      <span className="inline-flex items-center gap-1 text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-[999px] text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Sim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-[999px] text-xs">
                        <XCircle className="w-4 h-4" /> Não
                      </span>
                    )}
                  </td>
                </tr>

                {/* Linhas dos Concorrentes */}
                {concorrentesTop.map((c) => (
                  <tr key={c.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors text-[#94A3B8]">
                    <td className="p-4 font-medium text-slate-200">{c.nome}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-[999px] bg-slate-900 text-amber-300 text-xs font-bold border border-amber-400/20">
                        #{c.posicao_maps}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-amber-400">
                      ⭐ {c.gmb_nota ? c.gmb_nota.toFixed(1) : 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      {c.site ? (
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-600 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card de Insight Persuasivo */}
          {temInjusticaRanking && primeiroColocado && (
            <div className="bg-[#0E1424] border border-amber-500/30 rounded-[16px] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-outfit uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Oportunidade Comercial Identificada!</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                Note que o <strong className="text-white">1º Colocado ({primeiroColocado.nome})</strong> {
                  !primeiroColocado.site 
                    ? 'não possui site oficial configurado' 
                    : `posiciona com nota ${primeiroColocado.gmb_nota} (inferior à sua)`
                }. Ele ocupa o topo devido a otimizações de perfil local.
              </p>
              <p className="text-[#10B981] font-semibold">
                👉 Com a estrutura atual da {lead.nome} (Nota {lead.gmb_nota} {lead.site ? '+ Site Ativo' : ''}), sua empresa tem plenas condições de ultrapassá-lo e assumir a Liderança do Google Maps na região!
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

        {/* Seção 4: CTA Principal do WhatsApp (Seguindo o Design System) */}
        <section className="bg-[#0E1424] border border-[#10B981]/30 rounded-[20px] p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="inline-block">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-4 py-1.5 rounded-[999px]">
                Plano de Ação Personalizado
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-outfit text-white leading-tight">
              Pronto para colocar a {lead.nome} no 1º Lugar do Google?
            </h2>
            
            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              A <strong className="text-white">Eixo Digital</strong> desenvolve o ecossistema completo para a sua empresa dominar a busca local: criação de site de alta conversão, gestão estratégica do Google Meu Negócio e campanhas direcionadas no Google Ads.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Botão Primário do Design System */}
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#10B981] hover:bg-[#22C55E] text-[#08130F] font-bold px-[30px] py-[16px] rounded-[10px] shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all text-sm uppercase tracking-wide cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-[#08130F]" />
              <span>Falar no WhatsApp Agora</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

        </section>

      </main>

      {/* Footer Estático */}
      <footer className="text-center py-8 text-[#64748B] text-xs border-t border-[rgba(255,255,255,0.08)] mt-12">
        <p>© Eixo Digital • Presença & Estratégia de Tração no Google</p>
      </footer>

    </div>
  );
}
