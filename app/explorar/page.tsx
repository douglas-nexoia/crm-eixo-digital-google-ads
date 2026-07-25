'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Copy, Check, FileText } from 'lucide-react';
import { getLeadsFromSupabase } from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';
import { FunnelBadge } from '@/components/FunnelBadge';

export default function ExplorarLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroNicho, setFiltroNicho] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      const sbLeads = await getLeadsFromSupabase();
      if (sbLeads.length > 0) {
        setLeads(sbLeads);
      } else {
        setLeads(getLocalLeads());
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  const nichosUnicos = Array.from(new Set(leads.map(l => l.buscas?.nicho || 'odontologia')));
  const cidadesUnicas = Array.from(new Set(leads.map(l => l.buscas?.cidade || 'Jundiaí/SP')));

  const leadsFiltrados = leads.filter((lead) => {
    if (filtroNivel !== 'todos' && lead.score_nivel !== filtroNivel) return false;
    if (filtroStatus !== 'todos' && lead.status_funil !== filtroStatus) return false;
    if (buscaTexto && !lead.nome.toLowerCase().includes(buscaTexto.toLowerCase())) return false;
    return true;
  });

  const handleCopiarMensagem = (lead: Lead) => {
    const texto = lead.mensagem_editada || lead.mensagem_sugerida || '';
    navigator.clipboard.writeText(texto);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Explorar Leads</h1>
        <p className="text-slate-400 text-sm mt-1">
          Navegue por empresas capturadas no Google Maps, filtre por indicadores e gerencie abordagens.
        </p>
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
            onChange={(e) => setBuscaTexto(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filtro Nível Score */}
        <select
          value={filtroNivel}
          onChange={(e) => setFiltroNivel(e.target.value)}
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
          onChange={(e) => setFiltroStatus(e.target.value)}
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

        {/* Filtro Nicho */}
        <select
          value={filtroNicho}
          onChange={(e) => setFiltroNicho(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="todos">Todos os Nichos</option>
          {nichosUnicos.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* Filtro Cidade */}
        <select
          value={filtroCidade}
          onChange={(e) => setFiltroCidade(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="todos">Todas as Cidades</option>
          {cidadesUnicas.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
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
              ) : leadsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                leadsFiltrados.map((lead) => (
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
                        href={`/diagnostico/${lead.slug}`}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
