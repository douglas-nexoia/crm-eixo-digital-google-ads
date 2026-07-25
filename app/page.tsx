'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Users, Flame, AlertTriangle, CheckCircle, ArrowRight, MapPin } from 'lucide-react';
import { getBuscasFromSupabase, getLeadsFromSupabase } from '@/lib/supabase-service';
import { getLocalBuscas, getLocalLeads } from '@/lib/storage';
import { Busca, Lead, StatusFunil } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';
import { FunnelBadge } from '@/components/FunnelBadge';
import { ImportModal } from '@/components/ImportModal';

export default function DashboardPage() {
  const [buscas, setBuscas] = useState<Busca[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadData = async () => {
    // Tenta carregar do Supabase primeiro
    const sbBuscas = await getBuscasFromSupabase();
    const sbLeads = await getLeadsFromSupabase();

    if (sbBuscas.length > 0 || sbLeads.length > 0) {
      setBuscas(sbBuscas);
      setLeads(sbLeads);
    } else {
      // Fallback para dados de teste locais
      setBuscas(getLocalBuscas());
      setLeads(getLocalLeads());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalLeads = leads.length;
  const altoCount = leads.filter(l => l.score_nivel === 'alto').length;
  const medioCount = leads.filter(l => l.score_nivel === 'medio').length;
  const baixoCount = leads.filter(l => l.score_nivel === 'baixo').length;

  const funilCounts: Record<StatusFunil, number> = {
    'Novo': leads.filter(l => l.status_funil === 'Novo').length,
    'Contatado': leads.filter(l => l.status_funil === 'Contatado').length,
    'Aceitou Diagnóstico': leads.filter(l => l.status_funil === 'Aceitou Diagnóstico').length,
    'Em Negociação': leads.filter(l => l.status_funil === 'Em Negociação').length,
    'Cliente': leads.filter(l => l.status_funil === 'Cliente').length,
    'Descartado': leads.filter(l => l.status_funil === 'Descartado').length,
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard de Prospecção</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestão de oportunidades e diagnósticos de presença no Google.
          </p>
        </div>

        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Importar nova busca</span>
        </button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Leads</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{totalLeads}</p>
          <p className="text-xs text-slate-400">Empresas auditadas</p>
        </div>

        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Oportunidade Alta</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-400">{altoCount}</p>
          <p className="text-xs text-slate-400">Prioridade máxima</p>
        </div>

        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Oportunidade Média</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-400">{medioCount}</p>
          <p className="text-xs text-slate-400">Pontos a corrigir</p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Oportunidade Baixa</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-400">{baixoCount}</p>
          <p className="text-xs text-slate-400">Presença consolidada</p>
        </div>

      </div>

      {/* Visão do Funil */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-200">Estágios do Funil</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(funilCounts) as StatusFunil[]).map((status) => (
            <div key={status} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-center space-y-1">
              <span className="text-xs text-slate-400 block font-medium truncate">{status}</span>
              <span className="text-xl font-bold text-slate-100">{funilCounts[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Buscas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200">Últimas Buscas Importadas</h2>
            <Link href="/explorar" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nicho</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Empresas</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {buscas.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-semibold text-slate-100 capitalize">{b.nicho}</td>
                    <td className="px-4 py-3 text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.cidade}</span>
                    </td>
                    <td className="px-4 py-3">{b.total_encontradas}</td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/ranking?nicho=${encodeURIComponent(b.nicho)}&cidade=${encodeURIComponent(b.cidade)}`}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-colors inline-block"
                      >
                        Ver Ranking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Principais Leads */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Principais Leads (🔥 Alto)</h2>
          <div className="space-y-3">
            {leads
              .filter((l) => l.score_nivel === 'alto')
              .slice(0, 4)
              .map((lead) => (
                <div key={lead.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm leading-snug">{lead.nome}</h3>
                      <p className="text-xs text-slate-400">Maps #{lead.posicao_maps} • Nota {lead.gmb_nota || 'N/A'}</p>
                    </div>
                    <ScoreBadge nivel={lead.score_nivel} pontos={lead.score_pontos} />
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                    <FunnelBadge status={lead.status_funil} />
                    <Link href={`/leads/${lead.id}`} className="text-xs text-blue-400 hover:underline">
                      Gerenciar →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* Modal de Importação */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadData}
      />

    </div>
  );
}
