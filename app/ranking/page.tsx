'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getLeadsFromSupabase, getNichosECidadesUnicosFromSupabase } from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';
import { Trophy, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'nome' | 'posicao_maps' | 'gmb_nota' | 'gmb_avaliacoes' | 'score_pontos';
type SortOrder = 'asc' | 'desc';

export default function RankingConcorrentesPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [nichosDisponiveis, setNichosDisponiveis] = useState<string[]>([]);
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);

  const [filtroNicho, setFiltroNicho] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  // Ordenação Interativa
  const [sortField, setSortField] = useState<SortField>('posicao_maps');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      const { nichos, cidades } = await getNichosECidadesUnicosFromSupabase();
      setNichosDisponiveis(nichos);
      setCidadesDisponiveis(cidades);

      if (nichos.length > 0 && filtroNicho === 'todos') {
        setFiltroNicho(nichos[0]);
      }

      const leadsDb = await getLeadsFromSupabase();
      setAllLeads(leadsDb);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtragem e Ordenação dos concorrentes
  const concorrentesFiltrados = useMemo(() => {
    return allLeads.filter(lead => {
      if (filtroNicho !== 'todos') {
        const nichoLead = lead.nicho || lead.buscas?.nicho;
        if (nichoLead && nichoLead.toLowerCase() !== filtroNicho.toLowerCase()) return false;
      }
      if (filtroCidade !== 'todos') {
        const cidadeLead = lead.cidade || lead.buscas?.cidade;
        if (cidadeLead && cidadeLead.toLowerCase() !== filtroCidade.toLowerCase()) return false;
      }
      return true;
    }).sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(bVal || '');
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [allLeads, filtroNicho, filtroCidade, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-400 inline ml-1 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 inline ml-1 font-bold" />
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Ranking de Concorrentes</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Matriz comparativa lado a lado para identificar pontos fortes e fracos no nicho local.
          </p>
        </div>

        {/* Filtros de Nicho e Cidade */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          
          <select
            value={filtroNicho}
            onChange={(e) => setFiltroNicho(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 capitalize font-bold focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos os Segmentos</option>
            {nichosDisponiveis.map((nicho) => (
              <option key={nicho} value={nicho} className="capitalize">
                {nicho}
              </option>
            ))}
          </select>

          <select
            value={filtroCidade}
            onChange={(e) => setFiltroCidade(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 capitalize font-bold focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todas as Cidades</option>
            {cidadesDisponiveis.map((cidade) => (
              <option key={cidade} value={cidade} className="capitalize">
                {cidade}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Matriz Comparativa Lado a Lado com Ordenação por Clique */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead className="text-xs uppercase bg-slate-950/90 text-slate-400 border-b border-slate-800 select-none">
              <tr>
                <th 
                  onClick={() => handleSort('nome')} 
                  className="px-5 py-4 min-w-[220px] cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Empresa {renderSortIcon('nome')}
                </th>
                <th 
                  onClick={() => handleSort('posicao_maps')} 
                  className="px-4 py-4 text-center cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Posição Maps {renderSortIcon('posicao_maps')}
                </th>
                <th 
                  onClick={() => handleSort('gmb_nota')} 
                  className="px-4 py-4 text-center cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Nota GMB {renderSortIcon('gmb_nota')}
                </th>
                <th 
                  onClick={() => handleSort('gmb_avaliacoes')} 
                  className="px-4 py-4 text-center cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Avaliações {renderSortIcon('gmb_avaliacoes')}
                </th>
                <th className="px-4 py-4 text-center">Verificado</th>
                <th className="px-4 py-4 text-center">Possui Site</th>
                <th className="px-4 py-4 text-center">HTTPS Seguro</th>
                <th className="px-4 py-4 text-center">Site Responsivo</th>
                <th className="px-4 py-4 text-center">Redes Sociais</th>
                <th 
                  onClick={() => handleSort('score_pontos')} 
                  className="px-5 py-4 text-right cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Pontuação Oportunidade {renderSortIcon('score_pontos')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                    Carregando matriz de concorrentes do Supabase...
                  </td>
                </tr>
              ) : concorrentesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                    Nenhum concorrente encontrado para o segmento selecionado.
                  </td>
                </tr>
              ) : (
                concorrentesFiltrados.map((lead) => {
                  const isTop3 = lead.posicao_maps <= 3;
                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-900/60 transition-colors ${
                        isTop3 ? 'bg-amber-950/10 border-l-4 border-amber-400' : ''
                      }`}
                    >
                      
                      {/* Empresa */}
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-100">{lead.nome}</div>
                        <div className="text-xs text-slate-400 capitalize">
                          {lead.nicho || lead.buscas?.nicho || 'N/A'} • {lead.cidade || lead.buscas?.cidade || ''}
                        </div>
                      </td>

                      {/* Posição no Maps */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          isTop3 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{lead.posicao_maps}
                        </span>
                      </td>

                      {/* Nota no GMB */}
                      <td className="px-4 py-4 text-center font-bold text-amber-400">
                        ⭐ {lead.gmb_nota || 'N/A'}
                      </td>

                      {/* Qtd Avaliações */}
                      <td className="px-4 py-4 text-center font-semibold text-slate-200">
                        {lead.gmb_avaliacoes || 0}
                      </td>

                      {/* GMB Verificado */}
                      <td className="px-4 py-4 text-center">
                        {lead.gmb_verificado ? (
                          <Check className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>

                      {/* Tem Site */}
                      <td className="px-4 py-4 text-center">
                        {lead.site ? (
                          <Check className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 inline" />
                        )}
                      </td>

                      {/* HTTPS */}
                      <td className="px-4 py-4 text-center">
                        {lead.site_https ? (
                          <Check className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 inline" />
                        )}
                      </td>

                      {/* Site Responsivo */}
                      <td className="px-4 py-4 text-center">
                        {lead.site_responsivo ? (
                          <Check className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <X className="w-4 h-4 text-slate-600 inline" />
                        )}
                      </td>

                      {/* Redes Sociais */}
                      <td className="px-4 py-4 text-center text-xs space-y-0.5">
                        <div className={lead.instagram ? 'text-emerald-400' : 'text-slate-600'}>
                          Insta: {lead.instagram ? '✅' : '❌'}
                        </div>
                        <div className={lead.facebook ? 'text-emerald-400' : 'text-slate-600'}>
                          FB: {lead.facebook ? '✅' : '❌'}
                        </div>
                      </td>

                      {/* Score Badge */}
                      <td className="px-5 py-4 text-right">
                        <ScoreBadge nivel={lead.score_nivel} pontos={lead.score_pontos} />
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
