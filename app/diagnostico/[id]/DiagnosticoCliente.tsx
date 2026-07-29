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
  ArrowUpRight, CheckCircle2, Printer,
} from 'lucide-react';

/**
 * Este relatório é um DOCUMENTO, não uma tela de produto.
 *
 * O CRM é ferramenta e continua escuro. Aqui o registro é outro: fundo claro,
 * medida de leitura curta, hierarquia por tamanho em vez de por caixa, e uma
 * capa. É o que faz alguém imprimir e guardar — e o que separa "relatório" de
 * "site de agência", que era a leitura que a versão anterior provocava.
 *
 * Cor: um acento (verde da marca) e neutros. A versão anterior tinha verde,
 * âmbar, vermelho, ciano e azul significando coisas diferentes em lugares
 * diferentes; documento sério usa peso e tamanho, não mais uma cor.
 */

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
 * Nomes de perfil do Google vêm cheios de sufixo de SEO — "Dra. Maria Cecília
 * Molina - Odontologia Estética e Funcional". Repetido oito vezes em corpo
 * grande, isso sozinho destrói a diagramação: no título ocupava quatro linhas.
 * O nome completo aparece uma vez, na capa; o resto do documento usa o curto.
 */
function nomeCurto(nome: string): string {
  const antesDoSufixo = nome.split(/\s[-–—|]\s/)[0].trim();
  const base = antesDoSufixo.length >= 3 ? antesDoSufixo : nome.trim();
  return base.length > 40 ? `${base.slice(0, 40).trim()}…` : base;
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

/** Cabeçalho de seção: número, título e um filete. Define começo e fim. */
function TituloSecao({ numero, children }: { numero: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-zinc-200 pb-3 mb-6">
      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800 mb-1">
        {numero}
      </span>
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">
        {children}
      </h2>
    </div>
  );
}

/**
 * Régua de posição.
 *
 * Mostra a faixa de destaque (as três primeiras) e onde a empresa está. É a
 * distância que comunica, e distância se lê melhor desenhada do que escrita.
 */
function ReguaPosicao({ posicao }: { posicao: number }) {
  const limite = Math.max(10, posicao);
  const pct = ((posicao - 0.5) / limite) * 100;
  const faixaTop3 = (3 / limite) * 100;
  const dentroDoTop3 = posicao <= 3;

  /**
   * O rótulo não pode ser centrado no marcador: perto das pontas, metade dele
   * sai da tela — que foi o que estourou a margem no celular. Nas bordas ele
   * ancora pelo lado de dentro.
   */
  const naBordaDireita = pct > 70;
  const naBordaEsquerda = pct < 30;

  const posicaoRotulo: React.CSSProperties = naBordaDireita
    ? { right: 0 }
    : naBordaEsquerda
      ? { left: 0 }
      : { left: `${pct}%`, transform: 'translateX(-50%)' };

  return (
    <figure className="my-6">
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1 h-2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1 left-0 h-2 rounded-l-full bg-emerald-200"
          style={{ width: `${faixaTop3}%` }}
        />
        <div
          className="absolute top-0 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-emerald-800 ring-2 ring-white"
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Sem o nome da empresa: ele já aparece na capa, no veredito e na
          tabela, e aqui só criava risco de estouro sem informar nada novo. */}
      <div className="relative h-5 mt-1.5">
        <span
          className="absolute text-[11px] font-bold text-emerald-900 whitespace-nowrap"
          style={posicaoRotulo}
        >
          você está aqui · {posicao}º
        </span>
      </div>

      <figcaption className="flex justify-between gap-3 text-[11px] text-zinc-500 mt-1">
        <span className={dentroDoTop3 ? 'font-semibold text-emerald-800' : ''}>
          1º ao 3º — a faixa de destaque
        </span>
        <span className="shrink-0">{limite}º</span>
      </figcaption>
    </figure>
  );
}

/**
 * Barras de avaliações.
 *
 * A cor não carrega informação: cada barra tem o nome ao lado e o número na
 * ponta. O verde é ênfase, e a diferença para o cinza é de luminosidade — o
 * que a mantém legível em qualquer tipo de daltonismo e no papel.
 */
