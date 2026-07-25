'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getLeadBySlugOrIdFromSupabase, getTopConcorrentesDoMesmoNicho } from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { MapPin, AlertTriangle, Trophy, MessageCircle } from 'lucide-react';

export default function DiagnosticoPublicoPage() {
  const params = useParams();
  const slugParam = (params.id as string) || '';

  const [lead, setLead] = useState<Lead | null>(null);
  const [concorrentesTop, setConcorrentesTop] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!slugParam) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // 1. Buscar o lead no Supabase
      let found: Lead | null = await getLeadBySlugOrIdFromSupabase(slugParam);
      
      // Fallback local se não encontrar no Supabase
      if (!found) {
        const allLocal = getLocalLeads();
        found = allLocal.find(l => l.slug === slugParam || l.id === slugParam || l.nome.toLowerCase().includes(slugParam.toLowerCase())) || null;
      }

      if (found) {
        setLead(found);
        
        // 2. Buscar os 3 melhores concorrentes ESTRITAMENTE do MESMO NICHO e MESMA CIDADE (mesmo busca_id)
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <p className="text-slate-400 text-sm">Carregando relatório de diagnóstico...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-slate-300 font-semibold">Diagnóstico não encontrado ou link expirado.</p>
        <p className="text-xs text-slate-500 max-w-sm">
          Verifique se a empresa está cadastrada no CRM.
        </p>
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(`Olá! Vi o relatório de presença digital da ${lead.nome} e gostaria de saber como colocar minha empresa no topo do Google.`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-16">
      
      {/* Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xs">
              E
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eixo Digital • Diagnóstico</span>
          </div>
          <h1 className="text-2xl font-black text-white">{lead.nome}</h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            <span>Análise de Presença Digital no Google Maps</span>
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        
        {/* Seção 1: Posição Atual */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">1. Sua Posição Atual no Google</h2>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Maps</span>
              <span className="text-2xl font-black text-slate-100">
                {lead.posicao_maps ? `#${lead.posicao_maps}` : 'N/A'}
              </span>
            </div>
            
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Nota GMB</span>
              <span className="text-2xl font-black text-amber-400">⭐ {lead.gmb_nota || 'N/A'}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Avaliações</span>
              <span className="text-2xl font-black text-slate-100">{lead.gmb_avaliacoes || 0}</span>
            </div>
          </div>
        </section>

        {/* Seção 2: Comparado com os Melhores Concorrentes do Nicho */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">2. Comparado com os Líderes do Nicho</h2>
            </div>
            {lead.buscas?.nicho && (
              <span className="text-[10px] font-semibold bg-slate-950 border border-slate-800 text-blue-400 px-2 py-0.5 rounded capitalize">
                {lead.buscas.nicho}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Empresa</th>
                  <th className="p-2.5 text-center">Maps</th>
                  <th className="p-2.5 text-center">Nota</th>
                  <th className="p-2.5 text-center">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {/* Linha do Prospect */}
                <tr className="bg-blue-950/30 text-blue-300 font-bold border-l-2 border-blue-500">
                  <td className="p-2.5">{lead.nome} (Você)</td>
                  <td className="p-2.5 text-center">#{lead.posicao_maps || 'N/A'}</td>
                  <td className="p-2.5 text-center">⭐ {lead.gmb_nota || 'N/A'}</td>
                  <td className="p-2.5 text-center">{lead.site ? '✅' : '❌'}</td>
                </tr>

                {/* Top Concorrentes do Mesmo Nicho */}
                {concorrentesTop.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2.5 font-semibold text-slate-200">{c.nome}</td>
                    <td className="p-2.5 text-center font-bold">#{c.posicao_maps}</td>
                    <td className="p-2.5 text-center">⭐ {c.gmb_nota || 'N/A'}</td>
                    <td className="p-2.5 text-center">{c.site ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção 3: Falhas */}
        <section className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 space-y-3 shadow-xl">
          <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span>3. Falhas que impedem sua empresa de subir no Google</span>
          </h2>

          <ul className="space-y-2.5 text-xs text-red-200">
            {lead.score_detalhes?.map((falha, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-950/50 p-2.5 rounded-lg border border-red-900/20">
                <span className="text-red-500 font-bold">⚠️</span>
                <span>{falha}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Seção 4: CTA */}
        <section className="bg-gradient-to-br from-blue-900/40 to-emerald-900/40 border border-blue-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <h2 className="text-lg font-black text-white">Quer colocar a {lead.nome} no topo do Google?</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
            A <strong>Eixo Digital</strong> constrói o ecossistema completo: site de alta conversão, gestão profissional do Google Meu Negócio e campanhas de Google Ads.
          </p>

          <a
            href={`https://wa.me/?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm uppercase tracking-wide"
          >
            <MessageCircle className="w-5 h-5 fill-slate-950" />
            <span>Falar com especialista no WhatsApp</span>
          </a>
        </section>

      </main>

    </div>
  );
}
