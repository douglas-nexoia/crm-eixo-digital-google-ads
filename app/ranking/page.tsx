'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { getBuscasFromSupabase, getLeadsFromSupabase } from '@/lib/supabase-service';
import { getLocalBuscas, getLocalLeads } from '@/lib/storage';
import { Busca, Lead } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';

export default function RankingPage() {
  const [buscas, setBuscas] = useState<Busca[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedNicho, setSelectedNicho] = useState<string>('odontologia');
  const [selectedCidade, setSelectedCidade] = useState<string>('Jundiaí/SP');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const sbBuscas = await getBuscasFromSupabase();
      const sbLeads = await getLeadsFromSupabase();

      if (sbBuscas.length > 0 || sbLeads.length > 0) {
        setBuscas(sbBuscas);
        setLeads(sbLeads);
      } else {
        setBuscas(getLocalBuscas());
        setLeads(getLocalLeads());
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const nichosDisponiveis = Array.from(new Set(buscas.map(b => b.nicho)));
  const cidadesDisponiveis = Array.from(new Set(buscas.map(b => b.cidade)));

  // Concorrentes do nicho e cidade selecionados ordenados por posição no Maps
  const concorrentes = leads
    .sort((a, b) => a.posicao_maps - b.posicao_maps);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Ranking de Concorrentes</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Matriz comparativa lado a lado para identificar pontos fortes e fracos no nicho local.
          </p>
        </div>

        {/* Seletores de Nicho e Cidade */}
        <div className="flex items-center gap-3">
          <select
            value={selectedNicho}
            onChange={(e) => setSelectedNicho(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 capitalize font-medium focus:outline-none focus:border-blue-500"
          >
            {nichosDisponiveis.length === 0 && <option value="odontologia">Odontologia</option>}
            {nichosDisponiveis.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <select
            value={selectedCidade}
            onChange={(e) => setSelectedCidade(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-medium focus:outline-none focus:border-blue-500"
          >
            {cidadesDisponiveis.length === 0 && <option value="Jundiaí/SP">Jundiaí/SP</option>}
            {cidadesDisponiveis.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela Comparativa de Concorrentes */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-4 sticky left-0 bg-slate-950 z-10">Pos. Maps</th>
                <th className="px-4 py-4 min-w-[200px]">Empresa</th>
                <th className="px-4 py-4 text-center">Nota GMB</th>
                <th className="px-4 py-4 text-center">Avaliações</th>
                <th className="px-4 py-4 text-center">GMB Verificado</th>
                <th className="px-4 py-4 text-center">Tem Site</th>
                <th className="px-4 py-4 text-center">HTTPS</th>
                <th className="px-4 py-4 text-center">Responsivo</th>
                <th className="px-4 py-4 text-center">Instagram</th>
                <th className="px-4 py-4 text-center">Facebook</th>
                <th className="px-4 py-4 text-center">Score Oportunidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    Carregando ranking do Supabase...
                  </td>
                </tr>
              ) : concorrentes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                    Nenhum concorrente encontrado para a busca selecionada.
                  </td>
                </tr>
              ) : (
                concorrentes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                    
                    {/* Posição no Maps */}
                    <td className="px-4 py-4 sticky left-0 bg-slate-950 font-black text-base text-slate-100 border-r border-slate-800">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                        item.posicao_maps <= 3 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{item.posicao_maps}
                      </span>
                    </td>

                    {/* Nome */}
                    <td className="px-4 py-4 font-bold text-slate-100">
                      <Link href={`/leads/${item.id}`} className="hover:text-blue-400 hover:underline">
                        {item.nome}
                      </Link>
                    </td>

                    {/* Nota GMB */}
                    <td className={`px-4 py-4 text-center font-bold ${
                      (item.gmb_nota || 0) >= 4.5 
                        ? 'bg-emerald-950/20 text-emerald-400' 
                        : (item.gmb_nota || 0) >= 4.0 
                        ? 'bg-amber-950/20 text-amber-400' 
                        : 'bg-red-950/20 text-red-400'
                    }`}>
                      ⭐ {item.gmb_nota || 'N/A'}
                    </td>

                    {/* Avaliações */}
                    <td className="px-4 py-4 text-center font-semibold text-slate-200">
                      {item.gmb_avaliacoes || 0}
                    </td>

                    {/* GMB Verificado */}
                    <td className="px-4 py-4 text-center">
                      {item.gmb_verificado ? (
                        <span className="text-emerald-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌</span>
                      )}
                    </td>

                    {/* Tem Site */}
                    <td className="px-4 py-4 text-center">
                      {item.site ? (
                        <span className="text-emerald-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌</span>
                      )}
                    </td>

                    {/* HTTPS */}
                    <td className="px-4 py-4 text-center">
                      {item.site_https ? (
                        <span className="text-emerald-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌</span>
                      )}
                    </td>

                    {/* Responsivo */}
                    <td className="px-4 py-4 text-center">
                      {item.site_responsivo ? (
                        <span className="text-emerald-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌</span>
                      )}
                    </td>

                    {/* Instagram */}
                    <td className="px-4 py-4 text-center">
                      {item.instagram ? (
                        <span className="text-emerald-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌</span>
                      )}
                    </td>

                    {/* Facebook */}
                    <td className="px-4 py-4 text-center">
                      {item.facebook ? (
                        <span className="text-emerald-400 font-bold">✅</span>
                      ) : (
                        <span className="text-red-400 font-bold">❌</span>
                      )}
                    </td>

                    {/* Score */}
                    <td className="px-4 py-4 text-center">
                      <ScoreBadge nivel={item.score_nivel} pontos={item.score_pontos} />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
