'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Copy, Check, Send, FileText, Save, ExternalLink, 
  MapPin, Phone, Globe, Star, ShieldCheck, Smartphone, Lock
} from 'lucide-react';
import { getLocalLeads, saveLocalLead } from '@/lib/storage';
import { Lead, StatusFunil } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';
import { FunnelBadge } from '@/components/FunnelBadge';

export default function LeadDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [mensagemText, setMensagemText] = useState<string>('');
  const [notasText, setNotasText] = useState<string>('');
  const [statusFunil, setStatusFunil] = useState<StatusFunil>('Novo');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const allLeads = getLocalLeads();
    const found = allLeads.find(l => l.id === leadId);
    if (found) {
      setLead(found);
      setMensagemText(found.mensagem_editada || found.mensagem_sugerida || '');
      setNotasText(found.notas || '');
      setStatusFunil(found.status_funil);
    }
  }, [leadId]);

  if (!lead) {
    return (
      <div className="p-8 text-slate-400">
        <p>Carregando dados do lead...</p>
      </div>
    );
  }

  const handleCopiarMensagem = () => {
    navigator.clipboard.writeText(mensagemText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarcarComoEnviado = () => {
    const updated: Lead = {
      ...lead,
      mensagem_editada: mensagemText,
      notas: notasText,
      status_funil: 'Contatado',
      data_contato: new Date().toISOString()
    };
    saveLocalLead(updated);
    setLead(updated);
    setStatusFunil('Contatado');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSalvarAlteracoes = () => {
    const updated: Lead = {
      ...lead,
      mensagem_editada: mensagemText,
      notas: notasText,
      status_funil: statusFunil
    };
    saveLocalLead(updated);
    setLead(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      
      {/* Botão de Voltar */}
      <Link href="/explorar" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar para lista de leads</span>
      </Link>

      {/* Header do Lead */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white">{lead.nome}</h1>
            <ScoreBadge nivel={lead.score_nivel} pontos={lead.score_pontos} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {lead.telefone || 'Sem telefone'}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {lead.site ? (
                <a href={lead.site} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                  {lead.site}
                </a>
              ) : 'Sem site cadastrado'}
            </span>
          </div>
        </div>

        {/* Mudar Status no Funil */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Status do Funil:</span>
          <select
            value={statusFunil}
            onChange={(e) => setStatusFunil(e.target.value as StatusFunil)}
            className="bg-slate-900 text-slate-100 text-xs font-bold px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="Novo">Novo</option>
            <option value="Contatado">Contatado</option>
            <option value="Aceitou Diagnóstico">Aceitou Diagnóstico</option>
            <option value="Em Negociação">Em Negociação</option>
            <option value="Cliente">Cliente</option>
            <option value="Descartado">Descartado</option>
          </select>
        </div>
      </div>

      {/* Grid com Indicadores e Editor de Mensagem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1: Indicadores e Falhas Detectadas */}
        <div className="space-y-6">
          
          {/* Card Indicadores Digitais */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Indicadores de Presença</h2>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Posição no Maps</span>
                <span className="font-bold text-slate-100">#{lead.posicao_maps}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Nota no GMB</span>
                <span className="font-bold text-amber-400">⭐ {lead.gmb_nota || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Qtd Avaliações</span>
                <span className="font-bold text-slate-100">{lead.gmb_avaliacoes || 0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">GMB Verificado</span>
                <span>{lead.gmb_verificado ? '✅ Sim' : '❌ Não'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Tem Site</span>
                <span>{lead.site ? '✅ Sim' : '❌ Não'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">HTTPS Seguro</span>
                <span>{lead.site_https ? '✅ Sim' : '❌ Não'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Site Responsivo</span>
                <span>{lead.site_responsivo ? '✅ Sim' : '❌ Não'}</span>
              </div>
            </div>
          </div>

          {/* Card Falhas Identificadas */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">Falhas Identificadas (Score)</h2>
            <ul className="space-y-2 text-xs text-red-200">
              {lead.score_detalhes.map((detalhe, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>{detalhe}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Coluna 2 e 3: Editor de Mensagem, Ações e Notas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Gestão de Mensagem de Prospecção */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100">Mensagem Sugerida de Abordagem</h2>
                <p className="text-xs text-slate-400">Revise e edite a mensagem antes de copiar para o WhatsApp.</p>
              </div>
              
              <Link
                href={`/diagnostico/${lead.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Diagnóstico Web</span>
              </Link>
            </div>

            {/* Textarea da Mensagem */}
            <textarea
              value={mensagemText}
              onChange={(e) => setMensagemText(e.target.value)}
              rows={7}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
            />

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopiarMensagem}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
                  <span>{copied ? 'Copiado para área de transferência!' : 'Copiar Mensagem'}</span>
                </button>

                <button
                  onClick={handleMarcarComoEnviado}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Marcar como Enviado</span>
                </button>
              </div>

              <button
                onClick={handleSalvarAlteracoes}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saved ? 'Salvo!' : 'Salvar Alterações'}</span>
              </button>

            </div>
          </div>

          {/* Campo de Notas Livres */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-200">Anotações do Vendedor</h2>
            <textarea
              value={notasText}
              onChange={(e) => setNotasText(e.target.value)}
              placeholder="Ex: Cliente respondeu no WhatsApp, pediu retorno na terça-feira..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
