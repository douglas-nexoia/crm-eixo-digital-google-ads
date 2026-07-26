export const runtime = 'edge';

import type { Metadata } from 'next';
import DiagnosticoCliente from './DiagnosticoCliente';

/**
 * Esta rota existe como Server Component por um motivo só: montar as etiquetas
 * Open Graph antes do HTML sair.
 *
 * O relatório é enviado por WhatsApp, e o robô que desenha o cartão de preview
 * não executa JavaScript. Enquanto a página era client-side, ele recebia o
 * esqueleto vazio e caía no plano B — título igual ao domínio, descrição igual
 * à própria URL, sem imagem. Era exatamente o cartão sem informação nenhuma
 * que chegava ao prospect.
 *
 * O conteúdo continua sendo montado no navegador, em DiagnosticoCliente.
 */

type Props = {
  // Nesta versão do Next, params é uma Promise e precisa ser aguardada.
  params: Promise<{ id: string }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LeadMetadata = {
  nome: string;
  nicho: string | null;
  cidade: string | null;
  posicao_maps: number | null;
};

/**
 * Leitura direta no PostgREST em vez do client do supabase-js.
 *
 * O client compartilhado é configurado com persistSession/autoRefreshToken,
 * que são coisas de navegador; aqui roda no edge, sem localStorage, e só
 * precisamos de quatro colunas públicas. Um fetch simples evita arrastar a
 * maquinaria de sessão para o servidor.
 */
async function buscarLeadParaMetadata(slugOrId: string): Promise<LeadMetadata | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !chave || !slugOrId) return null;

  const campo = UUID.test(slugOrId) ? 'id' : 'slug';
  const endpoint =
    `${url}/rest/v1/diagnosticos_publicos` +
    `?${campo}=eq.${encodeURIComponent(slugOrId)}` +
    `&select=nome,nicho,cidade,posicao_maps&limit=1`;

  try {
    const resposta = await fetch(endpoint, {
      headers: { apikey: chave, Authorization: `Bearer ${chave}` },
      // O mesmo link costuma ser reenviado e reaberto várias vezes. Cinco
      // minutos poupam idas ao banco sem congelar o nome da empresa.
      next: { revalidate: 300 },
    });

    if (!resposta.ok) return null;

    const linhas = (await resposta.json()) as LeadMetadata[];
    return linhas?.[0] ?? null;
  } catch {
    // Metadata nunca deve derrubar a página: sem dado, cai no texto genérico.
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lead = await buscarLeadParaMetadata(id);

  if (!lead?.nome) {
    return {
      title: 'Diagnóstico de Visibilidade • Eixo Digital',
      description: 'Análise de presença digital no Google para negócios locais.',
    };
  }

  // "Jundiaí/SP" vira "Jundiaí", como nas mensagens de WhatsApp.
  const cidade = (lead.cidade || '').split('/')[0].trim();
  const onde = cidade ? ` em ${cidade}` : '';

  const titulo = `Diagnóstico de Visibilidade — ${lead.nome}`;

  const descricao = lead.posicao_maps
    ? `A ${lead.nome} aparece na ${lead.posicao_maps}ª posição do Google Maps${onde}. Veja o comparativo com as primeiras colocadas da região.`
    : `Comparativo da presença da ${lead.nome} no Google com as primeiras colocadas da região.`;

  return {
    title: titulo,
    description: descricao,
    // O relatório é de uma empresa específica e não deve entrar em índice de
    // busca — é material comercial, não conteúdo público.
    robots: { index: false, follow: false },
    openGraph: {
      title: titulo,
      description: descricao,
      siteName: 'Eixo Digital',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: titulo,
      description: descricao,
    },
  };
}

export default async function DiagnosticoPublicoPage({ params }: Props) {
  const { id } = await params;
  return <DiagnosticoCliente slug={id} />;
}
