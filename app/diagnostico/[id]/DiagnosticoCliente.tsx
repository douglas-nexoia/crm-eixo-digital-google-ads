'use client';

import React, { useState, useEffect } from 'react';
import {
  getDiagnosticoPublicoBySlugOrId,
  getTopConcorrentesDoMesmoNicho,
  solicitarDiagnosticoAvancado,
} from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { buscarDemanda, fraseDemanda, FONTE_DEMANDA } from '@/lib/demanda-busca';
import {
  AlertTriangle, MessageCircle, MapPin, Megaphone,
  Sparkles, Zap, ArrowUpRight, CheckCircle2
} from 'lucide-react';

type LinhaComparativo = {
  id: string;
  nome: string;
  posicao_maps: number;
  gmb_nota?: number | null;
  gmb_avaliacoes?: number | null;
  isLead: boolean;
};

/**
 * Nota no Google exige pelo menos uma avaliação, então "5.0 com 0 opiniões" é
 * dado inválido — venha do robô ou de correção manual. Exibir isso no
 * relatório do cliente derruba a credibilidade de todas as outras linhas.
 *
 * Avaliações em null é caso diferente: significa "não coletado", e aí não dá
 * para invalidar a nota.
 */
function notaValida(nota?: number | null, avaliacoes?: number | null): number | null {
  if (typeof nota !== 'number') return null;
  if (avaliacoes === 0) return null;
  return nota;
}

/**
 * Os gargalos chegam do robô em linguagem de qualificação interna ("Sem
 * Facebook", "Nota GMB muito baixa"). Isso é vocabulário seu, não do dono do
 * negócio, e lido em sequência vira boletim de notas — fecha a pessoa em vez
 * de abrir. Aqui cada um vira a consequência que ele causa.
 *
 * O texto original passa direto quando nenhum padrão bate: melhor um item em
 * linguagem técnica do que um item sumido.
 */
const TRADUCAO_GARGALOS: Array<{ padrao: RegExp; texto: string }> = [
  {
    padrao: /sem site/i,
    texto: 'Sem site próprio: quem pesquisa antes de contratar não encontra seus trabalhos e acaba no concorrente que tem.',
  },
  {
    padrao: /https|certificado/i,
    texto: 'Site sem certificado de segurança: o navegador avisa "site não seguro" antes da pessoa ver qualquer coisa.',
  },
  {
    padrao: /responsiv|celular/i,
    texto: 'Site não adaptado ao celular: é de onde vem a maior parte das buscas por serviço local.',
  },
  {
    padrao: /nota.*baix|baix.*nota/i,
    texto: 'Nota abaixo da dos líderes: é o primeiro número que aparece na busca, antes do nome e do telefone.',
  },
  {
    padrao: /poucas avalia/i,
    texto: 'Poucas avaliações: nota alta apoiada em poucas opiniões não convence quem está escolhendo entre três empresas.',
  },
  {
    padrao: /n[ãa]o verificad/i,
    texto: 'Perfil não verificado: o Google limita o alcance de perfis sem verificação na busca local.',
  },
  {
    padrao: /instagram|facebook|rede/i,
    texto: 'Sem presença nas redes sociais: quem pesquisa o nome da empresa antes de ligar não encontra nada além do mapa.',
  },
];

function traduzirGargalo(bruto: string): string {
  return TRADUCAO_GARGALOS.find(t => t.padrao.test(bruto))?.texto ?? bruto;
}

/**
 * O slug chega por prop, e não mais por useParams: a página virou Server
 * Component para conseguir montar as etiquetas Open Graph, e ela já resolveu
 * o parâmetro antes de renderizar isto.
 */
