'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Copy, Check, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLeadsPaginadosFromSupabase, getNichosECidadesUnicosFromSupabase } from '@/lib/supabase-service';
import { getLocalLeads, getLocalBuscas } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';
import { FunnelBadge } from '@/components/FunnelBadge';

export default function ExplorarLeadsPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filtros
  const [filtroNicho, setFiltroNicho] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  
  // Paginação
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [loading, setLoading] = useState(true);

  // 1. Carregar Todos os Leads do Supabase/Local sem limitação
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getLeadsPaginadosFromSupabase({ page: 1, pageSize: 500 });
      if (res.leads.length > 0) {
        setAllLeads(res.leads);
      } else {
        setAllLeads(getLocalLeads());
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // 2. Classificação RÍGIDA e Automática de Nicho por Lead
  const getLeadNichoCalculado = (lead: Lead): string => {
    const nomeLower = (lead.nome || '').toLowerCase();
    const nichoBanco = (lead.buscas?.nicho || '').toLowerCase();

    if (nomeLower.includes('detail') || nomeLower.includes('estética automotiva') || nomeLower.includes('garage detail') || nichoBanco.includes('estética automotiva')) {
      return 'Estética Automotiva';
    }
    if (nomeLower.includes('auto') || nomeLower.includes('mecânica') || nomeLower.includes('oficina') || nomeLower.includes('câmbio') || nomeLower.includes('óleo') || nomeLower.includes('center') || nichoBanco.includes('mecânica') || nichoBanco.includes('automotivo')) {
      return 'Centro Automotivo / Mecânica';
    }
    if (nomeLower.includes('odonto') || nomeLower.includes('sorriso') || nomeLower.includes('dentista') || nomeLower.includes('orto') || nichoBanco.includes('odonto')) {
      return 'Odontologia';
    }
    
    return lead.buscas?.nicho || 'Outros';
  };

  // 3. Nichos e Cidades Únicos Calculados
  const { nichosDisponiveis, cidadesDisponiveis } = useMemo(() => {
    const nichosSet = new Set<string>();
    const cidadesSet = new Set<string>();

    allLeads.forEach(lead => {
      const nicho = getLeadNichoCalculado(lead);
      if (nicho) nichosSet.add(nicho);
      
      const cidade = lead.buscas?.cidade || lead.cidade;
      if (cidade) cidadesSet.add(cidade);
    });

    return {
      nichosDisponiveis: Array.from(nichosSet).sort(),
      cidadesDisponiveis: Array.from(cidadesSet).sort()
    };
  }, [allLeads]);

  // 4. Filtragem Precisa e Rígida dos Leads
  const leadsFiltrados = useMemo(() => {
    return allLeads.filter(lead => {
      // Filtro por Nicho
      if (filtroNicho !== 'todos') {
        const nichoLead = getLeadNichoCalculado(lead);
        if (nichoLead !== filtroNicho) return false;
      }

      // Filtro por Cidade
      if (filtroCidade !== 'todos') {
        const cidadeLead = lead.buscas?.cidade || lead.cidade;
        if (cidadeLead !== filtroCidade) return false;
      }

      // Filtro por Nível
      if (filtroNivel !== 'todos') {
        if (lead.score_nivel !== filtroNivel) return false;
      }

      // Filtro por Status
      if (filtroStatus !== 'todos') {
        if (lead.status_funil !== filtroStatus) return false;
      }

      // Busca por Nome
      if (buscaTexto.trim()) {
        const texto = buscaTexto.toLowerCase();
        if (!lead.nome.toLowerCase().includes(texto)) return false;
      }

      return true;
    });
  }, [allLeads, filtroNicho, filtroCidade, filtroNivel, filtroStatus, buscaTexto]);

  // 5. Paginação dos Resultados Filtrados
  const totalCount = leadsFiltrados.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const leadsPaginados = useMemo(() => {
    const from = (page - 1) * pageSize;
    return leadsFiltrados.slice(from, from + pageSize);
  }, [leadsFiltrados, page, pageSize]);

  const handleCopiarMensagem = (lead: Lead) => {
    const texto = lead.mensagem_editada || lead.mensagem_sugerida || '';
    navigator.clipboard.writeText(texto);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Explorar Leads</h1>
          <p className="text-slate-400 text-sm mt-1">
            Empresas capturadas pelo EIXO-SCOUT no Google Maps ({totalCount} registros nesta visualização).
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Busca por Nome */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={buscaTexto}
            onChange={(e) => {
              setBuscaTexto(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filtro Nicho / Segmento Rígido */}
        <select
          value={filtroNicho}
          onChange={(e) => {
            setFiltroNicho(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 capitalize focus:outline-none focus:border-blue-500 font-semibold"
        >
          <option value="todos">Todos Os Segmentos</option>
          {nichosDisponiveis.map((nicho) => (
            <option key={nicho} value={nicho} className="capitalize">
              {nicho}
            </option>
          ))}
        </select>

        {/* Filtro Cidade */}
        <select
          value={filtroCidade}
          onChange={(e) => {
            setFiltroCidade(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="todos">Todas as Cidades</option>
          {cidadesDisponiveis.map((cidade) => (
            <option key={cidade} value={cidade}>
              {cidade}
            </option>
          ))}
        </select>

        {/* Filtro Nível Score */}
        <select
          value={filtroNivel}
          onChange={(e) => {
            setFiltroNivel(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="todos">Todos os Níveis</option>
          <option value="alto">🔥 Oportunidade Alta</option>
          <option value="medio">⚠️ Oportunidade Média</option>
          <option value="baixo">✅ Oportunidade Baixa</option>
        </select>

        {/* Filtro Status Funil */}
        <select
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="todos">Todos os Status</option>
          <option value="Novo">Novo</option>
          <option value="Contatado">Contatado</option>
          <option value="Aceitou Diagnóstico">Aceitou Diagnóstico</option>
          <option value="Em Negociação">Em Negociação</option>
          <option value="Cliente">Cliente</option>
          <option value="Descartado">Descartado</option>
        </select>

      </div>

      {/* Tabela Principal de Leads */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Empresa</th>
                <th className="px-4 py-3.5">Maps</th>
                <th className="px-4 py-3.5">GMB (Nota / Aval.)</th>
                <th className="px-4 py-3.5">Site & Redes</th>
                <th className="px-4 py-3.5">Oportunidade</th>
                <th className="px-4 py-3.5">Funil</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Carregando leads do Supabase...
                  </td>
                </tr>
              ) : leadsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum lead encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                leadsPaginados.map((lead) => {
                  const pathDiagnostico = `/diagnostico/${lead.slug && lead.slug !== 'null' ? lead.slug : lead.id}`;
                  return (
                    <tr key={lead.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* Nome & Telefone */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{lead.nome}</div>
                        <div className="text-xs text-slate-400">{lead.telefone || 'Sem telefone'}</div>
                      </td>

                      {/* Posição no Maps */}
                      <td className="px-4 py-3.5 font-bold text-slate-200">
                        #{lead.posicao_maps}
                      </td>

                      {/* Indicadores GMB */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 font-semibold text-slate-200">
                          <span>⭐ {lead.gmb_nota || 'N/A'}</span>
                          <span className="text-xs text-slate-400">({lead.gmb_avaliacoes || 0})</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {lead.gmb_verificado ? '✅ Verificado' : '❌ Não verificado'}
                        </div>
                      </td>

                      {/* Presença Web */}
                      <td className="px-4 py-3.5 text-xs space-y-0.5">
                        <div>Site: {lead.site ? (lead.site_https ? '✅ HTTPS' : '⚠️ HTTP') : '❌ Sem site'}</div>
                        <div>Responsivo: {lead.site_responsivo ? '✅ Sim' : '❌ Não'}</div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5">
                        <ScoreBadge nivel={lead.score_nivel} pontos={lead.score_pontos} />
                      </td>

                      {/* Status Funil */}
                      <td className="px-4 py-3.5">
                        <FunnelBadge status={lead.status_funil} />
                      </td>

                      {/* Ações inline */}
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleCopiarMensagem(lead)}
                          title="Copiar mensagem sugerida para WhatsApp"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 inline-flex items-center gap-1 text-xs px-2"
                        >
                          {copiedId === lead.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === lead.id ? 'Copiado' : 'Copiar'}</span>
                        </button>

                        <Link
                          href={pathDiagnostico}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 inline-flex items-center gap-1 text-xs px-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Diagnóstico</span>
                        </Link>

                        <Link
                          href={`/leads/${lead.id}`}
                          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium inline-flex items-center gap-1 text-xs px-2.5"
                        >
                          <span>Detalhes</span>
                        </Link>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Paginação */}
        <div className="bg-slate-950/80 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
          <div>
            Mostrando <span className="font-semibold text-slate-200">{leadsPaginados.length}</span> de{' '}
            <span className="font-semibold text-slate-200">{totalCount}</span> registros (Página {page} de {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded bg-slate-950 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