function BarrasAvaliacoes({ linhas }: { linhas: LinhaComparativo[] }) {
  const comDado = linhas.filter(
    l => typeof l.gmb_avaliacoes === 'number'
  ) as Array<LinhaComparativo & { gmb_avaliacoes: number }>;

  if (comDado.length < 2) return null;

  const maximo = Math.max(...comDado.map(l => l.gmb_avaliacoes), 1);

  return (
    <figure className="mt-8">
      <figcaption className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-4">
        Avaliações acumuladas
      </figcaption>
      <div className="space-y-3">
        {comDado.map(linha => (
          <div key={linha.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 items-center">
            <div className="min-w-0">
              <div
                className={`text-[13px] truncate mb-1.5 ${
                  linha.isLead ? 'font-bold text-zinc-900' : 'text-zinc-600'
                }`}
              >
                {nomeCurto(linha.nome)}
              </div>
              <div className="h-2.5 w-full">
                <div
                  className={`h-2.5 rounded-r-sm ${linha.isLead ? 'bg-emerald-800' : 'bg-zinc-300'}`}
                  style={{ width: `${Math.max((linha.gmb_avaliacoes / maximo) * 100, 1.5)}%` }}
                />
              </div>
            </div>
            <span
              className={`text-sm tabular-nums self-end pb-0.5 ${
                linha.isLead ? 'font-bold text-zinc-900' : 'text-zinc-500'
              }`}
            >
              {linha.gmb_avaliacoes}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
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
      <div className="min-h-screen bg-zinc-100 text-zinc-700 flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-10 h-10 border-[3px] border-emerald-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Gerando diagnóstico de visibilidade digital...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-zinc-900">Diagnóstico não encontrado</h2>
          <p className="text-sm text-zinc-600">
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
  const cidadeCurta = (cidadeLead || '').split('/')[0].trim();

  const empresa = nomeCurto(lead.nome);

  // Só aparece quando o par nicho+cidade foi medido de verdade no Planejador.
  // Sem dado, o bloco inteiro some — nenhum número é inferido.
  const demanda = buscarDemanda(nichoLead, cidadeLead);
  const textoDemanda = fraseDemanda(nichoLead, cidadeLead);

  const dataColeta = (() => {
    if (!lead.data_busca) return null;
    const data = new Date(lead.data_busca);
    return Number.isNaN(data.getTime()) ? null : data.toLocaleDateString('pt-BR');
  })();

  const termoBusca = nichoLead && cidadeLead ? `${nichoLead} em ${cidadeLead}` : null;

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

  // Visita fria: o próximo passo é entender, não escolher um serviço.
  const linkEntender = linkWhatsApp(
    `Olá! Vi o diagnóstico de visibilidade da *${lead.nome}* e gostaria de entender melhor o que dá para melhorar na nossa presença no Google.`
  );

  const SITE_EIXO = 'https://eixodigitalbr.com.br';

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 antialiased font-inter">
      {/* Impressão: o documento sai igual à tela, sem os controles. É o que
          transforma "página" em "algo que se guarda". */}
      <style>{`
        @media print {
          .nao-imprimir { display: none !important; }
          body { background: #fff !important; }
          .folha { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          section { break-inside: avoid; }
          a[href]:after { content: ""; }
        }
      `}</style>

      <div className="folha max-w-[880px] mx-auto bg-white sm:my-8 shadow-sm sm:rounded-lg overflow-hidden">

        {/* ── Capa ─────────────────────────────────────────────────────────
            Título, empresa, procedência e data. É o que faz o documento ser
            lido como laudo e não como landing page. */}
        <header className="px-6 sm:px-12 pt-10 sm:pt-14 pb-8 border-b border-zinc-200">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-emerald-800 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                E
              </div>
              <span className="text-sm font-semibold text-zinc-900">Eixo Digital</span>
            </div>

            <button
              onClick={() => window.print()}
              className="nao-imprimir inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-emerald-800 border border-zinc-300 hover:border-emerald-700 rounded px-3 py-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 mb-3">
            Diagnóstico de Visibilidade Digital
          </p>

          <h1 className="text-3xl sm:text-[2.6rem] font-extrabold text-zinc-900 leading-[1.1] tracking-tight mb-2">
            {empresa}
          </h1>

          {/* O nome completo do perfil aparece uma vez só, aqui. */}
          {empresa !== lead.nome && (
            <p className="text-sm text-zinc-500 leading-snug mb-6 max-w-[60ch]">{lead.nome}</p>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 mt-8 pt-6 border-t border-zinc-100">
            {termoBusca && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Busca analisada</dt>
                <dd className="text-sm text-zinc-800 font-medium">{termoBusca}</dd>
              </div>
            )}
            {dataColeta && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Dados coletados em</dt>
                <dd className="text-sm text-zinc-800 font-medium tabular-nums">{dataColeta}</dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Fonte</dt>
              <dd className="text-sm text-zinc-800 font-medium">APIs oficiais do Google</dd>
            </div>
          </dl>
        </header>

        {/* ── Veredito ─────────────────────────────────────────────────────
            O relatório inteiro numa frase, antes de qualquer explicação. Quem
            ler só isto já entendeu; quem se interessar rola o resto. */}
        <section className="px-6 sm:px-12 py-8 sm:py-10 bg-emerald-50/60 border-b border-emerald-100">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-5xl sm:text-6xl font-extrabold text-emerald-900 leading-none">
              {lead.posicao_maps ? `${lead.posicao_maps}º` : '—'}
            </span>
            <span className="text-base sm:text-lg text-emerald-900/80 font-medium">
              {lead.posicao_maps && lead.posicao_maps <= 3
                ? 'entre as primeiras da região'
                : 'na busca da sua região'}
            </span>
          </div>

          <p className="text-[15px] sm:text-base text-zinc-700 leading-relaxed max-w-[62ch]">
            {textoDemanda ? (
              <>
                <strong className="text-zinc-900">{textoDemanda}</strong>{' '}
                A maior parte desses cliques fica com as três primeiras posições.
              </>
            ) : (
              <>As três primeiras posições ficam com a maior parte dos contatos de quem procura no Google.</>
            )}
          </p>

          {lead.posicao_maps && <ReguaPosicao posicao={lead.posicao_maps} />}
        </section>

        <main className="px-6 sm:px-12 py-10 sm:py-12 space-y-12 sm:space-y-16">

          {/* ── 01. Concorrência ─────────────────────────────────────────── */}
          <section>
            <TituloSecao numero="01. Concorrência">Como você aparece ao lado dos líderes</TituloSecao>

            {/* Sem rolagem horizontal: no celular ela esconde justamente a
                coluna de avaliações. As colunas numéricas ganham largura fixa
                e o nome trunca no que sobrar. */}
            <div>
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col />
                  <col className="w-[52px] sm:w-[80px]" />
                  <col className="w-[48px] sm:w-[72px]" />
                  <col className="w-[56px] sm:w-[88px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Empresa</th>
                    <th className="pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-center whitespace-nowrap">Pos.</th>
                    <th className="pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-center whitespace-nowrap">Nota</th>
                    <th className="pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-right whitespace-nowrap">Aval.</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasComparativo.map((linha, idx) => {
                    const lacuna = lacunaAntesDe(idx);

                    return (
                      <React.Fragment key={linha.id}>
                        {lacuna > 0 && (
                          <tr>
                            <td colSpan={4} className="py-2 text-center text-[11px] text-zinc-400 italic">
                              {lacuna} {lacuna === 1 ? 'posição' : 'posições'} no meio do caminho
                            </td>
                          </tr>
                        )}

                        <tr className={linha.isLead ? 'bg-emerald-50' : ''}>
                          <td className={`py-3 pr-2 text-sm ${linha.isLead ? 'font-bold text-zinc-900' : 'text-zinc-700'}`}>
                            <span className="block truncate">{nomeCurto(linha.nome)}</span>
                            {linha.isLead && (
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                você
                              </span>
                            )}
                          </td>
                          <td className={`py-3 text-center text-sm tabular-nums ${linha.isLead ? 'font-bold text-emerald-900' : 'text-zinc-600'}`}>
                            {linha.posicao_maps ? `${linha.posicao_maps}º` : '—'}
                          </td>
                          <td className="py-3 text-center text-sm tabular-nums text-zinc-700 whitespace-nowrap">
                            {linha.gmb_nota != null ? linha.gmb_nota.toFixed(1) : '—'}
                          </td>
                          <td className={`py-3 text-right text-sm tabular-nums ${linha.isLead ? 'font-bold text-zinc-900' : 'text-zinc-600'}`}>
                            {linha.gmb_avaliacoes != null ? linha.gmb_avaliacoes : '—'}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <BarrasAvaliacoes linhas={linhasComparativo} />

            {demanda && (
              <p className="text-[11px] text-zinc-400 mt-6">
                {FONTE_DEMANDA}, {demanda.medidoEm}.
              </p>
            )}

            {/* Achados: um por vez, com peso de nota de rodapé destacada e não
                de card colorido. */}
            <div className="mt-8 space-y-4">
              {lideresSemSite && (
                <div className="border-l-2 border-emerald-700 pl-4 py-1">
                  <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch]">
                    Nenhum dos {concorrentesTop.length} líderes da sua região tem{' '}
                    <strong className="text-zinc-900">site próprio</strong>. Todos disputam a primeira posição
                    apenas com o perfil do Google.{' '}
                    {lead.site
                      ? `A ${empresa} já tem o ativo que nenhum concorrente do topo construiu — o que falta é tráfego chegando até ele.`
                      : 'Quem entra com site e anúncio compete num espaço que ninguém está ocupando.'}
                  </p>
                </div>
              )}

              {!lideresSemSite && lideraComNotaMenor && primeiroColocado && (
                <div className="border-l-2 border-emerald-700 pl-4 py-1">
                  <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch]">
                    O 1º colocado ({nomeCurto(primeiroColocado.nome)}) está no topo com nota{' '}
                    {notaPrimeiro?.toFixed(1)} — <strong className="text-zinc-900">abaixo da sua, {notaLead?.toFixed(1)}</strong>.
                    A diferença não está na satisfação dos seus clientes: a posição no mapa depende de como o
                    perfil está configurado e de como o Google entende a sua área de atendimento. Com o perfil
                    trabalhado, a {empresa} tem espaço {metaPosicional}.
                  </p>
                </div>
              )}

              {reputacaoMaisSolida && (
                <div className="border-l-2 border-emerald-700 pl-4 py-1">
                  <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch]">
                    A sua nota {notaLead?.toFixed(1)} está apoiada em{' '}
                    <strong className="text-zinc-900">{avaliacoesLead} avaliações</strong>, enquanto{' '}
                    {lideresComMenosOpinioes.length === 1 ? 'um dos líderes' : `${lideresComMenosOpinioes.length} dos líderes`}{' '}
                    à frente sustentam a nota deles em bem menos opiniões. Nota alta com poucas avaliações não
                    convence quem está decidindo entre três empresas — reputação a {empresa} já tem.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── 02. O que decide ──────────────────────────────────────────── */}
          <section>
            <TituloSecao numero="02. O que decide">Por que eles aparecem na frente</TituloSecao>

            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch] mb-6">
              A ordem do Google Maps não é um ranking de qualidade. Ela se decide por coisas que a
              maioria dos donos de negócio nunca ouviu falar:
            </p>

            <ol className="space-y-0 mb-8 border-t border-zinc-100">
              {[
                'Com que frequência o perfil recebe publicações e fotos novas',
                'Se as avaliações são respondidas, e em quanto tempo',
                'As palavras usadas no nome, na descrição e nas categorias',
                'A distância entre a empresa e quem está fazendo a busca',
              ].map((fator, i) => (
                <li key={fator} className="flex gap-4 py-3 border-b border-zinc-100 text-[15px] text-zinc-700">
                  <span className="text-zinc-300 font-bold tabular-nums shrink-0">{i + 1}</span>
                  <span className="leading-relaxed">{fator}</span>
                </li>
              ))}
            </ol>

            <p className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug max-w-[52ch] mb-2">
              Nada disso mede a qualidade do seu serviço.
            </p>
            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch]">
              Mede quanta atenção o perfil recebe. Uma empresa menos preparada que a {empresa} pode
              estar na frente apenas por cuidar disso todo mês.
            </p>

            {gargalos.length > 0 && (
              <div className="mt-10">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500 mb-4">
                  No perfil da {empresa}, o que está pesando hoje
                </h3>
                <ul className="border-t border-zinc-100">
                  {gargalos.map((falha, idx) => (
                    <li key={idx} className="flex gap-3 py-3 border-b border-zinc-100 text-[15px] text-zinc-700 leading-relaxed">
                      <span className="text-amber-500 shrink-0 mt-0.5">●</span>
                      <span>{falha}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ── Sobre não ter site ────────────────────────────────────────
              A redação evita de propósito afirmar que site melhora a posição
              no mapa: a tabela acima mostra líderes sem site e desmentiria a
              própria página. O argumento é que soma com o resto. */}
          {!lead.site && (
            <section>
              <TituloSecao numero="03. Sobre não ter site">O que existe fora do mapa</TituloSecao>

              <div className="space-y-4 text-[15px] text-zinc-700 leading-relaxed max-w-[62ch]">
                <p>
                  O perfil do Google é um espaço emprestado: o formato, a ordem e o que aparece são
                  decisão dele. O site é o único lugar onde a <strong className="text-zinc-900">{empresa}</strong>{' '}
                  conta a própria história do seu jeito.
                </p>
                <p>
                  E hoje quem lê isso não são só pessoas. Quando alguém pergunta a uma inteligência
                  artificial qual a melhor {nichoLead || 'empresa'} {cidadeCurta ? `de ${cidadeCurta}` : 'da região'},
                  a resposta se monta a partir do que está escrito na internet sobre cada uma. Quem não
                  tem site não tem o que ser lido.
                </p>
                <p>
                  Site sozinho não muda posição — mas soma com o resto, e é para onde o anúncio manda
                  quem clica.
                  {lideresSemSite && (
                    <strong className="text-zinc-900">
                      {' '}Numa região onde nenhum dos líderes tem, quem fizer se destaca sozinho.
                    </strong>
                  )}
                </p>
              </div>
            </section>
          )}

          {/* ── Próximo passo ─────────────────────────────────────────────── */}
          <section>
            <TituloSecao numero={lead.site ? '03. Próximo passo' : '04. Próximo passo'}>
              Dois caminhos para aparecer no topo
            </TituloSecao>

            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch] mb-8">
              O <strong className="text-zinc-900">anúncio</strong> é o caminho pago para aparecer primeiro.
              O <strong className="text-zinc-900">Google Meu Negócio</strong> é o caminho orgânico.
              Eles não são excludentes — o melhor cenário é ocupar os dois.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 rounded-lg overflow-hidden mb-8">
              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />
                  <h3 className="text-[15px] font-bold text-zinc-900">Google Meu Negócio</h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                  Trabalhar o seu perfil — avaliações, fotos, publicações e respostas — para aparecer
                  entre os primeiros de quem busca na sua região, sem pagar por clique.
                </p>
                <p className="text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                  Constrói ao longo dos meses e continua rendendo depois.
                </p>
              </div>

              <div className="bg-white p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="w-4 h-4 text-emerald-800 shrink-0" />
                  <h3 className="text-[15px] font-bold text-zinc-900">Site + Google Ads</h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                  Um site que apresenta os seus trabalhos e leva direto ao WhatsApp, com anúncios que
                  colocam a sua empresa acima de todos os resultados do mapa.
                </p>
                <p className="text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                  Aparece desde a primeira semana, com investimento que você controla.
                </p>
              </div>
            </div>

            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch]">
              Um traz cliente sem custo por clique, o outro traz cliente amanhã.
              <strong className="text-zinc-900"> Quem faz os dois aparece duas vezes na mesma busca.</strong>{' '}
              A Eixo Digital cuida dos dois caminhos — dá para começar por um só ou fazer os dois juntos.
            </p>
          </section>

          {/* ── Ação ──────────────────────────────────────────────────────── */}
          <section className="nao-imprimir border-t border-zinc-200 pt-10">
            {pedido === 'feito' ? (
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-5 max-w-lg">
                <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Pedido registrado</span>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  Vamos preparar a análise detalhada da {empresa} e enviar no seu WhatsApp. Você já deve
                  ter recebido a confirmação por lá.
                </p>
              </div>
            ) : (
              <div className="max-w-lg">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  Quer entender isso com mais profundidade?
                </h3>
                <p className="text-[15px] text-zinc-700 leading-relaxed mb-5">
                  Podemos preparar uma análise mais detalhada, só da {empresa} — gratuita e sem
                  compromisso. A gente manda no seu WhatsApp quando ficar pronta.
                </p>

                <button
                  onClick={handleSolicitarAvancado}
                  disabled={pedido === 'enviando'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-7 py-3.5 rounded-md transition-colors text-[15px]"
                >
                  {pedido === 'enviando' ? 'Enviando pedido...' : 'Quero a análise avançada'}
                </button>

                {pedido === 'erro' && (
                  <p className="text-sm text-red-700 mt-3 leading-relaxed">
                    {erroPedido || 'Não foi possível registrar o pedido.'} Se preferir, fale com a gente
                    direto no WhatsApp pelo link abaixo.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
                  <a
                    href={linkEntender}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Prefiro falar no WhatsApp</span>
                  </a>
                  <a
                    href={SITE_EIXO}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 transition-colors"
                  >
                    <span>Conhecer a Eixo Digital</span>
                    <ArrowUpRight className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="px-6 sm:px-12 py-6 border-t border-zinc-200 text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-2">
          <span>© Eixo Digital · Presença &amp; Estratégia de Tração no Google</span>
          <span>eixodigitalbr.com.br</span>
        </footer>
      </div>
    </div>
  );
}