export default function DiagnosticoCliente({ slug }: { slug: string }) {
  const slugParam = slug || '';

  const [lead, setLead] = useState<Lead | null>(null);
  const [concorrentesTop, setConcorrentesTop] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // O estado do pedido não vem do banco: `status_funil` é dado interno do
  // funil e fica de fora da view pública de propósito. Recarregar a página
  // mostra o botão de novo, mas um segundo clique não reenvia nada — a Edge
  // Function é idempotente e devolve `jaSolicitado`.
  const [pedido, setPedido] = useState<'idle' | 'enviando' | 'feito' | 'erro'>('idle');
  const [erroPedido, setErroPedido] = useState<string | null>(null);

  const MEU_NUMERO_WHATSAPP = '5511944530448';

  useEffect(() => {
    async function loadData() {
      if (!slugParam) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let found: Lead | null = await getDiagnosticoPublicoBySlugOrId(slugParam);

      if (!found) {
        const allLocal = getLocalLeads();
        found = allLocal.find(l => l.slug === slugParam || l.id === slugParam || l.nome.toLowerCase().includes(slugParam.toLowerCase())) || null;
      }

      if (found) {
        setLead(found);

        try {
          if (found.busca_id) {
            const topConcorrentes = await getTopConcorrentesDoMesmoNicho(found);
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
      <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col items-center justify-center p-6 space-y-4 font-inter">
        <div className="w-12 h-12 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#94A3B8] text-sm font-medium">Gerando diagnóstico de visibilidade digital...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col items-center justify-center p-6 text-center space-y-4 font-inter">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold font-outfit text-white">Diagnóstico Não Encontrado</h2>
          <p className="text-sm text-[#94A3B8]">
            Verifique se a empresa está cadastrada ou se o link enviado possui o identificador correto.
          </p>
        </div>
      </div>
    );
  }

  // A view pública já entrega `nicho` resolvido; `buscas` é o formato antigo,
  // que ainda chega pelo fallback do localStorage.
  const nichoLead = lead.nicho || lead.buscas?.nicho;

  const notaLead = notaValida(lead.gmb_nota, lead.gmb_avaliacoes);

  const cidadeLead = lead.cidade || lead.buscas?.cidade;

  // Só aparece quando o par nicho+cidade foi medido de verdade no Planejador.
  // Sem dado, o bloco inteiro some — nenhum número é inferido.
  const demanda = buscarDemanda(nichoLead, cidadeLead);
  const textoDemanda = fraseDemanda(nichoLead, cidadeLead);

  /**
   * Termo, local e data da coleta. Cada parte só entra se existir, para a
   * frase nunca ficar com buraco — e some inteira se não houver nada, em vez
   * de exibir uma linha pela metade.
   */
  const contextoBusca = (() => {
    const partes: string[] = [];

    if (nichoLead && cidadeLead) {
      partes.push(`Posição para a busca por "${nichoLead} em ${cidadeLead}" no Google Maps`);
    } else if (cidadeLead) {
      partes.push(`Posição nas buscas do Google Maps em ${cidadeLead}`);
    }

    if (lead.data_busca) {
      const data = new Date(lead.data_busca);
      if (!Number.isNaN(data.getTime())) {
        partes.push(`dados coletados em ${data.toLocaleDateString('pt-BR')}`);
      }
    }

    return partes.length > 0 ? `${partes.join(' · ')}.` : null;
  })();

  const gargalos = Array.from(
    // Instagram e Facebook chegam como dois itens e traduzem para a mesma
    // consequência; sem o Set o relatório repetiria o cartão.
    new Set((lead.score_detalhes ?? []).map(traduzirGargalo))
  );

  /**
   * Todos na mesma tabela, ordenados pela posição real. O lead não é mais
   * fixado no topo: se ele está em #6, aparece abaixo dos líderes — é essa
   * distância que comunica o problema.
   */
  const linhasComparativo: LinhaComparativo[] = [
    {
      id: lead.id,
      nome: lead.nome,
      posicao_maps: lead.posicao_maps,
      gmb_nota: notaLead,
      gmb_avaliacoes: lead.gmb_avaliacoes,
      isLead: true,
    },
    ...concorrentesTop.map(c => ({
      id: c.id,
      nome: c.nome,
      posicao_maps: c.posicao_maps,
      gmb_nota: notaValida(c.gmb_nota, c.gmb_avaliacoes),
      gmb_avaliacoes: c.gmb_avaliacoes,
      isLead: false,
    })),
  ].sort((a, b) => (a.posicao_maps ?? 999) - (b.posicao_maps ?? 999));

  // Posições que existem entre duas linhas e não estão sendo exibidas.
  function lacunaAntesDe(idx: number): number {
    if (idx === 0) return 0;
    const anterior = linhasComparativo[idx - 1].posicao_maps;
    const atual = linhasComparativo[idx].posicao_maps;
    if (!anterior || !atual) return 0;
    return Math.max(0, atual - anterior - 1);
  }

  // Se nenhum líder tem site, o ranking está sendo disputado só no perfil do
  // Google — e o espaço do tráfego pago está vazio na região.
  const lideresSemSite = concorrentesTop.length > 0 && concorrentesTop.every(c => !c.site);

  // Só é "1º colocado" quem está de fato em #1. A versão anterior caía no
  // primeiro item da lista e chegava a chamar o #2 de líder.
  const primeiroColocado = concorrentesTop.find(c => c.posicao_maps === 1) || null;

  const notaPrimeiro = primeiroColocado
    ? notaValida(primeiroColocado.gmb_nota, primeiroColocado.gmb_avaliacoes)
    : null;

  // Afirmar "nota inferior à sua" exige os dois números na mão: antes isso
  // imprimia "nota undefined" quando o concorrente vinha sem nota coletada.
  const lideraComNotaMenor =
    primeiroColocado !== null &&
    notaPrimeiro !== null &&
    notaLead !== null &&
    notaPrimeiro < notaLead;

  /**
   * Nota alta apoiada em 2 opiniões não vale o mesmo que a mesma nota apoiada
   * em 30. Quando o lead tem volume e os líderes não, essa é a carta mais
   * forte da página — e só apareceu depois que a coluna de avaliações passou a
   * trazer número.
   */
  const avaliacoesLead = lead.gmb_avaliacoes ?? null;
  const lideresComMenosOpinioes = concorrentesTop.filter(
    c => typeof c.gmb_avaliacoes === 'number' &&
         avaliacoesLead !== null &&
         c.gmb_avaliacoes < avaliacoesLead
  );
  const reputacaoMaisSolida =
    notaLead !== null &&
    avaliacoesLead !== null &&
    avaliacoesLead >= 10 &&
    lideresComMenosOpinioes.length >= 2;

  // Quem já está no Top 3 não tem o que "entrar"; a meta dele é subir dentro dele.
  const metaPosicional = lead.posicao_maps && lead.posicao_maps <= 3
    ? 'de disputar as primeiras posições da região'
    : 'de entrar no Top 3 da região';

  async function handleSolicitarAvancado() {
    if (!lead || pedido === 'enviando' || pedido === 'feito') return;

    setPedido('enviando');
    setErroPedido(null);

    // O slug pode não existir em registros antigos; o id sempre existe.
    const resultado = await solicitarDiagnosticoAvancado(lead.slug || lead.id);

    // `jaSolicitado` também cai aqui: para quem clicou, o resultado é o mesmo,
    // e nada é reenviado.
    if (resultado.success) {
      setPedido('feito');
    } else {
      setPedido('erro');
      setErroPedido(resultado.error ?? null);
    }
  }

  function linkWhatsApp(mensagem: string): string {
    return `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
  }

  const linkGeral = linkWhatsApp(
    `Olá! Vi o relatório de presença digital da empresa *${lead.nome}* no Google e gostaria de saber como colocar nossa empresa no topo do Google!`
  );
  // Visita fria: o próximo passo é entender, não escolher um serviço. Um CTA
  // só, e a conversa define o caminho.
  const linkEntender = linkWhatsApp(
    `Olá! Vi o diagnóstico de visibilidade da *${lead.nome}* e gostaria de entender melhor o que dá para melhorar na nossa presença no Google.`
  );

  const SITE_EIXO = 'https://eixodigitalbr.com.br';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] antialiased font-inter pb-24 relative overflow-x-hidden selection:bg-[#10B981] selection:text-[#08130F]">

      {/* Glow Effect Sutil do Design System no Hero (blur 100px, opacidade 0.12) */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] pointer-events-none rounded-full"
        style={{
          background: 'radial-[#10B981]',
          backgroundColor: '#10B981',
          filter: 'blur(100px)',
          opacity: 0.12,
        }}
      />

      {/* Header Sticky - Design System (blur 12px, rgba(11,15,25,0.85), altura 76px) */}
      <header className="sticky top-0 z-50 bg-[#0B0F19]/85 backdrop-blur-[12px] border-b border-[rgba(255,255,255,0.08)] h-[76px] px-4 sm:px-8 flex items-center">
        <div className="max-w-[1100px] w-full mx-auto flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#10B981] flex items-center justify-center font-outfit font-extrabold text-[#08130F] text-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded-full">
                  Relatório Oficial
                </span>
                <span className="text-xs text-[#64748B] hidden sm:inline">• Eixo Digital</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold font-outfit text-white leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {lead.nome}
              </h1>
            </div>
          </div>

          {nichoLead ? (
            <span className="text-xs font-semibold text-[#94A3B8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-[999px] capitalize truncate max-w-[140px] sm:max-w-none">
              {nichoLead}
            </span>
          ) : (
            <a
              href={linkGeral}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#22C55E] text-[#08130F] font-bold text-xs px-3.5 py-2 rounded-[10px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#08130F]" />
              <span className="hidden sm:inline">Contato</span>
            </a>
          )}
        </div>
      </header>

      {/* Conteúdo Principal (Largura Máxima 1100px centralizado) */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 relative z-10">

        {/* Hero Banner / Resumo executivo */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-1.5 rounded-[999px] text-xs font-semibold text-[#10B981]">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <span>DIAGNÓSTICO EXCLUSIVO DE VISIBILIDADE DIGITAL</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold font-outfit text-[#F1F5F9] leading-tight tracking-tight text-balance">
            Análise de Desempenho no Google para <span className="text-[#10B981]">{lead.nome}</span>
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-2xl mx-auto font-inter">
            Comparação de posicionamento no Google Maps, nota de clientes, estrutura de site e oportunidades de crescimento na sua região.
          </p>

          {/* Sem declarar termo, local e data, o dono confere do próprio
              celular — logado e com outra geolocalização —, vê outra posição e
              conclui que o relatório é inventado. */}
          {contextoBusca && (
            <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl mx-auto pt-1">
              {contextoBusca}
            </p>
          )}

          {/* A credencial rende mais aqui do que numa seção de venda: a
              primeira dúvida de quem recebe uma análise que não pediu é "de
              onde você tirou isso?". */}
          <p className="text-xs text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Nossos aplicativos são aprovados pelo Google e usam as APIs oficiais —
            os números deste relatório vêm direto da fonte.
          </p>
        </section>

        {/* A antiga seção 01 (posição, nota e opiniões em três cards) saiu
            daqui: repetia o que a tabela abaixo já mostra, e mostra melhor,
            porque número isolado não diz nada — número ao lado do concorrente
            diz tudo. A página estava longa demais para o celular. */}

        {/* Seção 1: Comparativo com Líderes do Nicho */}
        <section className="bg-[#0B0F19] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-outfit tracking-wider uppercase text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-[999px]">
                01. Concorrência
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
                Comparativo com os Líderes da Região
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
            <table className="w-full text-left text-xs sm:text-sm text-[#F1F5F9] border-collapse min-w-[430px]">
              <thead className="bg-[#0E1424] text-[#94A3B8] font-outfit uppercase font-bold text-[11px] tracking-wider border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="p-3 sm:p-4">Empresa</th>
                  <th className="p-3 sm:p-4 text-center">Posição</th>
                  <th className="p-3 sm:p-4 text-center">Nota no Google</th>
                  <th className="p-3 sm:p-4 text-center">Avaliações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">

                {linhasComparativo.map((linha, idx) => {
                  const lacuna = lacunaAntesDe(idx);

                  return (
                    <React.Fragment key={linha.id}>
                      {lacuna > 0 && (
                        <tr className="bg-[rgba(255,255,255,0.01)]">
                          <td colSpan={4} className="px-4 py-2.5 text-center text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                            ┈┈┈ {lacuna} {lacuna === 1 ? 'posição' : 'posições'} no meio do caminho ┈┈┈
                          </td>
                        </tr>
                      )}

                      <tr
                        className={
                          linha.isLead
                            ? 'bg-[#10B981]/10 text-white font-bold border-l-4 border-[#10B981]'
                            : 'hover:bg-[rgba(255,255,255,0.03)] transition-colors text-[#94A3B8]'
                        }
                      >
                        <td className="p-3 sm:p-4">
                          {linha.isLead ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                              <span className="font-outfit text-base text-white">{linha.nome}</span>
                              <span className="text-[10px] bg-[#10B981] text-[#08130F] font-bold px-2 py-0.5 rounded-[999px] uppercase">
                                Sua Empresa
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-200">{linha.nome}</span>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-center">
                          {linha.isLead ? (
                            <span className="font-outfit font-black text-lg text-[#10B981]">
                              #{linha.posicao_maps || 'N/A'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-[999px] bg-slate-900 text-amber-300 text-xs font-bold border border-amber-400/20">
                              #{linha.posicao_maps}
                            </span>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-center font-bold text-amber-400 whitespace-nowrap">
                          {linha.gmb_nota !== null && linha.gmb_nota !== undefined
                            ? `⭐ ${linha.gmb_nota.toFixed(1)}`
                            : <span className="text-[#64748B]">—</span>}
                        </td>
                        <td className={`p-3 sm:p-4 text-center ${linha.isLead ? 'text-white font-bold' : 'text-slate-300'}`}>
                          {linha.gmb_avaliacoes !== null && linha.gmb_avaliacoes !== undefined
                            ? linha.gmb_avaliacoes
                            : <span className="text-[#64748B]">—</span>}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* O que a posição significa em gente procurando.
              Fica colado na tabela de propósito: "#9" sozinho é placar, e
              placar não move ninguém. Com o volume ao lado, vira consequência.

              O número é medido, a fonte é declarada e a data também — é o que
              permite responder "de onde você tirou isso?", que é a única
              pergunta que importa aqui. A fatia dos primeiros fica qualitativa
              porque CTR exato varia, e um percentual cravado teria o mesmo
              problema de credibilidade que uma estimativa disfarçada. */}
          {textoDemanda && demanda && (
            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 space-y-2">
              <p className="text-sm sm:text-base text-[#F1F5F9] leading-relaxed">
                <strong className="text-white">{textoDemanda}</strong>{' '}
                A maior parte desses cliques fica com as três primeiras posições.
              </p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {FONTE_DEMANDA}, {demanda.medidoEm}.
              </p>
            </div>
          )}

          {/* Card de Insight: o espaço do tráfego pago está vazio na região */}
          {lideresSemSite && (
            <div className="bg-[#0E1424] border border-amber-500/30 rounded-[16px] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-outfit uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Oportunidade Comercial Identificada!</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                Nenhum dos {concorrentesTop.length === 1 ? 'líderes' : `${concorrentesTop.length} líderes`} da sua região
                {' '}tem <strong className="text-white">site próprio</strong>. Todos disputam a primeira posição apenas com o perfil do Google.
              </p>
              {lead.site ? (
                <p className="text-[#10B981] font-semibold">
                  👉 A {lead.nome} já tem o ativo que nenhum concorrente do topo construiu. O que falta é tráfego chegando até ele.
                </p>
              ) : (
                <p className="text-[#10B981] font-semibold">
                  👉 Quem entra com site e anúncio compete num espaço que ninguém está ocupando — e aparece <strong>acima</strong> dos primeiros colocados, na área paga, já na primeira semana.
                </p>
              )}
            </div>
          )}

          {/* Quando todos têm site, o argumento é a nota: o lead já é melhor
              avaliado que quem está em #1. */}
          {!lideresSemSite && lideraComNotaMenor && primeiroColocado && (
            <div className="bg-[#0E1424] border border-amber-500/30 rounded-[16px] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-outfit uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Oportunidade Comercial Identificada!</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                O <strong className="text-white">1º colocado ({primeiroColocado.nome})</strong> está no topo com nota{' '}
                {notaPrimeiro?.toFixed(1)} — <strong className="text-white">abaixo da sua, {notaLead?.toFixed(1)}</strong>.
                A diferença não está na satisfação dos seus clientes: a posição no mapa depende de como o perfil
                está configurado e de como o Google entende a sua área de atendimento.
              </p>
              <p className="text-[#10B981] font-semibold">
                👉 Quem seus clientes avaliam melhor é a {lead.nome}. Com o perfil trabalhado, sua empresa tem espaço {metaPosicional}.
              </p>
            </div>
          )}

          {/* Volume de avaliações: nota alta apoiada em 2 opiniões não vale o
              mesmo que a mesma nota apoiada em 30. */}
          {reputacaoMaisSolida && (
            <div className="bg-[#0E1424] border border-[#10B981]/30 rounded-[16px] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[#10B981] font-bold font-outfit uppercase tracking-wider">
                <Zap className="w-4 h-4 text-[#10B981] shrink-0" />
                <span>A sua reputação é a mais sólida da tabela</span>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                A nota {notaLead?.toFixed(1)} da <strong className="text-white">{lead.nome}</strong> está apoiada
                em <strong className="text-white">{avaliacoesLead} avaliações</strong>.
                {' '}{lideresComMenosOpinioes.length === 1 ? 'Um dos líderes' : `${lideresComMenosOpinioes.length} dos líderes`}
                {' '}que aparecem à frente sustentam a nota deles em bem menos opiniões.
              </p>
              <p className="text-[#10B981] font-semibold">
                👉 Nota alta com poucas avaliações não convence quem está decidindo entre três empresas. Reputação
                a {lead.nome} já tem — o que falta é o perfil trabalhar a favor dela na hora da busca.
              </p>
            </div>
          )}
        </section>

        {/* Seção 2: Por que eles aparecem na frente.
            Substitui a antiga lista de gargalos. Aquela versão lia como
            boletim de notas — cinco linhas de "Sem isso, sem aquilo" fecham a
            pessoa em vez de abrir. O enquadramento aqui é outro: a posição não
            é um ranking de qualidade, e isso é verdade e verificável. Tira o
            ferrão sem tirar o problema, e transforma a distância em algo
            corrigível em vez de merecido. */}
        <section className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold font-outfit tracking-wider uppercase text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-[999px]">
              02. O que decide
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-outfit text-white">
              Por que eles aparecem na frente
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-3xl">
            A ordem do Google Maps não é um ranking de qualidade. Ela se decide por coisas
            que a maioria dos donos de negócio nunca ouviu falar:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Com que frequência o perfil recebe publicações e fotos novas',
              'Se as avaliações são respondidas, e em quanto tempo',
              'As palavras usadas no nome, na descrição e nas categorias',
              'A distância entre a empresa e quem está fazendo a busca',
            ].map((fator) => (
              <div
                key={fator}
                className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-4 rounded-[16px] text-xs sm:text-sm text-[#F1F5F9] flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 mt-1.5 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="font-medium leading-relaxed">{fator}</span>
              </div>
            ))}
          </div>

          <div className="bg-[rgba(16,185,129,0.06)] border border-[#10B981]/20 rounded-[16px] p-5">
            <p className="text-sm sm:text-base text-[#F1F5F9] leading-relaxed">
              <strong className="text-white">Nada disso mede a qualidade do seu serviço.</strong>{' '}
              Mede quanta atenção o perfil recebe. Uma empresa menos preparada que a {lead.nome}{' '}
              pode estar na frente apenas por cuidar disso todo mês.
            </p>
          </div>

          {gargalos.length > 0 && (
            <div className="space-y-3 pt-1">
              <h3 className="text-sm font-bold font-outfit text-white uppercase tracking-wider">
                No perfil da {lead.nome}, o que está pesando hoje
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gargalos.map((falha, idx) => (
                  <div
                    key={idx}
                    className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-4 rounded-[16px] text-xs sm:text-sm text-[#F1F5F9] flex items-start gap-3 hover:border-amber-500/40 transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <span className="font-medium leading-relaxed">{falha}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Bloco do site — só para quem não tem.
            Cuidado deliberado com a redação: a tabela acima mostra líderes sem
            site, então afirmar que site melhora a posição no mapa seria
            desmentido pela própria página. O argumento é outro: site soma com
            o resto, e numa região onde ninguém tem, diferencia. */}
        {!lead.site && (
          <section className="bg-[#0E1424] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold font-outfit tracking-wider uppercase text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-[999px]">
                Sobre não ter site
              </span>
            </div>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              Você provavelmente já ouviu que hoje não precisa de site, que o perfil do Google resolve.
              Isso era verdade há alguns anos.
            </p>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              O perfil é um espaço emprestado: o formato, a ordem e o que aparece são decisão do Google.
              O site é o único lugar onde a <strong className="text-white">{lead.nome}</strong> conta a
              própria história do seu jeito, com as suas fotos e os seus argumentos.
            </p>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              E hoje quem lê isso não são só pessoas. Quando alguém pergunta a uma inteligência artificial
              qual a melhor {nichoLead || 'empresa'} {cidadeLead ? `de ${cidadeLead}` : 'da região'}, a resposta se monta
              a partir do que está escrito na internet sobre cada uma. Quem não tem site não tem o que ser lido.
            </p>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              Site sozinho não muda posição. Mas soma com o resto: dá ao Google mais material sobre o que
              a empresa faz e onde atende, é para onde o anúncio manda quem clica, e é o que sustenta a
              sua presença fora do mapa.
            </p>

            {lideresSemSite && (
              <p className="text-sm sm:text-base text-[#10B981] font-semibold leading-relaxed">
                👉 Numa região onde nenhum dos líderes tem site, quem fizer — junto com a otimização do
                perfil — se destaca sozinho.
              </p>
            )}
          </section>
        )}

        {/* Seção 3: Os dois caminhos do Google.
            Quem chega aqui veio de uma abordagem fria e ainda não está
            escolhendo serviço. Os dois cards explicam; a ação é uma só, e é
            entender — não contratar. */}
        <section className="bg-[#0E1424] border border-[#10B981]/30 rounded-[20px] p-6 sm:p-10 md:p-12 space-y-7 sm:space-y-8 shadow-2xl relative overflow-hidden">

          <div className="space-y-4 max-w-2xl mx-auto text-center">
            <div className="inline-block">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-4 py-1.5 rounded-[999px]">
                Próximo Passo
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold font-outfit text-white leading-tight">
              Existem dois caminhos para a {lead.nome} aparecer no topo do Google
            </h2>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              O <strong className="text-white">anúncio</strong> é o caminho pago para aparecer primeiro.
              O <strong className="text-white">Google Meu Negócio</strong> é o caminho orgânico.
              Eles não são excludentes — o melhor cenário é ocupar os dois.
            </p>
          </div>

          {/* Explicação, não cardápio: sem lista de entregáveis, que a essa
              altura soa como proposta comercial. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">Caminho Orgânico</span>
                  <h3 className="text-base sm:text-lg font-bold font-outfit text-white leading-tight">Google Meu Negócio</h3>
                </div>
              </div>

              <p className="text-sm text-[#F1F5F9] leading-relaxed flex-1">
                Trabalhar o seu perfil no Google — avaliações, fotos, publicações e respostas — para aparecer entre os primeiros de quem busca na sua região, sem pagar por clique.
              </p>

              <p className="text-xs text-[#64748B] leading-relaxed border-t border-[rgba(255,255,255,0.08)] pt-3">
                Constrói ao longo dos meses e continua rendendo depois.
              </p>
            </div>

            <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#10B981]">Caminho Pago</span>
                  <h3 className="text-base sm:text-lg font-bold font-outfit text-white leading-tight">Site + Google Ads</h3>
                </div>
              </div>

              <p className="text-sm text-[#F1F5F9] leading-relaxed flex-1">
                Um site que apresenta os seus trabalhos e leva direto ao WhatsApp, com anúncios que colocam a sua empresa acima de todos os resultados do mapa.
              </p>

              <p className="text-xs text-[#64748B] leading-relaxed border-t border-[rgba(255,255,255,0.08)] pt-3">
                Aparece desde a primeira semana, com investimento que você controla.
              </p>
            </div>

          </div>

          <p className="text-center text-sm sm:text-base text-[#F1F5F9] font-semibold max-w-2xl mx-auto leading-relaxed">
            Um traz cliente sem custo por clique, o outro traz cliente amanhã.
            <span className="text-[#10B981]"> Quem faz os dois aparece duas vezes na mesma busca.</span>
          </p>

          {/* Até aqui a seção explicava o mercado, não a oferta: dava para ler
              tudo sem descobrir que a Eixo Digital faz os dois. Dizer o que se
              faz é diferente de pedir que a pessoa escolha — a escolha continua
              adiada para a conversa, que é o que o botão abaixo propõe. */}
          <p className="text-center text-sm text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            A <strong className="text-white">Eixo Digital</strong> cuida dos dois caminhos. Dá para começar
            por um só ou fazer os dois juntos — o que faz sentido depende de onde a {lead.nome} está hoje.
          </p>

          {/* O passo principal é pedir a análise, não falar com vendedor:
              "quero saber mais sobre a minha empresa" é um sim muito mais
              barato que "vamos conversar sobre contratar". Quem já quer
              conversar tem o WhatsApp logo abaixo. */}
          <div className="flex flex-col items-center gap-3 pt-1">
            {pedido === 'feito' ? (
              <div className="w-full max-w-md bg-[#10B981]/10 border border-[#10B981]/40 rounded-[16px] p-5 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-[#10B981] font-bold font-outfit">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Pedido registrado</span>
                </div>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Vamos preparar a análise detalhada da {lead.nome} e enviar no seu WhatsApp.
                  Você já deve ter recebido a confirmação por lá.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSolicitarAvancado}
                  disabled={pedido === 'enviando'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#10B981] hover:bg-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed text-[#08130F] font-bold px-6 sm:px-8 py-4 rounded-[10px] shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all text-sm sm:text-base cursor-pointer text-center"
                >
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span>{pedido === 'enviando' ? 'Enviando pedido...' : 'Quero a análise avançada'}</span>
                </button>

                <p className="text-xs text-[#64748B] text-center max-w-sm leading-relaxed">
                  Gratuita e sem compromisso. É um estudo mais fundo, só da {lead.nome}, e a gente
                  manda no seu WhatsApp quando ficar pronto.
                </p>

                {pedido === 'erro' && (
                  <p className="text-xs text-red-400 text-center max-w-sm leading-relaxed">
                    {erroPedido || 'Não foi possível registrar o pedido.'} Se preferir, fale com a gente
                    direto no WhatsApp pelo link abaixo.
                  </p>
                )}
              </>
            )}

            <a
              href={linkEntender}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#94A3B8] hover:text-[#10B981] underline underline-offset-4 decoration-[rgba(255,255,255,0.2)] hover:decoration-[#10B981] transition-colors mt-1"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Prefiro falar direto no WhatsApp</span>
            </a>

            <a
              href={SITE_EIXO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#10B981] underline underline-offset-4 decoration-[rgba(255,255,255,0.15)] hover:decoration-[#10B981] transition-colors"
            >
              <span>Conhecer a Eixo Digital</span>
              <ArrowUpRight className="w-3 h-3 shrink-0" />
            </a>
          </div>

        </section>

      </main>

      {/* Footer Estático */}
      <footer className="text-center py-8 px-4 text-[#64748B] text-xs border-t border-[rgba(255,255,255,0.08)] mt-12 space-y-2">
        <p>© Eixo Digital • Presença &amp; Estratégia de Tração no Google</p>
        <a
          href={SITE_EIXO}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[#64748B] hover:text-[#10B981] underline underline-offset-4 transition-colors"
        >
          eixodigitalbr.com.br
        </a>
      </footer>

    </div>
  );
}
