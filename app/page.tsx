'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Users, Flame, AlertTriangle, CheckCircle, ArrowRight, MapPin, Sparkles } from 'lucide-react';
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
    const sbBuscas = await getBuscasFromSupabase();
    const sbLeads = await getLeadsFromSupabase();

    setBuscas(sbBuscas);
    setLeads(sbLeads);
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
    'Aguardando Diagnóstico': leads.filter(l => l.status_funil === 'Aguardando Diagnóstico').length,
    'Diagnóstico Enviado': leads.filter(l => l.status_funil === 'Diagnóstico Enviado').length,
    'Aceitou Diagnóstico': leads.filter(l => l.status_funil === 'Aceitou Diagnóstico').length,
    'Em Negociação': leads.filter(l => l.status_funil === 'Em Negociação').length,
    'Cliente': leads.filter(l => l.status_funil === 'Cliente').length,
    'Descartado': leads.filter(l => l.status_funil === 'Descartado').length,
  };

  /**
   * Taxas do funil.
   *
   * `status_funil` guarda só o estágio ATUAL, então quem virou cliente não
   * aparece mais em "Contatado". Para medir passagem de etapa é preciso contar
   * de forma cumulativa: quem está em Cliente também passou por todas as
   * anteriores.
   *
   * Isto só começou a significar alguma coisa depois que o envio do link
   * deixou de marcar "Aceitou Diagnóstico" — antes o número media o seu
   * próprio clique, não a reação do prospect.
   */
  const contatados =
    funilCounts['Contatado'] +
    funilCounts['Diagnóstico Enviado'] +
    funilCounts['Aceitou Diagnóstico'] +
    funilCounts['Em Negociação'] +
    funilCounts['Cliente'];

  const diagnosticosEnviados =
    funilCounts['Diagnóstico Enviado'] +
    funilCounts['Aceitou Diagnóstico'] +
    funilCounts['Em Negociação'] +
    funilCounts['Cliente'];

  const pediramAnalise =
    funilCounts['Aceitou Diagnóstico'] +
    funilCounts['Em Negociação'] +
    funilCounts['Cliente'];

  // Sem base, "0%" mentiria: nada foi tentado ainda.
  const taxa = (parte: number, total: number): string =>
    total > 0 ? `${Math.round((parte / total) * 100)}%` : '—';

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-[1200px] mx-auto font-inter">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full">
              Visão Geral
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit tracking-tight text-white">
            Dashboard de Prospecção
          </h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Gestão estratégica de oportunidades e auditorias no Google Maps.
          </p>
        </div>

        {/* Botão Primário do Design System */}
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center justify-center gap-2.5 bg-[#10B981] hover:bg-[#22C55E] text-[#08130F] font-bold px-6 py-3 rounded-[10px] shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all text-sm self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Importar Nova Busca</span>
        </button>
      </div>

      {/* Cards de Métricas Principais (Estilo Design System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-semibold uppercase tracking-wider font-outfit">Total de Leads</span>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-3xl font-black font-outfit text-white">{totalLeads}</p>
          <p className="text-xs text-[#64748B]">Empresas auditadas no sistema</p>
        </div>

        {/* Mesma correção do ScoreBadge: o destaque acompanha o que merece
            ação. Antes o cartão verde com ✅ era o dos piores alvos. */}
        <div className="bg-[#0E1424] border border-[#10B981]/30 rounded-[16px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-[#10B981]">
            <span className="text-xs font-semibold uppercase tracking-wider font-outfit">Oportunidade Alta</span>
            <Flame className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-3xl font-black font-outfit text-[#10B981]">{altoCount}</p>
          <p className="text-xs text-[#64748B]">Aborde estes primeiro</p>
        </div>

        <div className="bg-[#0E1424] border border-amber-500/20 rounded-[16px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider font-outfit">Oportunidade Média</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black font-outfit text-amber-400">{medioCount}</p>
          <p className="text-xs text-[#64748B]">Potencial intermediário</p>
        </div>

        <div className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-semibold uppercase tracking-wider font-outfit">Oportunidade Baixa</span>
            <CheckCircle className="w-4 h-4 text-[#64748B]" />
          </div>
          <p className="text-3xl font-black font-outfit text-[#64748B]">{baixoCount}</p>
          <p className="text-xs text-[#64748B]">Já têm presença forte — deixe por último</p>
        </div>

      </div>

      {/* Visão do Funil */}
      <div className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold font-outfit text-white">Estágios do Funil de Vendas</h2>
          <span className="text-xs text-[#94A3B8]">Status atualizados</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(funilCounts) as StatusFunil[]).map((status) => (
            <div key={status} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-3 text-center space-y-1 hover:border-[#10B981]/40 transition-all">
              <span className="text-xs text-[#94A3B8] block font-medium truncate">{status}</span>
              <span className="text-xl font-bold font-outfit text-white">{funilCounts[status]}</span>
            </div>
          ))}
        </div>

        {/* As duas taxas que dizem se a abordagem e o relatório funcionam.
            Contagem cumulativa, porque o status guarda só o estágio atual. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-[#94A3B8] font-medium">Aceitaram receber o diagnóstico</span>
              <span className="text-2xl font-bold font-outfit text-white shrink-0">
                {taxa(diagnosticosEnviados, contatados)}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              {diagnosticosEnviados} de {contatados} abordados · mede a mensagem de abordagem
            </p>
          </div>

          <div className="bg-[rgba(255,255,255,0.03)] border border-[#10B981]/25 rounded-[12px] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-[#94A3B8] font-medium">Pediram a análise avançada</span>
              <span className="text-2xl font-bold font-outfit text-[#10B981] shrink-0">
                {taxa(pediramAnalise, diagnosticosEnviados)}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              {pediramAnalise} de {diagnosticosEnviados} que receberam · mede o relatório
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Buscas Recentes e Principais Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabela de Buscas */}
        <div className="lg:col-span-2 bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-outfit text-white">Últimas Buscas Importadas</h2>
            <Link href="/explorar" className="text-xs text-[#10B981] hover:underline flex items-center gap-1 font-semibold">
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-[rgba(255,255,255,0.06)]">
            <table className="w-full text-left text-sm text-[#F1F5F9] border-collapse">
              <thead className="text-xs uppercase bg-[#0B0F19] text-[#94A3B8] font-outfit font-bold tracking-wider border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="px-4 py-3">Nicho</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Empresas</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {buscas.map((b) => (
                  <tr key={b.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                    <td className="px-4 py-3 font-semibold font-outfit text-white capitalize">{b.nicho}</td>
                    <td className="px-4 py-3 text-[#94A3B8] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>{b.cidade}</span>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] font-medium">{b.total_encontradas}</td>
                    <td className="px-4 py-3 text-right">
                      <Link 
                        href={`/ranking?nicho=${encodeURIComponent(b.nicho)}&cidade=${encodeURIComponent(b.cidade)}`}
                        className="text-xs bg-[rgba(255,255,255,0.04)] hover:bg-[#10B981] hover:text-[#08130F] text-[#F1F5F9] font-bold px-3 py-1.5 rounded-[8px] border border-[rgba(255,255,255,0.12)] hover:border-[#10B981] transition-all inline-block"
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
        <div className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold font-outfit text-white">Leads Prioritários (🔥 Alto)</h2>
          </div>

          <div className="space-y-3">
            {leads
              .filter((l) => l.score_nivel === 'alto')
              .slice(0, 4)
              .map((lead) => (
                <div key={lead.id} className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[12px] p-3.5 space-y-2.5 hover:border-[#10B981]/40 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <h3 className="font-bold font-outfit text-white text-sm truncate leading-snug">{lead.nome}</h3>
                      <p className="text-xs text-[#94A3B8]">Maps #{lead.posicao_maps} • Nota {lead.gmb_nota || 'N/A'}</p>
                    </div>
                    <ScoreBadge nivel={lead.score_nivel} pontos={lead.score_pontos} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <FunnelBadge status={lead.status_funil} />
                    <Link href={`/leads/${lead.id}`} className="text-xs text-[#10B981] hover:underline font-bold flex items-center gap-1">
                      <span>Gerenciar</span>
                      <ArrowRight className="w-3 h-3" />
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
