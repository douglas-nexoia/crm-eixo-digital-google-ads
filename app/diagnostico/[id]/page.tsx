'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getLeadBySlugOrIdFromSupabase, getTopConcorrentesDoMesmoNicho } from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { 
  MapPin, AlertTriangle, Trophy, MessageCircle, Star, 
  ShieldAlert, CheckCircle2, XCircle, Sparkles, TrendingDown, ArrowUpRight
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Gerando diagnóstico de alta precisão...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-slate-300 font-semibold text-lg">Diagnóstico não encontrado ou link expirado.</p>
        <p className="text-xs text-slate-500 max-w-sm">
          Verifique se a empresa está cadastrada no CRM da Eixo Digital.
        </p>
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi o relatório de presença digital da empresa *${lead.nome}* no Google e gostaria de saber como colocar nossa empresa no topo do Google!`
  );
  
  const linkWhatsApp = `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 antialiased font-sans pb-24 selection:bg-blue-500 selection:text-white">
      
      {/* Glow Effects no fundo */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="fixed bottom-10 right-0 w-80 h-80 bg-emerald-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Top Banner de Diagnóstico */}
      <header className="sticky top-0 z-50 bg-[#0a0d14]/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-4 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-emerald-400 text-lg">
                E
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  Relatório Oficial
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Eixo Digital</span>
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-tight mt-0.5">{lead.nome}</h1>
            </div>
          </div>

          {lead.buscas?.nicho && (
            <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg capitalize shadow-inner">
              {lead.buscas.nicho}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6 relative z-10">

        {/* Banner de Impacto Comercial */}
        <div className="bg-gradient-to-r from-blue-900/30 via-slate-900/60 to-indigo-900/30 border border-blue-500/30 rounded-2xl p-4 text-center space-y-1 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diagnóstico de Visibilidade Digital</span>
          </div>
          <p className="text-xs text-slate-300">
            Comparativo em tempo real de posições e reputação no Google Maps.
          </p>
        </div>
        
        {/* Seção 1: Posição Atual no Google */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>1. Sua Posição Atual no Google</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            
            {/* Card Posição Maps */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1 relative group hover:border-slate-700 transition-all">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Ranking Maps</span>
              <div className="text-3xl font-black text-slate-100 flex items-center justify-center gap-1">
                {lead.posicao_maps ? (
                  <>
                    <span className={lead.posicao_maps <= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                      #{lead.posicao_maps}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 text-lg">N/A</span>
                )}
              </div>
              <span className="text-[9px] text-slate-500 block">
                {lead.posicao_maps <= 3 ? 'No Top 3 Destaque' : 'Fora do Top 3'}
              </span>
            </div>
            
            {/* Card Nota GMB */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1 relative group hover:border-slate-700 transition-all">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Nota Google</span>
              <div className="text-3xl font-black text-amber-400 flex items-center justify-center gap-1">
                <span>{lead.gmb_nota || 'N/A'}</span>
              </div>
              <div className="flex justify-center text-amber-400 text-xs">
                {'★'.repeat(Math.round(lead.gmb_nota || 0))}
              </div>
            </div>

            {/* Card Avaliações */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-1 relative group hover:border-slate-700 transition-all">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Avaliações</span>
              <span className="text-3xl font-black text-slate-100 block">
                {lead.gmb_avaliacoes || 0}
              </span>
              <span className="text-[9px] text-slate-500 block">Opiniões de clientes</span>
            </div>

          </div>
        </section>

        {/* Seção 2: Comparado com os Líderes do Nicho */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                2. Comparativo com Concorrentes
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Empresa</th>
                  <th className="p-3 text-center">Posição</th>
                  <th className="p-3 text-center">Nota</th>
                  <th className="p-3 text-center">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                
                {/* Linha da Empresa Prospectada (Destaque Neon) */}
                <tr className="bg-gradient-to-r from-blue-950/60 to-slate-900/80 text-blue-200 font-bold border-l-4 border-blue-500">
                  <td className="p-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span>{lead.nome}</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.5 rounded">Você</span>
                  </td>
                  <td className="p-3 text-center font-extrabold text-blue-300">
                    #{lead.posicao_maps || 'N/A'}
                  </td>
                  <td className="p-3 text-center font-extrabold text-amber-400">
                    ⭐ {lead.gmb_nota || 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    {lead.site ? <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" /> : <XCircle className="w-4 h-4 text-red-500 inline" />}
                  </td>
                </tr>

                {/* Concorrentes Diretos do Mesmo Nicho */}
                {concorrentesTop.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 text-slate-200 font-medium">{c.nome}</td>
                    <td className="p-3 text-center font-bold text-slate-100">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-amber-300 text-[11px] font-black border border-amber-400/20">
                        #{c.posicao_maps}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-amber-400">
                      ⭐ {c.gmb_nota || 'N/A'}
                    </td>
                    <td className="p-3 text-center">
                      {c.site ? <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" /> : <XCircle className="w-4 h-4 text-slate-600 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção 3: Falhas Identificadas */}
        <section className="bg-red-950/10 border border-red-900/30 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest">
              3. Pontos Fracos Identificados (Gargalos)
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {lead.score_detalhes?.map((falha, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-slate-950/80 border border-red-900/30 p-3.5 rounded-xl text-xs text-red-200/90 shadow-sm hover:border-red-800/50 transition-all">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1 shadow-sm shadow-red-500/50" />
                <span className="font-medium leading-relaxed">{falha}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 4: CTA do WhatsApp para o seu número (11 94453-0448) */}
        <section className="bg-gradient-to-b from-slate-900/80 via-slate-900 to-[#0c1322] border border-emerald-500/30 rounded-3xl p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
          
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
              Sua Empresa no Topo do Google
            </span>
            <h2 className="text-xl font-black text-white leading-tight">
              Quer colocar a {lead.nome} em 1º Lugar?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              A <strong>Eixo Digital</strong> constrói o ecossistema completo: criação de site de alta performance, otimização semanal do Google Meu Negócio e anúncios de alta conversão.
            </p>
          </div>

          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-wide w-full sm:w-auto"
          >
            <MessageCircle className="w-5 h-5 fill-slate-950" />
            <span>Falar com especialista no WhatsApp</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </section>

      </main>

      {/* Footer Fixo */}
      <footer className="text-center py-6 text-slate-600 text-[11px] border-t border-slate-900">
        <p>© Eixo Digital • Soluções em Presença e Otimização no Google</p>
      </footer>

    </div>
  );
}
