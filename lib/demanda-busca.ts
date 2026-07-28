/**
 * Volume de busca por nicho e cidade.
 *
 * Por que uma tabela escrita à mão, e não um cálculo:
 *
 * Extrapolar volume a partir da população erra por múltiplos — busca per
 * capita varia demais entre nicho e região. E o número entra num relatório que
 * afirma, na mesma página, que os dados vêm das APIs oficiais do Google. Um
 * valor derivado ao lado dessa frase derruba as duas coisas: o dono pergunta
 * de onde saiu, descobre que é estimativa, e passa a duvidar também da
 * posição, da nota e dos concorrentes — que são reais.
 *
 * O Planejador de Palavras-chave dá volume POR LOCALIDADE. Como a prospecção
 * acontece cidade por cidade, mapear cada par que você realmente trabalha é
 * uma tarde de trabalho, uma vez só, com número medido em vez de inferido.
 *
 * COMO PREENCHER
 * --------------
 * 1. Planejador de Palavras-chave do Google > Descobrir novas palavras-chave
 * 2. Local: a cidade (não o estado, não o país)
 * 3. Termo: como o cliente fala, não como você categoriza
 *    ("ar condicionado" e não "climatização"; "marcenaria sob medida")
 * 4. Some as variações relevantes e arredonde para baixo
 *
 * Arredondar para baixo é deliberado: se o número for questionado, é melhor
 * estar abaixo da realidade.
 *
 * A chave é `nicho|cidade`, ambos normalizados por `chaveDemanda` — sem
 * acento, minúsculo e sem a sigla do estado.
 */

export type DemandaBusca = {
  /** Buscas mensais na cidade. Medido, nunca calculado. */
  buscasMensais: number;
  /** Mês e ano da consulta. O dado envelhece e a página precisa poder dizer quando. */
  medidoEm: string;
};

/**
 * Vazio de propósito. Enquanto um par não estiver aqui, o relatório
 * simplesmente não fala de volume — melhor um bloco a menos do que um número
 * que não sobrevive à pergunta "de onde você tirou isso?".
 *
 * Exemplo do formato:
 *   'climatizacao|jundiai': { buscasMensais: 2100, medidoEm: 'julho de 2026' },
 */
const TABELA: Record<string, DemandaBusca> = {
};

export const FONTE_DEMANDA = 'Planejador de Palavras-chave do Google';

/** Sem acento, minúsculo, sem "/SP" — o banco guarda em formatos variados. */
export function chaveDemanda(nicho?: string | null, cidade?: string | null): string | null {
  if (!nicho || !cidade) return null;

  const normalizar = (valor: string) =>
    valor
      .split('/')[0]
      .normalize('NFD')
      // \p{Diacritic} em vez da faixa U+0300–U+036F escrita à mão: caractere
      // combinante solto no código-fonte é frágil e some numa reformatação.
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLowerCase();

  const n = normalizar(nicho);
  const c = normalizar(cidade);

  return n && c ? `${n}|${c}` : null;
}

export function buscarDemanda(nicho?: string | null, cidade?: string | null): DemandaBusca | null {
  const chave = chaveDemanda(nicho, cidade);
  return chave ? TABELA[chave] ?? null : null;
}

/**
 * A frase que vai ao prospect.
 *
 * A fatia dos primeiros colocados fica qualitativa ("a maior parte") de
 * propósito: percentual exato de CTR do bloco local varia por nicho e por
 * consulta, e um "30%" cravado tem o mesmo problema de credibilidade que o
 * volume extrapolado teria.
 */
export function fraseDemanda(nicho?: string | null, cidade?: string | null): string | null {
  const demanda = buscarDemanda(nicho, cidade);
  if (!demanda) return null;

  const cidadeLimpa = (cidade || '').split('/')[0].trim();
  const volume = demanda.buscasMensais.toLocaleString('pt-BR');

  return `Cerca de ${volume} pessoas procuram ${String(nicho).toLowerCase()} em ${cidadeLimpa} todo mês no Google.`;
}
