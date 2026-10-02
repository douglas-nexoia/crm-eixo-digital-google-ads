/**
 * Base de coordenadas e cidades vizinhas para cálculo do raio de atendimento (35 km).
 * Cobre as principais cidades, polos metropolitanos e capitais do Brasil.
 */

export interface DadosCoberturaCidade {
  lat: number;
  lon: number;
  cidade: string;
  estado: string;
  cidadesVizinhas: string[];
}

const COORDENADAS_CIDADES: Record<string, DadosCoberturaCidade> = {
  // ── MATO GROSSO ──
  'cuiaba': {
    lat: -15.6014,
    lon: -56.0979,
    cidade: 'Cuiabá',
    estado: 'MT',
    cidadesVizinhas: ['Várzea Grande', 'Santo Antônio de Leverger', 'Nossa Senhora do Livramento', 'Chapada dos Guimarães', 'Acorizal'],
  },
  'varzea grande': {
    lat: -15.6469,
    lon: -56.1325,
    cidade: 'Várzea Grande',
    estado: 'MT',
    cidadesVizinhas: ['Cuiabá', 'Nossa Senhora do Livramento', 'Santo Antônio de Leverger', 'Acorizal', 'Poconé'],
  },
  'rondonopolis': {
    lat: -16.4674,
    lon: -54.6369,
    cidade: 'Rondonópolis',
    estado: 'MT',
    cidadesVizinhas: ['Pedra Preta', 'São José do Povo', 'Itiquira', 'Juscimeira'],
  },
  'sinop': {
    lat: -11.8608,
    lon: -55.5097,
    cidade: 'Sinop',
    estado: 'MT',
    cidadesVizinhas: ['Sorriso', 'Santa Carmem', 'Vera', 'Ipiranga do Norte'],
  },

  // ── MATO GROSSO DO SUL ──
  'campo grande': {
    lat: -20.4697,
    lon: -54.6201,
    cidade: 'Campo Grande',
    estado: 'MS',
    cidadesVizinhas: ['Terenos', 'Sidrolândia', 'Jaraguari', 'Ribas do Rio Pardo', 'Rochedo'],
  },
  'dourados': {
    lat: -22.2231,
    lon: -54.8119,
    cidade: 'Dourados',
    estado: 'MS',
    cidadesVizinhas: ['Itaporã', 'Fátima do Sul', 'Maracaju', 'Douradina'],
  },

  // ── SÃO PAULO - CAMPINAS & RMC ──
  'valinhos': {
    lat: -22.9708,
    lon: -46.9961,
    cidade: 'Valinhos',
    estado: 'SP',
    cidadesVizinhas: ['Campinas', 'Vinhedo', 'Louveira', 'Itatiba', 'Hortolândia', 'Paulínia'],
  },
  'campinas': {
    lat: -22.9099,
    lon: -47.0626,
    cidade: 'Campinas',
    estado: 'SP',
    cidadesVizinhas: ['Valinhos', 'Vinhedo', 'Sumaré', 'Hortolândia', 'Paulínia', 'Indaiatuba', 'Jaguariúna'],
  },
  'vinhedo': {
    lat: -23.0297,
    lon: -46.9749,
    cidade: 'Vinhedo',
    estado: 'SP',
    cidadesVizinhas: ['Valinhos', 'Louveira', 'Jundiaí', 'Itatiba', 'Campinas'],
  },
  'indaiatuba': {
    lat: -23.0903,
    lon: -47.2181,
    cidade: 'Indaiatuba',
    estado: 'SP',
    cidadesVizinhas: ['Salto', 'Itu', 'Campinas', 'Elias Fausto', 'Monte Mor'],
  },
  'sumare': {
    lat: -22.8228,
    lon: -47.2669,
    cidade: 'Sumaré',
    estado: 'SP',
    cidadesVizinhas: ['Hortolândia', 'Campinas', 'Nova Odessa', 'Paulínia', 'Americana'],
  },
  'hortolandia': {
    lat: -22.8583,
    lon: -47.2200,
    cidade: 'Hortolândia',
    estado: 'SP',
    cidadesVizinhas: ['Sumaré', 'Campinas', 'Monte Mor', 'Paulínia'],
  },
  'paulinia': {
    lat: -22.7639,
    lon: -47.1539,
    cidade: 'Paulínia',
    estado: 'SP',
    cidadesVizinhas: ['Campinas', 'Cosmópolis', 'Sumaré', 'Jaguariúna', 'Hortolândia'],
  },
  'americana': {
    lat: -22.7394,
    lon: -47.3314,
    cidade: 'Americana',
    estado: 'SP',
    cidadesVizinhas: ['Santa Bárbara d\'Oeste', 'Nova Odessa', 'Limeira', 'Sumaré', 'Paulínia'],
  },
  'limeira': {
    lat: -22.5647,
    lon: -47.4017,
    cidade: 'Limeira',
    estado: 'SP',
    cidadesVizinhas: ['Americana', 'Cordeirópolis', 'Iracemápolis', 'Cosmópolis', 'Artur Nogueira'],
  },
  'piracicaba': {
    lat: -22.7253,
    lon: -47.6492,
    cidade: 'Piracicaba',
    estado: 'SP',
    cidadesVizinhas: ['Rio das Pedras', 'Saltinho', 'Santa Bárbara d\'Oeste', 'Limeira', 'Capivari'],
  },

  // ── SÃO PAULO - JUNDIAÍ ──
  'jundiai': {
    lat: -23.1857,
    lon: -46.8978,
    cidade: 'Jundiaí',
    estado: 'SP',
    cidadesVizinhas: ['Várzea Paulista', 'Campo Limpo Paulista', 'Itupeva', 'Louveira', 'Cabreúva', 'Vinhedo'],
  },
  'itupeva': {
    lat: -23.1531,
    lon: -47.0578,
    cidade: 'Itupeva',
    estado: 'SP',
    cidadesVizinhas: ['Jundiaí', 'Indaiatuba', 'Vinhedo', 'Cabreúva', 'Itu'],
  },
  'varzea paulista': {
    lat: -23.2114,
    lon: -46.8286,
    cidade: 'Várzea Paulista',
    estado: 'SP',
    cidadesVizinhas: ['Jundiaí', 'Campo Limpo Paulista', 'Franco da Rocha', 'Jarinu'],
  },
  'louveira': {
    lat: -23.0867,
    lon: -46.9511,
    cidade: 'Louveira',
    estado: 'SP',
    cidadesVizinhas: ['Vinhedo', 'Valinhos', 'Jundiaí', 'Itatiba'],
  },
  'itatiba': {
    lat: -23.0058,
    lon: -46.8422,
    cidade: 'Itatiba',
    estado: 'SP',
    cidadesVizinhas: ['Valinhos', 'Vinhedo', 'Jundiaí', 'Morungaba', 'Bragança Paulista'],
  },

  // ── SÃO PAULO - CAPITAL & GRANDE SP ──
  'sao paulo': {
    lat: -23.5505,
    lon: -46.6333,
    cidade: 'São Paulo',
    estado: 'SP',
    cidadesVizinhas: ['Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'São Caetano', 'Diadema', 'Barueri'],
  },
  'guarulhos': {
    lat: -23.4542,
    lon: -46.5333,
    cidade: 'Guarulhos',
    estado: 'SP',
    cidadesVizinhas: ['São Paulo', 'Arujá', 'Itaquaquecetuba', 'Mairiporã', 'Poá'],
  },
  'sao bernardo do campo': {
    lat: -23.6944,
    lon: -46.5653,
    cidade: 'São Bernardo do Campo',
    estado: 'SP',
    cidadesVizinhas: ['Santo André', 'Diadema', 'São Caetano do Sul', 'São Paulo', 'Mauá'],
  },
  'santo andre': {
    lat: -23.6539,
    lon: -46.5322,
    cidade: 'Santo André',
    estado: 'SP',
    cidadesVizinhas: ['São Bernardo do Campo', 'São Caetano do Sul', 'Mauá', 'São Paulo', 'Ribeirão Pires'],
  },
  'osasco': {
    lat: -23.5329,
    lon: -46.7917,
    cidade: 'Osasco',
    estado: 'SP',
    cidadesVizinhas: ['São Paulo', 'Barueri', 'Carapicuíba', 'Cotia', 'Taboão da Serra'],
  },
  'barueri': {
    lat: -23.5111,
    lon: -46.8761,
    cidade: 'Barueri',
    estado: 'SP',
    cidadesVizinhas: ['Santana de Parnaíba', 'Osasco', 'Carapicuíba', 'Jandira', 'Itapevi', 'Cotia'],
  },

  // ── SÃO PAULO - INTERIOR & LITORAL ──
  'sorocaba': {
    lat: -23.5015,
    lon: -47.4526,
    cidade: 'Sorocaba',
    estado: 'SP',
    cidadesVizinhas: ['Votorantim', 'Itu', 'Salto de Pirapora', 'Araçoiaba da Serra', 'Porto Feliz', 'Mairinque'],
  },
  'ribeirao preto': {
    lat: -21.1767,
    lon: -47.8208,
    cidade: 'Ribeirão Preto',
    estado: 'SP',
    cidadesVizinhas: ['Sertãozinho', 'Cravinhos', 'Serrana', 'Jardinópolis', 'Dumont', 'Brodowski'],
  },
  'santos': {
    lat: -23.9608,
    lon: -46.3336,
    cidade: 'Santos',
    estado: 'SP',
    cidadesVizinhas: ['São Vicente', 'Praia Grande', 'Cubatão', 'Guarujá', 'Bertioga'],
  },
  'praia grande': {
    lat: -24.0058,
    lon: -46.4028,
    cidade: 'Praia Grande',
    estado: 'SP',
    cidadesVizinhas: ['São Vicente', 'Santos', 'Mongaguá', 'Cubatão'],
  },
  'bertioga': {
    lat: -23.8547,
    lon: -46.1394,
    cidade: 'Bertioga',
    estado: 'SP',
    cidadesVizinhas: ['Santos', 'Guarujá', 'São Sebastião', 'Mogi das Cruzes'],
  },
  'sao jose dos campos': {
    lat: -23.1896,
    lon: -45.8841,
    cidade: 'São José dos Campos',
    estado: 'SP',
    cidadesVizinhas: ['Jacareí', 'Caçapava', 'Taubaté', 'Santa Branca', 'Igaratá'],
  },
  'mogi guacu': {
    lat: -22.3683,
    lon: -46.9422,
    cidade: 'Mogi Guaçu',
    estado: 'SP',
    cidadesVizinhas: ['Mogi Mirim', 'Itapira', 'Estiva Gerbi', 'Espírito Santo do Pinhal', 'Conchal'],
  },

  // ── MINAS GERAIS ──
  'belo horizonte': {
    lat: -19.9167,
    lon: -43.9345,
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cidadesVizinhas: ['Contagem', 'Betim', 'Nova Lima', 'Santa Luzia', 'Sabará', 'Ibirité', 'Ribeirão das Neves'],
  },
  'uberlandia': {
    lat: -18.9186,
    lon: -48.2772,
    cidade: 'Uberlândia',
    estado: 'MG',
    cidadesVizinhas: ['Araguari', 'Tupaciguara', 'Monte Alegre de Minas', 'Indianópolis'],
  },
  'montes claros': {
    lat: -16.7282,
    lon: -43.8616,
    cidade: 'Montes Claros',
    estado: 'MG',
    cidadesVizinhas: ['Bocaiúva', 'Francisco Sá', 'Mirabela', 'Juramento', 'Claro dos Poções'],
  },
  'manhuacu': {
    lat: -20.2581,
    lon: -42.0336,
    cidade: 'Manhuaçu',
    estado: 'MG',
    cidadesVizinhas: ['Manhumirim', 'Reduto', 'Luisburgo', 'Simonésia', 'Matipó'],
  },

  // ── PARANÁ ──
  'curitiba': {
    lat: -25.4284,
    lon: -49.2733,
    cidade: 'Curitiba',
    estado: 'PR',
    cidadesVizinhas: ['São José dos Pinhais', 'Colombo', 'Pinhais', 'Araucária', 'Almirante Tamandaré', 'Campo Largo'],
  },
  'cascavel': {
    lat: -24.9578,
    lon: -53.4595,
    cidade: 'Cascavel',
    estado: 'PR',
    cidadesVizinhas: ['Toledo', 'Corbélia', 'Santa Tereza do Oeste', 'Boa Vista da Aparecida', 'Catanduvas'],
  },
  'cianorte': {
    lat: -23.6631,
    lon: -52.6075,
    cidade: 'Cianorte',
    estado: 'PR',
    cidadesVizinhas: ['Tapejara', 'São Tomé', 'Terra Boa', 'Jussara', 'Indianópolis'],
  },
  'campo mourao': {
    lat: -24.0456,
    lon: -52.3789,
    cidade: 'Campo Mourão',
    estado: 'PR',
    cidadesVizinhas: ['Peabiru', 'Araruna', 'Farol', 'Luiziana', 'Mamborê'],
  },

  // ── RIO DE JANEIRO ──
  'rio de janeiro': {
    lat: -22.9068,
    lon: -43.1729,
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cidadesVizinhas: ['Niterói', 'Duque de Caxias', 'São João de Meriti', 'Nova Iguaçu', 'Nilópolis', 'Belford Roxo'],
  },
  'niteroi': {
    lat: -22.8833,
    lon: -43.1036,
    cidade: 'Niterói',
    estado: 'RJ',
    cidadesVizinhas: ['Rio de Janeiro', 'São Gonçalo', 'Maricá', 'Itaboraí'],
  },

  // ── GOIÁS & DISTRITO FEDERAL ──
  'brasilia': {
    lat: -15.7975,
    lon: -47.8919,
    cidade: 'Brasília',
    estado: 'DF',
    cidadesVizinhas: ['Taguatinga', 'Ceilândia', 'Águas Claras', 'Guará', 'Sobradinho', 'Valparaíso de Goiás'],
  },
  'goiania': {
    lat: -16.6869,
    lon: -49.2648,
    cidade: 'Goiânia',
    estado: 'GO',
    cidadesVizinhas: ['Aparecida de Goiânia', 'Senador Canedo', 'Trindade', 'Goianira', 'Anápolis'],
  },
  'itaberai': {
    lat: -16.0206,
    lon: -49.8106,
    cidade: 'Itaberaí',
    estado: 'GO',
    cidadesVizinhas: ['Goiás', 'Inhumas', 'Taquaral de Goiás', 'Itauçu'],
  },

  // ── BAHIA ──
  'salvador': {
    lat: -12.9777,
    lon: -38.5016,
    cidade: 'Salvador',
    estado: 'BA',
    cidadesVizinhas: ['Lauro de Freitas', 'Camaçari', 'Simões Filho', 'Candeias', 'Dias d\'Ávila'],
  },
  'camacari': {
    lat: -12.6975,
    lon: -38.3242,
    cidade: 'Camaçari',
    estado: 'BA',
    cidadesVizinhas: ['Lauro de Freitas', 'Dias d\'Ávila', 'Simões Filho', 'Salvador', 'Mata de São João'],
  },
  'lauro de freitas': {
    lat: -12.8944,
    lon: -38.3272,
    cidade: 'Lauro de Freitas',
    estado: 'BA',
    cidadesVizinhas: ['Salvador', 'Camaçari', 'Simões Filho'],
  },

  // ── PERNAMBUCO & CEARÁ ──
  'recife': {
    lat: -8.0476,
    lon: -34.8770,
    cidade: 'Recife',
    estado: 'PE',
    cidadesVizinhas: ['Olinda', 'Jaboatão dos Guararapes', 'Paulista', 'Camaragibe', 'São Lourenço da Mata'],
  },
  'jaboatao dos guararapes': {
    lat: -8.1130,
    lon: -35.0150,
    cidade: 'Jaboatão dos Guararapes',
    estado: 'PE',
    cidadesVizinhas: ['Recife', 'Cabo de Santo Agostinho', 'Moreno', 'Camaragibe'],
  },
  'fortaleza': {
    lat: -3.7319,
    lon: -38.5267,
    cidade: 'Fortaleza',
    estado: 'CE',
    cidadesVizinhas: ['Caucaia', 'Maracanaú', 'Eusébio', 'Aquiraz', 'Pacatuba'],
  },

  // ── RIO GRANDE DO SUL & SANTA CATARINA ──
  'porto alegre': {
    lat: -30.0346,
    lon: -51.2177,
    cidade: 'Porto Alegre',
    estado: 'RS',
    cidadesVizinhas: ['Canoas', 'Cachoeirinha', 'Gravataí', 'Viamão', 'Alvorada', 'Guaíba', 'São Leopoldo'],
  },
  'florianopolis': {
    lat: -27.5954,
    lon: -48.5480,
    cidade: 'Florianópolis',
    estado: 'SC',
    cidadesVizinhas: ['São José', 'Palhoça', 'Biguaçu', 'Santo Amaro da Imperatriz'],
  },
};

/**
 * Normaliza qualquer texto de cidade para chave de busca sem acentos e minúsculo.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export type InfoRaioCobertura = {
  lat: number;
  lon: number;
  cidade: string;
  estado: string;
  cidadesVizinhas: string[];
  tempoMedio: string;
  raioKmPadrao: number;
};

/**
 * Retorna os dados de geolocalização e cidades vizinhas para a cidade fornecida com busca inteligente.
 */
export function obterDadosCobertura(cidadeRaw?: string | null): InfoRaioCobertura {
  const bruta = (cidadeRaw || '').trim();
  const norm = normalizar(bruta);

  // 1. Busca exata ou por substring no catálogo
  let matchKey: string | null = null;

  for (const key of Object.keys(COORDENADAS_CIDADES)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      matchKey = key;
      break;
    }
  }

  // 2. Se a busca tiver cidades compostas como "Cuiabá e Várzea Grande"
  if (!matchKey) {
    if (norm.includes('cuiaba') || norm.includes('varzea grande')) {
      matchKey = 'cuiaba';
    } else if (norm.includes('salvador') || norm.includes('lauro')) {
      matchKey = 'salvador';
    } else if (norm.includes('campinas') || norm.includes('valinhos')) {
      matchKey = 'campinas';
    } else if (norm.includes('sao paulo')) {
      matchKey = 'sao paulo';
    } else if (norm.includes('rio')) {
      matchKey = 'rio de janeiro';
    } else if (norm.includes('belo horizonte')) {
      matchKey = 'belo horizonte';
    } else if (norm.includes('curitiba')) {
      matchKey = 'curitiba';
    }
  }

  const encontrada = matchKey ? COORDENADAS_CIDADES[matchKey] : null;

  // Extrai o estado se vier no formato "Cidade/UF" ou "Cidade UF"
  const matchEstado = bruta.match(/\b([A-Z]{2})\b/);
  const estadoDetectado = matchEstado ? matchEstado[1] : (encontrada?.estado || 'SP');

  // Fallbacks inteligentes por Estado se a cidade específica não estiver cadastrada
  let latFallback = -23.1857;
  let lonFallback = -46.8978;

  if (estadoDetectado === 'MT') {
    latFallback = -15.6014; // Cuiabá
    lonFallback = -56.0979;
  } else if (estadoDetectado === 'MS') {
    latFallback = -20.4697; // Campo Grande
    lonFallback = -54.6201;
  } else if (estadoDetectado === 'PR') {
    latFallback = -25.4284; // Curitiba
    lonFallback = -49.2733;
  } else if (estadoDetectado === 'RS') {
    latFallback = -30.0346; // Porto Alegre
    lonFallback = -51.2177;
  } else if (estadoDetectado === 'MG') {
    latFallback = -19.9167; // Belo Horizonte
    lonFallback = -43.9345;
  } else if (estadoDetectado === 'RJ') {
    latFallback = -22.9068; // Rio de Janeiro
    lonFallback = -43.1729;
  } else if (estadoDetectado === 'BA') {
    latFallback = -12.9777; // Salvador
    lonFallback = -38.5016;
  } else if (estadoDetectado === 'DF' || estadoDetectado === 'GO') {
    latFallback = -15.7975; // Brasília / Goiânia
    lonFallback = -47.8919;
  } else if (estadoDetectado === 'PE') {
    latFallback = -8.0476; // Recife
    lonFallback = -34.8770;
  } else if (estadoDetectado === 'CE') {
    latFallback = -3.7319; // Fortaleza
    lonFallback = -38.5267;
  }

  const lat = encontrada?.lat ?? latFallback;
  const lon = encontrada?.lon ?? lonFallback;
  const cidade = encontrada?.cidade ?? (bruta.split('/')[0].split('-')[0].trim() || 'Região Metropolitana');
  const estado = encontrada?.estado ?? estadoDetectado;

  const cidadesVizinhas = encontrada?.cidadesVizinhas ?? [
    'Bairros Centrais',
    'Zona Norte e Sul',
    'Cidades Vizinhas',
    'Condomínios da Região',
  ];

  return {
    lat,
    lon,
    cidade,
    estado,
    cidadesVizinhas,
    tempoMedio: '25 a 45 minutos de deslocamento',
    raioKmPadrao: 35,
  };
}
