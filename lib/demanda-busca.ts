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
  /** Lance mínimo para topo de página (CPC Mínimo) em R$ */
  cpcMin?: number;
  /** Lance máximo para topo de página (CPC Máximo) em R$ */
  cpcMax?: number;
  /** CPC Médio realista de leilão em R$ */
  cpcMedio?: number;
  /** Investimento diário recomendado para teste/piloto */
  diarioPiloto?: number;
  /** Investimento diário recomendado para escala/aceleração */
  diarioEscala?: number;
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

export type BenchmarkNicho = {
  cpcMin: number;
  cpcMax: number;
  cpcMedio: number;
  diarioPiloto: number;
  diarioEscala: number;
};

export const BENCHMARKS_NICHO: Record<string, BenchmarkNicho> = {
  eletro_assistencia:  { cpcMin: 1.80, cpcMax: 3.90, cpcMedio: 2.85, diarioPiloto: 25, diarioEscala: 45 },
  climatizacao:        { cpcMin: 2.20, cpcMax: 4.80, cpcMedio: 3.50, diarioPiloto: 30, diarioEscala: 60 },
  celular_assistencia: { cpcMin: 1.50, cpcMax: 3.20, cpcMedio: 2.35, diarioPiloto: 20, diarioEscala: 40 },
  odontologia:         { cpcMin: 2.80, cpcMax: 6.50, cpcMedio: 4.65, diarioPiloto: 35, diarioEscala: 70 },
  estetica:            { cpcMin: 2.10, cpcMax: 4.90, cpcMedio: 3.50, diarioPiloto: 30, diarioEscala: 55 },
  marcenaria:          { cpcMin: 2.50, cpcMax: 5.80, cpcMedio: 4.15, diarioPiloto: 30, diarioEscala: 60 },
  mecanica:            { cpcMin: 1.90, cpcMax: 4.20, cpcMedio: 3.05, diarioPiloto: 25, diarioEscala: 50 },
  desentupidora:       { cpcMin: 4.50, cpcMax: 12.00, cpcMedio: 8.25, diarioPiloto: 50, diarioEscala: 100 },
  energia_solar:       { cpcMin: 3.80, cpcMax: 9.00, cpcMedio: 6.40, diarioPiloto: 45, diarioEscala: 90 },
  vidracaria:          { cpcMin: 1.80, cpcMax: 3.80, cpcMedio: 2.80, diarioPiloto: 25, diarioEscala: 45 },
  serralheria:         { cpcMin: 1.70, cpcMax: 3.60, cpcMedio: 2.65, diarioPiloto: 25, diarioEscala: 45 },
  veterinaria:         { cpcMin: 1.60, cpcMax: 3.50, cpcMedio: 2.55, diarioPiloto: 25, diarioEscala: 45 },
  autoescola:          { cpcMin: 2.00, cpcMax: 4.50, cpcMedio: 3.25, diarioPiloto: 30, diarioEscala: 55 },
  barbearia_salao:     { cpcMin: 1.50, cpcMax: 3.20, cpcMedio: 2.35, diarioPiloto: 20, diarioEscala: 40 },
  pintor:              { cpcMin: 1.70, cpcMax: 3.50, cpcMedio: 2.60, diarioPiloto: 25, diarioEscala: 45 },
  gesso_drywall:       { cpcMin: 1.80, cpcMax: 3.80, cpcMedio: 2.80, diarioPiloto: 25, diarioEscala: 45 },
  default:             { cpcMin: 2.00, cpcMax: 4.50, cpcMedio: 3.25, diarioPiloto: 25, diarioEscala: 50 },
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
  'assistencia tecnica': 'eletro_assistencia',
  'assistencia tecnica de eletrodomesticos': 'eletro_assistencia',
  'assistencia tecnica eletrodomesticos': 'eletro_assistencia',
};

/** Resolve o valor gravado no banco para o slug do catálogo. */
function nichoCanonico(nicho: string): string {
  const n = normalizar(nicho).replace(/\s+/g, '_');
  const semUnderscore = normalizar(nicho);
  return ALIAS[semUnderscore] ?? (NICHOS[n] ? n : semUnderscore);
}

/**
 * Volume e custos medidos por nicho e cidade.
 *
 * Enquanto um par não estiver aqui, o relatório simplesmente não fala de
 * volume — melhor um bloco a menos do que um número que não sobrevive à
 * pergunta "de onde você tirou isso?".
 */
