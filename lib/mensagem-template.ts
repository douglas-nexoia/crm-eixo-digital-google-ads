import { Lead } from './types';

const REMETENTE = 'Douglas Alexandre';
const AGENCIA = 'Eixo Digital';

/**
 * Primeira mensagem de abordagem, enviada a frio no WhatsApp.
 *
 * Três decisões que sustentam o texto:
 *
 * 1. Quem fala se identifica na primeira linha. Número desconhecido sem nome
 *    é o perfil que mais leva bloqueio, e bloqueio queima o número.
 * 2. A nota entra como injustiça, não como defeito: estar bem avaliado e
 *    ainda assim enterrado é o que incomoda o dono. Só aparece quando o
 *    número existe e é bom — elogiar uma nota ruim faria o efeito contrário.
 * 3. O pedido final é só a permissão de mandar o link. Prometer "topo do
 *    Google" na abordagem cobra o que não se controla, e contradiz o próprio
 *    relatório, que fala em Top 3.
 *
 * A lista de falhas ("Sem Facebook", "Site sem HTTPS") saiu de propósito: era
 * vocabulário interno de qualificação, e afirmar que o concorrente recebe mais
 * ligações por causa disso é fácil de contestar. Quem contesta a primeira
 * frase não lê a segunda.
 */
export function gerarMensagemPadrao(lead: Partial<Lead>, nichoParam?: string, cidadeParam?: string): string {
  const nomeEmpresa = lead.nome || 'sua empresa';
  const nicho = (lead.nicho || nichoParam || lead.buscas?.nicho || '').trim().toLowerCase();
  // "Valinhos/SP" vira "Valinhos": a sigla do estado soa formal demais numa
  // conversa de WhatsApp com um negócio da própria cidade.
  const cidade = (lead.cidade || cidadeParam || lead.buscas?.cidade || '')
    .split('/')[0]
    .trim();
  const posicao = lead.posicao_maps;
  const nota = typeof lead.gmb_nota === 'number' ? lead.gmb_nota : null;

  const abertura = `Olá, tudo bem? Aqui é o ${REMETENTE}, da ${AGENCIA}.`;

  // "Levantei" soa pesquisa; "notei" soa vigilância.
  const levantamento = nicho && cidade
    ? `Levantei as empresas de ${nicho} de ${cidade} no Google Maps`
    : cidade
      ? `Levantei as empresas do seu segmento em ${cidade} no Google Maps`
      : 'Levantei as empresas do seu segmento no Google Maps';

  let observacao: string;
  let convite: string;

  if (posicao && posicao <= 3) {
    // Já está no Top 3: o gancho deixa de ser a posição e passa a ser a
    // distância para quem está à frente.
    const comNota = nota !== null ? `, com nota ${nota.toFixed(1)}` : '';
    observacao = `${levantamento} e a ${nomeEmpresa} aparece na ${posicao}ª posição${comNota} — bem posicionada.`;
    convite = 'Montei um comparativo gratuito com quem está à frente mostrando o que separa vocês do primeiro lugar. Posso te mandar?';
  } else if (posicao) {
    observacao = nota !== null && nota >= 4
      ? `${levantamento} e a ${nomeEmpresa} me chamou atenção: nota ${nota.toFixed(1)}, bem avaliada pelos clientes, mas aparecendo na ${posicao}ª posição — enquanto as três primeiras ficam com a maior parte dos contatos.`
      : `${levantamento} e vi que a ${nomeEmpresa} aparece na ${posicao}ª posição — enquanto as três primeiras ficam com a maior parte dos contatos.`;
    convite = 'Montei um comparativo gratuito com as primeiras colocadas mostrando o que está fazendo essa diferença. Posso te mandar o link?';
  } else {
    // Sem posição não dá para afirmar nada sobre ranking.
    observacao = `${levantamento} e a ${nomeEmpresa} apareceu no levantamento.`;
    convite = 'Montei um comparativo gratuito com as primeiras colocadas da região. Posso te mandar o link?';
  }

  return `${abertura}\n\n${observacao}\n\n${convite}`;
}
