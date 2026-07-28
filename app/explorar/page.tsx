'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, Copy, Check, FileText, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, MessageSquare, Send, Sparkles, AlertCircle,
  Pencil, X
} from 'lucide-react';
import { getLeadsPaginadosFromSupabase, getNichosECidadesUnicosFromSupabase, updateLeadInSupabase } from '@/lib/supabase-service';
import { enviarMensagemEvolutionAPI } from '@/lib/evolution-service';
import { gerarMensagemPadrao, gerarMensagemDiagnostico } from '@/lib/mensagem-template';
import { getLocalLeads, saveLocalLead } from '@/lib/storage';
import { Lead, StatusFunil } from '@/lib/types';
import { ScoreBadge } from '@/components/ScoreBadge';
import { FunnelBadge } from '@/components/FunnelBadge';

type SortField = 'nome' | 'nicho' | 'posicao_maps' | 'gmb_nota' | 'gmb_avaliacoes' | 'score_pontos' | 'status_funil';
type SortOrder = 'asc' | 'desc';
type TabEstagio = 'todos' | 'Novo' | 'Contatado' | 'Diagnóstico Enviado' | 'Aceitou Diagnóstico' | 'Em Negociação / Cliente';

export default function ExplorarLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [nichosDisponiveis, setNichosDisponiveis] = useState<string[]>([]);
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edição de telefone na própria linha: o scraper nem sempre acha o número, e
  // sem isto era preciso abrir o lead só para cadastrá-lo. Um por vez basta.
  const [editandoTelefoneId, setEditandoTelefoneId] = useState<string | null>(null);
  const [telefoneInput, setTelefoneInput] = useState('');
  const [salvandoTelefone, setSalvandoTelefone] = useState(false);

  // Sub-Aba de Estágio Selecionada (Inicia padrão em "Novo" para evitar abordar leads já contatados)
  const [tabEstagio, setTabEstagio] = useState<TabEstagio>('Novo');

  // Filtros
  const [filtroNicho, setFiltroNicho] = useState<string>('todos');
  const [filtroCidade, setFiltroCidade] = useState<string>('todos');
  const [filtroNivel, setFiltroNivel] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  
  // Ordenação
  const [sortField, setSortField] = useState<SortField>('posicao_maps');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Paginação
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Estados de Disparo Direto da Lista
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ leadId: string; success: boolean; msg: string } | null>(null);

  const BASE_APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://crm.eixodigitalbr.com.br';

  useEffect(() => {
    async function loadFiltros() {
      const { nichos, cidades } = await getNichosECidadesUnicosFromSupabase();
      setNichosDisponiveis(nichos);
      setCidadesDisponiveis(cidades);
    }
    loadFiltros();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    let statusParam: string | undefined = undefined;
    
    if (tabEstagio === 'Novo') statusParam = 'Novo';
    else if (tabEstagio === 'Contatado') statusParam = 'Contatado';
    else if (tabEstagio === 'Diagnóstico Enviado') statusParam = 'Diagnóstico Enviado';
    else if (tabEstagio === 'Aceitou Diagnóstico') statusParam = 'Aceitou Diagnóstico';
    else if (tabEstagio === 'Em Negociação / Cliente') statusParam = 'Em Negociação';

    const result = await getLeadsPaginadosFromSupabase({
      page,
      pageSize,
      nicho: filtroNicho,
      cidade: filtroCidade,
      scoreNivel: filtroNivel,
      statusFunil: statusParam,
      buscaTexto,
      sortField,
      sortOrder
    });

    if (result.leads.length > 0 || result.totalCount > 0) {
      setLeads(result.leads);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages || 1);
    } else {
      let local = getLocalLeads();
      if (statusParam) {
        local = local.filter(l => l.status_funil === statusParam);
      }
      setLeads(local);
      setTotalCount(local.length);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [page, tabEstagio, filtroNicho, filtroCidade, filtroNivel, buscaTexto, sortField, sortOrder]);

  // Disparo Rápido de Abordagem Direto da Lista
  const handleEnviarAbordagemDireta = async (lead: Lead) => {
    if (!lead.telefone) {
      setActionFeedback({ leadId: lead.id, success: false, msg: 'Sem telefone cadastrado' });
      return;
    }

    setSendingLeadId(lead.id);
    setActionFeedback(null);

    let msg = lead.mensagem_editada || lead.mensagem_sugerida;
    if (!msg || !msg.trim()) {
      msg = gerarMensagemPadrao(lead, lead.nicho || lead.buscas?.nicho, lead.cidade || lead.buscas?.cidade);
    }

    const res = await enviarMensagemEvolutionAPI(lead.telefone, msg);
    setSendingLeadId(null);

    if (res.success) {
      setActionFeedback({ leadId: lead.id, success: true, msg: 'Mensagem Enviada!' });
      
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR');
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const registroAutomatico = `[${dataFormatada} às ${horaFormatada}] Mensagem de Abordagem enviada diretamente da Lista`;
      const novoHistorico = lead.notas ? `${registroAutomatico}\n${lead.notas}` : registroAutomatico;

      const updates = {
        notas: novoHistorico,
        status_funil: 'Contatado' as StatusFunil,
        data_contato: agora.toISOString()
      };

      // A mensagem já saiu. Falha aqui é só do registro, e reenviar mandaria
      // a mensagem duas vezes para o lead.
      const salvo = await updateLeadInSupabase(lead.id, updates);

      if (!salvo) {
        setActionFeedback({
          leadId: lead.id,
          success: false,
          msg: 'Enviada, mas o registro não salvou. Não reenvie.'
        });
        return;
      }
      
      // Atualizar no estado local da lista
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updates } : l));
    } else {
      setActionFeedback({ leadId: lead.id, success: false, msg: res.error || 'Erro no envio' });
    }
  };

  // Disparo Rápido de Diagnóstico Direto da Lista
  const handleEnviarDiagnosticoDireto = async (lead: Lead) => {
    if (!lead.telefone) {
      setActionFeedback({ leadId: lead.id, success: false, msg: 'Sem telefone cadastrado' });
      return;
    }

    setSendingLeadId(lead.id);
    setActionFeedback(null);

    const slugValido = lead.slug && lead.slug !== 'null' ? lead.slug : lead.id;
    const diagnosticoUrl = `${BASE_APP_URL}/diagnostico/${slugValido}`;
    const msg = gerarMensagemDiagnostico(lead, diagnosticoUrl);

    const res = await enviarMensagemEvolutionAPI(lead.telefone, msg);
    setSendingLeadId(null);

    if (res.success) {
      setActionFeedback({ leadId: lead.id, success: true, msg: 'Diagnóstico Enviado!' });
      
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR');
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const registroAutomatico = `[${dataFormatada} às ${horaFormatada}] Link do Diagnóstico enviado diretamente da Lista\n(${diagnosticoUrl})`;
      const novoHistorico = lead.notas ? `${registroAutomatico}\n${lead.notas}` : registroAutomatico;

      // Enviar o link não é o prospect aceitar nada — isso é ação sua. O
      // aceite só existe quando ele pede o diagnóstico avançado na página.
      const updates = {
        notas: novoHistorico,
        status_funil: 'Diagnóstico Enviado' as StatusFunil
      };

      // Mesmo caso: o diagnóstico já foi para o lead.
      const salvo = await updateLeadInSupabase(lead.id, updates);

      if (!salvo) {
        setActionFeedback({
          leadId: lead.id,
          success: false,
          msg: 'Enviado, mas o registro não salvou. Não reenvie.'
        });
        return;
      }

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...updates } : l));
    } else {
      setActionFeedback({ leadId: lead.id, success: false, msg: res.error || 'Erro no envio' });
    }
  };

  // Aceita qualquer máscara; a normalização para o padrão internacional é feita
  // na Edge Function de envio. Aqui só barramos o que nunca poderia ser válido.
  const digitosTelefone = telefoneInput.replace(/\D/g, '');
  const telefoneValido = digitosTelefone.length >= 10 && digitosTelefone.length <= 13;

  const abrirEdicaoTelefone = (lead: Lead) => {
    setTelefoneInput(lead.telefone || '');
    setEditandoTelefoneId(lead.id);
  };

  const handleSalvarTelefone = async (leadId: string) => {
    if (!telefoneValido) return;

    const telefone = telefoneInput.trim();
    setSalvandoTelefone(true);

    const salvo = await updateLeadInSupabase(leadId, { telefone });
    setSalvandoTelefone(false);

    if (!salvo) {
      setActionFeedback({ leadId, success: false, msg: 'Telefone não foi salvo. Veja o console.' });
      return;
    }

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, telefone } : l));
    setEditandoTelefoneId(null);
  };

  // Mudar Status no Funil Direto da Lista
  const handleStatusChangeDireto = async (leadId: string, novoStatus: StatusFunil) => {
    const updates = { status_funil: novoStatus };
    const salvo = await updateLeadInSupabase(leadId, updates);

    // Sem isto o select da lista mudava na tela e voltava sozinho no refresh.
    if (!salvo) {
      setActionFeedback({
        leadId,
        success: false,
        msg: 'Status não foi salvo. Veja o console.'
      });
      return;
    }

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
  };

  const handleSort = (field: SortField) => {
    // A ordenação vale para o conjunto inteiro, então continuar na página 5
    // deixaria o usuário no meio de uma lista que acabou de ser reordenada.
    setPage(1);

    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // O Supabase já devolve a página ordenada; isto precisa reproduzir a mesma
  // regra para não desfazer nada, e serve ao fallback do localStorage, que vem
  // sem ordenação nenhuma.
  const leadsOrdenados = useMemo(() => {
    return [...leads].sort((a, b) => {
      // Mesmo agrupamento por cidade aplicado na query: sem isto, reordenar as
      // 20 linhas só por posição embaralharia as cidades de novo.
      if (sortField === 'posicao_maps' && filtroCidade === 'todos') {
        const cidadeA = a.cidade || a.buscas?.cidade || '';
        const cidadeB = b.cidade || b.buscas?.cidade || '';
        const porCidade = cidadeA.localeCompare(cidadeB);
        if (porCidade !== 0) return porCidade;
      }

      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'nicho') {
        aVal = a.nicho || a.buscas?.nicho || '';
        bVal = b.nicho || b.buscas?.nicho || '';
      }

      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(bVal || '');
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (aVal === undefined || aVal === null) aVal = 0;
      if (bVal === undefined || bVal === null) bVal = 0;

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [leads, sortField, sortOrder, filtroCidade]);

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
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Explorar Leads & Disparo Rápido</h1>
          <p className="text-slate-400 text-sm mt-1">
            Prospecção ativa e gerenciamento do funil de vendas.
          </p>
        </div>
      </div>

      {/* SUB-ABAS POR ESTÁGIO DO FUNIL */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        
        <button
          onClick={() => { setTabEstagio('todos'); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            tabEstagio === 'todos'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>🌐 Todos os Leads</span>
        </button>

        <button
          onClick={() => { setTabEstagio('Novo'); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            tabEstagio === 'Novo'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>🔥 Novos Leads (Prospecção)</span>
        </button>

        <button
          onClick={() => { setTabEstagio('Contatado'); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            tabEstagio === 'Contatado'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>📲 Contatados</span>
        </button>

        <button
          onClick={() => { setTabEstagio('Diagnóstico Enviado'); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            tabEstagio === 'Diagnóstico Enviado'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>📄 Diagnóstico Enviado</span>
        </button>

        {/* Único estágio movido pelo prospect, e não por você: é a aba que
            merece ser olhada primeiro. */}
        <button
          onClick={() => { setTabEstagio('Aceitou Diagnóstico'); setPage(1); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            tabEstagio === 'Aceitou Diagnóstico'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>🙋 Pediu Análise Avançada</span>
        </button>

      </div>

      {/* Barra de Filtros */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
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

        {/* Filtro por Nicho Nativo */}
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

        {/* Filtro por Cidade Nativo */}
        <select
          value={filtroCidade}
          onChange={(e) => {
            setFiltroCidade(e.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 capitalize focus:outline-none focus:border-blue-500"
        >
          <option value="todos">Todas as Cidades</option>
          {cidadesDisponiveis.map((cidade) => (
            <option key={cidade} value={cidade} className="capitalize">
              {cidade}
            </option>
          ))}
        </select>

        {/* Filtro por Nível de Score */}
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

      </div>

      {/* Tabela Principal com Disparo Direto e Ordenação */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800 select-none">
              <tr>
                <th 
                  onClick={() => handleSort('nome')} 
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Empresa {renderSortIcon('nome')}
                </th>
                <th 
                  onClick={() => handleSort('nicho')} 
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Segmento / Cidade {renderSortIcon('nicho')}
                </th>
                <th
                  onClick={() => handleSort('posicao_maps')}
                  title="Posição dentro da busca daquele segmento naquela cidade. Empresas de cidades diferentes têm cada uma o seu #1."
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Posição na Cidade {renderSortIcon('posicao_maps')}
                </th>
                <th 
                  onClick={() => handleSort('gmb_nota')} 
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-100 transition-colors"
                >
                  GMB (Nota / Aval.) {renderSortIcon('gmb_nota')}
                </th>
                <th 
                  onClick={() => handleSort('score_pontos')} 
                  className="px-4 py-3.5 cursor-pointer hover:text-slate-100 transition-colors"
                >
                  Oportunidade {renderSortIcon('score_pontos')}
                </th>
                <th className="px-4 py-3.5">Status do Funil</th>
                <th className="px-4 py-3.5 text-right min-w-[280px]">Disparo Rápido & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Carregando leads do Supabase...
                  </td>
                </tr>
              ) : leadsOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum lead encontrado nesta sub-aba de estágio.
                  </td>
                </tr>
              ) : (
                leadsOrdenados.map((lead) => {
                  const pathDiagnostico = `/diagnostico/${lead.slug && lead.slug !== 'null' ? lead.slug : lead.id}`;
                  const nichoExibicao = lead.nicho || lead.buscas?.nicho || 'Geral';
                  const cidadeExibicao = lead.cidade || lead.buscas?.cidade || '';
                  const isSending = sendingLeadId === lead.id;
                  const feedback = actionFeedback?.leadId === lead.id ? actionFeedback : null;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-900/50 transition-colors">
                      
                      {/* Empresa & Telefone */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{lead.nome}</div>
                        {editandoTelefoneId === lead.id ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              autoFocus
                              value={telefoneInput}
                              onChange={(e) => setTelefoneInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSalvarTelefone(lead.id);
                                if (e.key === 'Escape') setEditandoTelefoneId(null);
                              }}
                              placeholder="(19) 99999-9999"
                              className="bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-slate-100 placeholder:text-slate-600 w-36 outline-none transition-colors"
                            />
                            <button
                              onClick={() => handleSalvarTelefone(lead.id)}
                              disabled={!telefoneValido || salvandoTelefone}
                              title={telefoneValido ? 'Salvar telefone' : 'Informe de 10 a 13 dígitos'}
                              className="p-0.5 rounded text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditandoTelefoneId(null)}
                              title="Cancelar"
                              className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-400 group">
                            <span className={lead.telefone ? '' : 'italic text-slate-500'}>
                              {lead.telefone || 'Sem telefone'}
                            </span>
                            <button
                              onClick={() => abrirEdicaoTelefone(lead)}
                              title={lead.telefone ? 'Editar telefone' : 'Adicionar telefone'}
                              className="p-0.5 rounded text-slate-600 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        
                        {/* Feedback inline caso envie mensagem */}
                        {feedback && (
                          <div className={`text-[10px] font-bold mt-1 ${feedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                            {feedback.msg}
                          </div>
                        )}
                      </td>

                      {/* Segmento & Cidade */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-semibold text-blue-400 capitalize">{nichoExibicao}</div>
                        <div className="text-slate-400 capitalize">{cidadeExibicao}</div>
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
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3.5">
                        <ScoreBadge nivel={lead.score_nivel} pontos={lead.score_pontos} />
                      </td>

                      {/* Status do Funil com Seletor Direto */}
                      <td className="px-4 py-3.5">
                        <select
                          value={lead.status_funil}
                          onChange={(e) => handleStatusChangeDireto(lead.id, e.target.value as StatusFunil)}
                          className="bg-slate-950 text-slate-200 text-xs font-bold px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="Novo">Novo</option>
                          <option value="Contatado">Contatado</option>
                          <option value="Diagnóstico Enviado">Diagnóstico Enviado</option>
                          <option value="Aceitou Diagnóstico">Aceitou Diagnóstico</option>
                          <option value="Em Negociação">Em Negociação</option>
                          <option value="Cliente">Cliente</option>
                          <option value="Descartado">Descartado</option>
                        </select>
                      </td>

                      {/* Ações de Disparo Rápido no WhatsApp (Sem precisar abrir a tela) */}
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        
                        {/* Botão Disparar Abordagem */}
                        <button
                          onClick={() => handleEnviarAbordagemDireta(lead)}
                          disabled={isSending}
                          title="Enviar mensagem de abordagem no WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 inline-flex items-center gap-1 text-xs px-2.5 font-bold transition-all disabled:opacity-50"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isSending ? '...' : 'Abordar'}</span>
                        </button>

                        {/* Botão Disparar Diagnóstico */}
                        <button
                          onClick={() => handleEnviarDiagnosticoDireto(lead)}
                          disabled={isSending}
                          title="Enviar link do Diagnóstico Web no WhatsApp"
                          className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 inline-flex items-center gap-1 text-xs px-2.5 font-bold transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{isSending ? '...' : 'Enviar Diag.'}</span>
                        </button>

                        {/* Ver Diagnóstico Web */}
                        <Link
                          href={pathDiagnostico}
                          target="_blank"
                          title="Ver Diagnóstico Público Web em nova aba"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 inline-flex items-center gap-1 text-xs px-2"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>

                        {/* Editar Detalhes */}
                        <Link
                          href={`/leads/${lead.id}`}
                          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold inline-flex items-center gap-1 text-xs px-2"
                        >
                          <span>Ver</span>
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
            Mostrando <span className="font-semibold text-slate-200">{leadsOrdenados.length}</span> de{' '}
            <span className="font-semibold text-slate-200">{totalCount}</span> registros
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