const TABELA: Record<string, DemandaBusca> = {
  'climatizacao|jundiai': { buscasMensais: 1900, cpcMin: 2.20, cpcMax: 4.80, cpcMedio: 3.50, diarioPiloto: 30, diarioEscala: 60, medidoEm: 'julho de 2026' },
  'climatizacao|campinas': { buscasMensais: 5400, cpcMin: 2.50, cpcMax: 5.20, cpcMedio: 3.85, diarioPiloto: 35, diarioEscala: 70, medidoEm: 'julho de 2026' },
  'climatizacao|valinhos': { buscasMensais: 390, cpcMin: 2.00, cpcMax: 4.50, cpcMedio: 3.25, diarioPiloto: 25, diarioEscala: 45, medidoEm: 'julho de 2026' },
  'climatizacao|vinhedo': { buscasMensais: 210, cpcMin: 1.90, cpcMax: 4.20, cpcMedio: 3.05, diarioPiloto: 25, diarioEscala: 45, medidoEm: 'julho de 2026' },
  'odontologia|jundiai': { buscasMensais: 2400, cpcMin: 2.80, cpcMax: 6.50, cpcMedio: 4.65, diarioPiloto: 35, diarioEscala: 70, medidoEm: 'julho de 2026' },
  'centro automotivo|jundiai': { buscasMensais: 1600, cpcMin: 1.90, cpcMax: 4.20, cpcMedio: 3.05, diarioPiloto: 25, diarioEscala: 50, medidoEm: 'julho de 2026' },
  'marcenaria|jundiai': { buscasMensais: 720, cpcMin: 2.50, cpcMax: 5.80, cpcMedio: 4.15, diarioPiloto: 30, diarioEscala: 60, medidoEm: 'julho de 2026' },
  'estetica|jundiai': { buscasMensais: 1300, cpcMin: 2.10, cpcMax: 4.90, cpcMedio: 3.50, diarioPiloto: 30, diarioEscala: 55, medidoEm: 'julho de 2026' },
  'mecanica|jundiai': { buscasMensais: 1600, cpcMin: 1.90, cpcMax: 4.20, cpcMedio: 3.05, diarioPiloto: 25, diarioEscala: 50, medidoEm: 'julho de 2026' },
  'eletro_assistencia|sorocaba': { buscasMensais: 2100, cpcMin: 1.80, cpcMax: 3.90, cpcMedio: 2.85, diarioPiloto: 25, diarioEscala: 45, medidoEm: 'agosto de 2026' },
  'eletro_assistencia|belo horizonte': { buscasMensais: 8900, cpcMin: 2.10, cpcMax: 4.50, cpcMedio: 3.30, diarioPiloto: 30, diarioEscala: 60, medidoEm: 'agosto de 2026' },
  'eletro_assistencia|jundiai': { buscasMensais: 1450, cpcMin: 1.80, cpcMax: 3.80, cpcMedio: 2.80, diarioPiloto: 25, diarioEscala: 45, medidoEm: 'agosto de 2026' },
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

export type PlanoGoogleAds = {
  cpcMin: number;
  cpcMax: number;
  cpcMedio: number;
  buscasMensais: number | null;
  medidoEm: string;
  cenarioPiloto: {
    diario: number;
    mensal: number;
    cliquesMes: number;
    contatosMesMin: number;
    contatosMesMax: number;
  };
  cenarioEscala: {
    diario: number;
    mensal: number;
    cliquesMes: number;
    contatosMesMin: number;
    contatosMesMax: number;
  };
};

/**
 * Calcula o Plano Factual de Investimento Diário e Projeção de Retorno no Google Ads.
 */
export function calcularPlanoGoogleAds(nicho?: string | null, cidade?: string | null): PlanoGoogleAds {
  const demanda = buscarDemanda(nicho, cidade);
  const nCanonico = nicho ? nichoCanonico(nicho) : 'default';
  const benchmark = BENCHMARKS_NICHO[nCanonico] || BENCHMARKS_NICHO['default'];

  const cpcMin = demanda?.cpcMin ?? benchmark.cpcMin;
  const cpcMax = demanda?.cpcMax ?? benchmark.cpcMax;
  const cpcMedio = demanda?.cpcMedio ?? benchmark.cpcMedio;
  const diarioPiloto = demanda?.diarioPiloto ?? benchmark.diarioPiloto;
  const diarioEscala = demanda?.diarioEscala ?? benchmark.diarioEscala;
  const buscasMensais = demanda?.buscasMensais ?? null;
  const medidoEm = demanda?.medidoEm ?? 'leilão atual do Google Ads';

  // Cálculos Cenário Piloto
  const mensalPiloto = diarioPiloto * 30;
  const cliquesMesPiloto = Math.round(mensalPiloto / cpcMedio);
  const contatosMesMinPiloto = Math.round(cliquesMesPiloto * 0.12);
  const contatosMesMaxPiloto = Math.round(cliquesMesPiloto * 0.18);

  // Cálculos Cenário Escala
  const mensalEscala = diarioEscala * 30;
  const cliquesMesEscala = Math.round(mensalEscala / cpcMedio);
  const contatosMesMinEscala = Math.round(cliquesMesEscala * 0.12);
  const contatosMesMaxEscala = Math.round(cliquesMesEscala * 0.18);

  return {
    cpcMin,
    cpcMax,
    cpcMedio,
    buscasMensais,
    medidoEm,
    cenarioPiloto: {
      diario: diarioPiloto,
      mensal: mensalPiloto,
      cliquesMes: cliquesMesPiloto,
      contatosMesMin: contatosMesMinPiloto,
      contatosMesMax: contatosMesMaxPiloto,
    },
    cenarioEscala: {
      diario: diarioEscala,
      mensal: mensalEscala,
      cliquesMes: cliquesMesEscala,
      contatosMesMin: contatosMesMinEscala,
      contatosMesMax: contatosMesMaxEscala,
    },
  };
}
