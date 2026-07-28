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
  /**
   * Mês e ano da consulta. O dado envelhece e a página precisa poder dizer
   * quando foi medido.
   */
  medidoEm: string;
};

export type Nicho = {
  /** Nome da categoria, como aparece nas telas do CRM. */
  rotulo: string;
  /**
   * Como o cliente procura no Google — e o termo a consultar no Planejador.
   *
   * Separado do rótulo de propósito: "Climatização & Ar Condicionado" é uma
   * gaveta sua, e ninguém digita "&" no Google. É o termo, não o rótulo, que
   * entra nas frases que o prospect lê.
   */
  termo: string;
};

/**
 * Catálogo dos nichos padronizados.
 *
 * Cadastre o nicho aqui antes de importar a busca: mensagem, relatório e
 * volume passam a sair consistentes desde o primeiro lead. Nicho fora do
 * catálogo não quebra nada — os textos caem no nome cru.
 *
 * Os termos abaixo são a sugestão de consulta. Ao medir no Planejador,
 * confirme se é mesmo o termo de maior volume no seu mercado e ajuste aqui —
 * o número e a frase precisam pertencer ao mesmo termo.
 */
const NICHOS: Record<string, Nicho> = {
  climatizacao:        { rotulo: 'Climatização & Ar Condicionado',     termo: 'ar condicionado' },
  celular_assistencia: { rotulo: 'Assistência Técnica de Celular',     termo: 'conserto de celular' },
  eletro_assistencia:  { rotulo: 'Assistência de Eletrodomésticos',    termo: 'assistência técnica de eletrodomésticos' },
  marcenaria:          { rotulo: 'Marcenaria & Móveis Planejados',     termo: 'móveis planejados' },
  odontologia:         { rotulo: 'Clínicas Odontológicas',             termo: 'dentista' },
  // Termo "estética" porque foi assim que o volume de Jundiaí foi medido.
  // Trocar para "clínica de estética" exige remedir — número e frase têm que
  // pertencer ao mesmo termo.
  estetica:            { rotulo: 'Clínicas de Estética',               termo: 'estética' },
  mecanica:            { rotulo: 'Oficinas Mecânicas & Autocenter',    termo: 'oficina mecânica' },
  energia_solar:       { rotulo: 'Energia Solar',                      termo: 'energia solar' },
  desentupidora:       { rotulo: 'Desentupidoras & Dedetizadoras',     termo: 'desentupidora' },
  vidracaria:          { rotulo: 'Vidraçarias & Box',                  termo: 'vidraçaria' },
  serralheria:         { rotulo: 'Serralherias & Portões',             termo: 'serralheria' },
  pintor:              { rotulo: 'Empresas de Pintura',                termo: 'pintor residencial' },
  gesso_drywall:       { rotulo: 'Gesso & Drywall',                    termo: 'gesso drywall' },
  veterinaria:         { rotulo: 'Pet Shops & Veterinárias',           termo: 'veterinário' },
  autoescola:          { rotulo: 'Autoescolas (CFC)',                  termo: 'autoescola' },
  barbearia_salao:     { rotulo: 'Salões & Barbearias',                termo: 'barbearia' },
};

/**
 * Valores livres que já existem no banco, apontando para o slug padronizado.
 *
 * Existe para a padronização não depender de migração: enquanto os registros
 * antigos não forem renomeados, eles continuam encontrando catálogo e volume.
 * Quando a migração acontecer, estas linhas viram inofensivas — e podem sair.
 */
const ALIAS: Record<string, string> = {
  'centro automotivo': 'mecanica',
  'climatizacao': 'climatizacao',
  'estetica': 'estetica',
};

/** Resolve o valor gravado no banco para o slug do catálogo. */
function nichoCanonico(nicho: string): string {
  const n = normalizar(nicho).replace(/\s+/g, '_');
  const semUnderscore = normalizar(nicho);
  return ALIAS[semUnderscore] ?? (NICHOS[n] ? n : semUnderscore);
}

/**
 * Volume medido, por nicho e cidade.
 *
 * Enquanto um par não estiver aqui, o relatório simplesmente não fala de
 * volume — melhor um bloco a menos do que um número que não sobrevive à
 * pergunta "de onde você tirou isso?".
 */
const TABELA: Record<string, DemandaBusca> = {
  'climatizacao|jundiai': { buscasMensais: 1900, medidoEm: 'julho de 2026' },
  'climatizacao|campinas': { buscasMensais: 5400, medidoEm: 'julho de 2026' },
  'climatizacao|valinhos': { buscasMensais: 390, medidoEm: 'julho de 2026' },
  'climatizacao|vinhedo': { buscasMensais: 210, medidoEm: 'julho de 2026' },
  'odontologia|jundiai': { buscasMensais: 2400, medidoEm: 'julho de 2026' },
  'centro automotivo|jundiai': { buscasMensais: 1600, medidoEm: 'julho de 2026' },
  'marcenaria|jundiai': { buscasMensais: 720, medidoEm: 'julho de 2026' },
  'estetica|jundiai': { buscasMensais: 1300, medidoEm: 'julho de 2026' },
  // Chaveado pelo slug padronizado; `centro automotivo` chega aqui via ALIAS.
  'mecanica|jundiai': { buscasMensais: 1600, medidoEm: 'julho de 2026' },
};

export const FONTE_DEMANDA = 'Planejador de Palavras-chave do Google';

/** Como o cliente procura. Cai no nome cru se o nicho não estiver no catálogo. */
export function termoDoNicho(nicho?: string | null): string | null {
  if (!nicho) return null;
  return NICHOS[nichoCanonico(nicho)]?.termo ?? nicho.trim().toLowerCase();
}

/** Nome da categoria para as telas do CRM. */
export function rotuloDoNicho(nicho?: string | null): string | null {
  if (!nicho) return null;
  return NICHOS[nichoCanonico(nicho)]?.rotulo ?? nicho.trim();
}

/** Sem acento, minúsculo, sem "/SP" — o banco guarda em formatos variados. */
function normalizar(valor: string): string {
  return valor
    .split('/')[0]
    .normalize('NFD')
    // \p{Diacritic} em vez da faixa U+0300–U+036F escrita à mão: caractere
    // combinante solto no código-fonte é frágil e some numa reformatação.
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export function chaveDemanda(nicho?: string | null, cidade?: string | null): string | null {
  if (!nicho || !cidade) return null;

  // Pelo slug canônico: assim `centro automotivo` e `mecanica` caem na mesma
  // linha da tabela, antes e depois da migração do banco.
  const n = nichoCanonico(nicho);
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

  // O termo do catálogo, não o nicho do banco: é o que faz o número
  // corresponder à frase, já que foi ele que o Planejador mediu.
  return `Cerca de ${volume} pessoas procuram ${termoDoNicho(nicho)} em ${cidadeLimpa} todo mês no Google.`;
}
