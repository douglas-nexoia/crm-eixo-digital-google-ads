'use client';

import React, { useState, useEffect } from 'react';
import {
  getDiagnosticoPublicoBySlugOrId,
  getTopConcorrentesDoMesmoNicho,
  solicitarDiagnosticoAvancado,
} from '@/lib/supabase-service';
import { getLocalLeads } from '@/lib/storage';
import { Lead } from '@/lib/types';
import { buscarDemanda, fraseDemanda, FONTE_DEMANDA, calcularPlanoGoogleAds, termoDoNicho } from '@/lib/demanda-busca';
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

  // O diagnóstico técnico detalhado de tags é exclusivo para a estratégia Inbound
  const showRastreamento = !!(lead.origem && lead.origem.startsWith('Inbound'));

  const numRastreamento = "03";
  const numSobreNaoTerSite = showRastreamento ? "04" : "03";
  const numProximoPasso = lead.site
    ? (showRastreamento ? "04" : "03")
    : (showRastreamento ? "05" : "04");

  const numProjecao = lead.site
    ? (showRastreamento ? "05" : "04")
    : (showRastreamento ? "06" : "05");

  const planoAds = calcularPlanoGoogleAds(nichoLead, cidadeLead);

  async function handleSolicitarAvancado() {
    if (!lead || pedido === 'enviando' || pedido === 'feito') return;

    setPedido('enviando');
    setErroPedido(null);

    // O slug pode não existir em registros antigos; o id sempre existe.
    const resultado = await solicitarDiagnosticoAvancado(lead.slug || lead.id);

    if (resultado.success) {
      setPedido('feito');
      const msgProposta = `Olá Douglas! Quero ativar os anúncios do Google com o mapa incluso na minha cidade.`;
      const url = `https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(msgProposta)}`;
      window.open(url, '_blank');
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

          {/* ── 01. O Cenário na sua Cidade ─────────────────────────────────────────── */}
          <section>
            <TituloSecao numero="01. O Cenário na sua Região">
              Quem está recebendo as ligações hoje em {cidadeCurta || 'sua cidade'}
            </TituloSecao>

            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch] mb-6">
              {textoDemanda ? (
                <>
                  <strong className="text-zinc-900">{textoDemanda}</strong> Essas pessoas estão com o aparelho quebrado agora e vão chamar quem estiver nas primeiras posições.
                </>
              ) : (
                <>Mais de 80% das pessoas que pesquisam por conserto no Google entram em contato apenas com as primeiras empresas que aparecem.</>
              )}
            </p>

            {/* Tabela de Concorrentes Top vs Lead */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left border-collapse table-fixed bg-white">
                <colgroup>
                  <col />
                  <col className="w-[60px] sm:w-[80px]" />
                  <col className="w-[52px] sm:w-[72px]" />
                  <col className="w-[64px] sm:w-[88px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70">
                    <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Empresa</th>
                    <th className="py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center whitespace-nowrap">Posição</th>
                    <th className="py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center whitespace-nowrap">Nota</th>
                    <th className="py-2.5 pr-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right whitespace-nowrap">Avaliações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasComparativo.map((linha) => (
                    <tr key={linha.id} className={`border-b border-zinc-100 last:border-0 ${linha.isLead ? 'bg-emerald-50/80 font-bold' : ''}`}>
                      <td className="py-3 px-3 text-sm text-zinc-800">
                        <span className="block truncate">{nomeCurto(linha.nome)}</span>
                        {linha.isLead && (
                          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded mt-0.5">
                            Sua Empresa
                          </span>
                        )}
                      </td>
                      <td className={`py-3 text-center text-sm tabular-nums ${linha.isLead ? 'font-extrabold text-emerald-900' : 'text-zinc-600'}`}>
                        {linha.posicao_maps ? `${linha.posicao_maps}º` : '—'}
                      </td>
                      <td className="py-3 text-center text-sm tabular-nums text-zinc-700 whitespace-nowrap">
                        {linha.gmb_nota != null ? `⭐ ${linha.gmb_nota.toFixed(1)}` : '—'}
                      </td>
                      <td className={`py-3 pr-3 text-right text-sm tabular-nums ${linha.isLead ? 'font-bold text-zinc-900' : 'text-zinc-600'}`}>
                        {linha.gmb_avaliacoes != null ? `${linha.gmb_avaliacoes}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              💡 <strong>Oportunidade:</strong> Enquanto a sua empresa estiver abaixo do Top 3, os contatos mais lucrativos da região estão indo direto para os concorrentes que aparecem primeiro.
            </p>
          </section>

          {/* ── 02. Como Entrar no Topo ─────────────────────────────────────────── */}
          <section>
            <TituloSecao numero="02. Como Entrar no Topo">
              O que você precisa para receber chamados todos os dias
            </TituloSecao>

            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch] mb-8">
              Para colocar a {empresa} na frente de todos os concorrentes e receber mensagens no WhatsApp todos os dias, ativamos uma estrutura prática de 3 partes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                    1
                  </div>
                  <h3 className="text-[15px] font-bold text-zinc-900 mb-2">Anúncios no Topo (Google Ads)</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Coloca o seu WhatsApp em 1º lugar no Google para quem tem pressa e busca por conserto urgente agora.
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                    2
                  </div>
                  <h3 className="text-[15px] font-bold text-zinc-900 mb-2">Página de Contato Rápido</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Um site moderno e direto que abre em 1 segundo no celular e joga o cliente direto no seu WhatsApp.
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                    3
                  </div>
                  <h3 className="text-[15px] font-bold text-zinc-900 mb-2">Google Meu Negócio (Incluso)</h3>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Perfil otimizado com fotos e avaliações para passar confiança e fazer o Google cobrar mais barato por cada anúncio.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── 03. Investimento e Retorno ─────────────────────────────────────────── */}
          <section>
            <TituloSecao numero="03. Investimento Diário & Retorno">
              Quanto investir e quantos clientes você recebe no WhatsApp
            </TituloSecao>

            <p className="text-[15px] text-zinc-700 leading-relaxed max-w-[62ch] mb-8">
              Com base nos valores reais de leilão do Google para <strong>{termoDoNicho(lead.nicho) || 'seu segmento'}</strong> em <strong>{cidadeCurta || 'sua cidade'}</strong>, projetamos a estimativa para começar:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Cenário Piloto */}
              <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2 mb-4">
                    <h3 className="text-sm font-bold text-zinc-900">Cenário Recomendado para Começar</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">Piloto</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Investimento Diário:</span>
                      <strong className="text-zinc-900 font-bold">R$ {planoAds.cenarioPiloto.diario},00 / dia</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Investimento Mensal:</span>
                      <strong className="text-zinc-900 font-bold">R$ {planoAds.cenarioPiloto.mensal},00 / mês</strong>
                    </div>
                    <div className="flex justify-between text-sm border-t border-zinc-100 pt-2">
                      <span className="text-zinc-600">Visitas de Clientes no Site:</span>
                      <strong className="text-zinc-900">~{planoAds.cenarioPiloto.cliquesMes} visitas/mês</strong>
                    </div>
                    <div className="flex justify-between text-sm bg-emerald-50/80 p-2.5 rounded border border-emerald-100">
                      <span className="text-emerald-900 font-semibold">Orçamentos no WhatsApp:</span>
                      <strong className="text-emerald-900 font-extrabold text-[15px]">~{planoAds.cenarioPiloto.contatosMesMin} a {planoAds.cenarioPiloto.contatosMesMax} clientes/mês</strong>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 italic">
                  * Investimento inicial ideal para validar e colocar os primeiros serviços na bancada.
                </p>
              </div>

              {/* Cenário Escala */}
              <div className="border border-zinc-200 rounded-lg p-5 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2 mb-4">
                    <h3 className="text-sm font-bold text-zinc-900">Cenário de Aceleração</h3>
                    <span className="text-xs bg-zinc-200 text-zinc-800 font-bold px-2 py-0.5 rounded">Escala</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Investimento Diário:</span>
                      <strong className="text-zinc-900 font-bold">R$ {planoAds.cenarioEscala.diario},00 / dia</strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Investimento Mensal:</span>
                      <strong className="text-zinc-900 font-bold">R$ {planoAds.cenarioEscala.mensal},00 / mês</strong>
                    </div>
                    <div className="flex justify-between text-sm border-t border-zinc-100 pt-2">
                      <span className="text-zinc-600">Visitas de Clientes no Site:</span>
                      <strong className="text-zinc-900">~{planoAds.cenarioEscala.cliquesMes} visitas/mês</strong>
                    </div>
                    <div className="flex justify-between text-sm bg-zinc-100 p-2.5 rounded border border-zinc-200">
                      <span className="text-zinc-800 font-semibold">Orçamentos no WhatsApp:</span>
                      <strong className="text-zinc-900 font-extrabold text-[15px]">~{planoAds.cenarioEscala.contatosMesMin} a {planoAds.cenarioEscala.contatosMesMax} clientes/mês</strong>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 italic">
                  * Para quem quer manter a equipe e os técnicos com agenda 100% cheia todo mês.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 italic bg-zinc-50 border border-zinc-200 rounded p-3">
              * Estimativas baseadas em dados oficiais do leilão do Google Ads em {planoAds.medidoEm}.
            </div>
          </section>

          {/* ── 04. Ação (CTA Falar com o Douglas) ──────────────────────────────────────────────────────── */}
          <section className="nao-imprimir border-t border-zinc-200 pt-10">
            {pedido === 'feito' ? (
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-5 max-w-lg">
                <div className="flex items-center gap-2 text-emerald-900 font-bold mb-1.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Redirecionando...</span>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  Registramos seu interesse! Estamos redirecionando você para o WhatsApp do Douglas para ativar os anúncios da <strong>{empresa}</strong>.
                </p>
              </div>
            ) : (
              <div className="max-w-lg">
                <h3 className="text-xl font-extrabold text-zinc-900 mb-2">
                  Quer colocar a {empresa} no topo do Google em 48 horas?
                </h3>
                <p className="text-[15px] text-zinc-700 leading-relaxed mb-6">
                  Colocamos seus anúncios e seu site no ar com o mapa otimizado de bônus, sem reuniões demoradas.
                </p>

                <button
                  onClick={handleSolicitarAvancado}
                  disabled={pedido === 'enviando'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold px-8 py-4 rounded-lg transition-all text-base cursor-pointer shadow-md hover:shadow-lg"
                >
                  {pedido === 'enviando' ? 'Redirecionando...' : '👉 Falar com o Douglas para ativar meus anúncios'}
                </button>

                {pedido === 'erro' && (
                  <p className="text-sm text-red-700 mt-3 leading-relaxed">
                    {erroPedido || 'Não foi possível registrar o pedido.'} Fale conosco diretamente pelo link do WhatsApp abaixo.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
                  <a
                    href={`https://wa.me/${MEU_NUMERO_WHATSAPP}?text=${encodeURIComponent(`Olá Douglas! Quero ativar os anúncios do Google com o mapa incluso na minha cidade.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-650 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 transition-colors font-medium"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Falar direto no WhatsApp</span>
                  </a>
                  <a
                    href={SITE_EIXO}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-zinc-650 hover:text-emerald-800 underline underline-offset-4 decoration-zinc-300 transition-colors font-medium"
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
