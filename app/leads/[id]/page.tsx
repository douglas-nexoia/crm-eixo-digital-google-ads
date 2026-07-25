'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Copy, Check, FileText, Save, 
  Phone, Globe, AlertCircle, MessageSquare, Sparkles, Clock, PlusCircle
} from 'lucide-react';
import { getLocalLeads, saveLocalLead } from '@/lib/storage';
import { getLeadBySlugOrIdFromSupabase, updateLeadInSupabase } from '@/lib/supabase-service';
import { enviarMensagemEvolutionAPI } from '@/lib/evolution-service';
import { gerarMensagemAbordagemIA } from '@/lib/openai-service';
import { gerarMensagemPadrao } from '@/lib/mensagem-template';
import { Lead, StatusFunil } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';

export default function LeadDetalhesPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [mensagemText, setMensagemText] = useState<string>('');
  const [historicoNotas, setHistoricoNotas] = useState<string>('');
  const [novaNota, setNovaNota] = useState<string>('');
  const [statusFunil, setStatusFunil] = useState<StatusFunil>('Novo');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Estados de IA e Disparo
  const [generatingIA, setGeneratingIA] = useState(false);
  const [sendingEvolution, setSendingEvolution] = useState(false);
  const [evolutionFeedback, setEvolutionFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    async function loadLead() {
      let targetLead: Lead | null = await getLeadBySlugOrIdFromSupabase(leadId);
      
      if (!targetLead) {
        const allLeads = getLocalLeads();
        targetLead = allLeads.find(l => l.id === leadId) || null;
      }

      if (targetLead) {
        setLead(targetLead);
        setHistoricoNotas(targetLead.notas || '');
        setStatusFunil(targetLead.status_funil);

        let msg = targetLead.mensagem_editada || targetLead.mensagem_sugerida;
        if (!msg || !msg.trim()) {
          msg = gerarMensagemPadrao(targetLead, targetLead.buscas?.nicho, targetLead.buscas?.cidade);
        }

        setMensagemText(msg);
      }
    }
    loadLead();
  }, [leadId]);

  if (!lead) {
    return (
      <div className="p-8 text-slate-400">
        <p>Carregando dados do lead...</p>
      </div>
    );
  }

  const handleRegerarComIA = async () => {
    setGeneratingIA(true);
    const novaMsg = await gerarMensagemAbordagemIA(lead, lead.buscas?.nicho, lead.buscas?.cidade);
    setMensagemText(novaMsg);
    setGeneratingIA(false);
  };

  const handleCopiarMensagem = () => {
    navigator.clipboard.writeText(mensagemText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Disparo com Registro Automático no Histórico e Funil
  const handleEnviarEvolution = async () => {
    if (!lead.telefone) {
      setEvolutionFeedback({ success: false, msg: 'Este lead não possui telefone cadastrado.' });
      return;
    }

    setSendingEvolution(true);
    setEvolutionFeedback(null);

    const res = await enviarMensagemEvolutionAPI(lead.telefone, mensagemText);
    setSendingEvolution(false);

    if (res.success) {
      setEvolutionFeedback({ success: true, msg: res.message || 'Mensagem enviada com sucesso!' });
      
      // Registrar no Histórico Automático
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR');
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const registroAutomatico = `[${dataFormatada} às ${horaFormatada}] Mensagem enviada pelo WhatsApp`;
      const novoHistorico = historicoNotas ? `${registroAutomatico}\n${historicoNotas}` : registroAutomatico;

      const dataContato = agora.toISOString();
      const updates = {
        mensagem_editada: mensagemText,
        notas: novoHistorico,
        status_funil: 'Contatado' as StatusFunil,
        data_contato: dataContato
      };

      await updateLeadInSupabase(lead.id, updates);

      const updated: Lead = {
        ...lead,
        ...updates
      };
      saveLocalLead(updated);
      setLead(updated);
      setHistoricoNotas(novoHistorico);
      setStatusFunil('Contatado');
    } else {
      setEvolutionFeedback({ 
        success: false, 
        msg: res.error || 'Erro ao conectar ao servidor do WhatsApp. Verifique as credenciais.' 
      });
    }
  };

  // Adicionar Nova Anotação do Vendedor
  const handleAdicionarNota = async () => {
    if (!novaNota.trim()) return;

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const novaLinha = `[${dataFormatada} às ${horaFormatada}] ${novaNota.trim()}`;
    const novoHistorico = historicoNotas ? `${novaLinha}\n${historicoNotas}` : novaLinha;

    const updates = {
      notas: novoHistorico,
      status_funil: statusFunil
    };

    await updateLeadInSupabase(lead.id, updates);

    const updated: Lead = {
      ...lead,
      ...updates
    };
    saveLocalLead(updated);
    setLead(updated);
    setHistoricoNotas(novoHistorico);
    setNovaNota('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSalvarAlteracoes = async () => {
    const updates = {
      mensagem_editada: mensagemText,
      notas: historicoNotas,
      status_funil: statusFunil
    };

    await updateLeadInSupabase(lead.id, updates);

    const updated: Lead = {
      ...lead,
      ...updates
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

      {/* Grid de Indicadores e Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1: Indicadores e Falhas */}
        <div className="space-y-6">
          
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Indicadores de Presença</h2>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Posição no Maps</span>
                <span className="font-bold text-slate-100">
                  {lead.posicao_maps ? `${lead.posicao_maps}ª posição` : 'N/A'}
                </span>
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

          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-5 space-y-3">
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider">Falhas Identificadas (Score)</h2>
            <ul className="space-y-2 text-xs text-red-200">
              {lead.score_detalhes?.map((detalhe, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>{detalhe}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Coluna 2 e 3: Editor de Mensagem e Histórico */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100">Mensagem Sugerida de Abordagem</h2>
                <p className="text-xs text-slate-400">Edite a mensagem antes de disparar pelo WhatsApp.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegerarComIA}
                  disabled={generatingIA}
                  className="flex items-center gap-1.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  title="Gerar nova copy com OpenAI / ChatGPT"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{generatingIA ? 'Gerando IA...' : 'Regerar com IA'}</span>
                </button>

                <Link
                  href={`/diagnostico/${lead.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Diagnóstico Web</span>
                </Link>
              </div>
            </div>

            <textarea
              value={mensagemText}
              onChange={(e) => setMensagemText(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
            />

            {/* Banner de Feedback */}
            {evolutionFeedback && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-xs ${
                evolutionFeedback.success 
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' 
                  : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}>
                {evolutionFeedback.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span>{evolutionFeedback.msg}</span>
              </div>
            )}

            {/* Painel de Botões de Ação */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Botão de Envio Direto (Atualiza Status + Registra Histórico Automático) */}
                <button
                  onClick={handleEnviarEvolution}
                  disabled={sendingEvolution}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{sendingEvolution ? 'Disparando...' : 'Enviar pelo WhatsApp'}</span>
                </button>

                <button
                  onClick={handleCopiarMensagem}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-lg text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
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

          {/* Histórico Automático + Nova Anotação */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Histórico de Atividades & Anotações</span>
              </h2>
            </div>

            {/* Adicionar Nova Anotação */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdicionarNota()}
                placeholder="Escreva uma nova anotação sobre este lead..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAdicionarNota}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Caixa do Histórico/Linha do Tempo */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {historicoNotas ? (
                historicoNotas
              ) : (
                <span className="text-slate-600 font-sans italic">Nenhum evento ou anotação cadastrada para este lead.</span>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
