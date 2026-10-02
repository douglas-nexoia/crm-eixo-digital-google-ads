/**
 * Base de coordenadas e cidades vizinhas para cálculo do raio de atendimento (35 km).
 * Cobre as principais cidades e polos metropolitanos do Brasil.
 */

export interface DadosCoberturaCidade {
  lat: number;
  lon: number;
  cidade: string;
  estado: string;
  cidadesVizinhas: string[];
}

const COORDENADAS_CIDADES: Record<string, DadosCoberturaCidade> = {
  // ── SÃO PAULO - POLO CAMPINAS & RMC ──
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

  // ── SÃO PAULO - AGLOMERAÇÃO JUNDIAÍ ──
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

  // ── SÃO PAULO - OUTRAS REGIÕES ──
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
  'sao jose dos campos': {
    lat: -23.1896,
    lon: -45.8841,
    cidade: 'São José dos Campos',
    estado: 'SP',
    cidadesVizinhas: ['Jacareí', 'Caçapava', 'Taubaté', 'Santa Branca', 'Igaratá'],
  },
  'piracicaba': {
    lat: -22.7253,
    lon: -47.6492,
    cidade: 'Piracicaba',
    estado: 'SP',
    cidadesVizinhas: ['Rio das Pedras', 'Saltinho', 'Santa Bárbara d\'Oeste', 'Limeira', 'Capivari'],
  },

  // ── DEMAIS CAPITAIS & POLOS NACIONAIS ──
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
  'curitiba': {
    lat: -25.4284,
    lon: -49.2733,
    cidade: 'Curitiba',
    estado: 'PR',
    cidadesVizinhas: ['São José dos Pinhais', 'Colombo', 'Pinhais', 'Araucária', 'Almirante Tamandaré', 'Campo Largo'],
  },
  'porto alegre': {
    lat: -30.0346,
    lon: -51.2177,
    cidade: 'Porto Alegre',
    estado: 'RS',
    cidadesVizinhas: ['Canoas', 'Cachoeirinha', 'Gravataí', 'Viamão', 'Alvorada', 'Guaíba'],
  },
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
    cidadesVizinhas: ['Aparecida de Goiânia', 'Senador Canedo', 'Trindade', 'Goianira'],
  },
  'salvador': {
    lat: -12.9777,
    lon: -38.5016,
    cidade: 'Salvador',
    estado: 'BA',
    cidadesVizinhas: ['Lauro de Freitas', 'Camaçari', 'Simões Filho', 'Candeias'],
  },
  'recife': {
    lat: -8.0476,
    lon: -34.8770,
    cidade: 'Recife',
    estado: 'PE',
    cidadesVizinhas: ['Olinda', 'Jaboatão dos Guararapes', 'Paulista', 'Camaragibe', 'São Lourenço da Mata'],
  },
  'fortaleza': {
    lat: -3.7319,
    lon: -38.5267,
    cidade: 'Fortaleza',
    estado: 'CE',
    cidadesVizinhas: ['Caucaia', 'Maracanaú', 'Eusébio', 'Aquiraz', 'Pacatuba'],
  },
};

/**
 * Normaliza o nome da cidade para busca no catálogo.
 */
function normalizarCidade(cidadeRaw?: string | null): string {
  if (!cidadeRaw) return '';
  return cidadeRaw
    .split('/')[0]
    .split('-')[0]
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export type InfoRaioCobertura = {
  lat: number;
  lon: number;
  cidade: string;
  estado: string;
  cidadesVizinhas: string[];
  bbox35km: string;
  tempoMedio: string;
  raioKmPadrao: number;
  osmEmbedUrl: string;
};

/**
 * Retorna os dados de geolocalização e raio de atendimento de 35 km para a cidade fornecida.
 */
export function obterDadosCobertura(cidadeRaw?: string | null): InfoRaioCobertura {
  const norm = normalizarCidade(cidadeRaw);

  const encontrada = COORDENADAS_CIDADES[norm];

  const lat = encontrada?.lat ?? -23.1857; // Jundiaí/SP como centro padrão
  const lon = encontrada?.lon ?? -46.8978;
  const cidade = encontrada?.cidade ?? (cidadeRaw?.split('/')[0]?.trim() || 'Região Metropolitana');
  const estado = encontrada?.estado ?? (cidadeRaw?.includes('/') ? cidadeRaw.split('/')[1]?.trim() : 'SP');

  const cidadesVizinhas = encontrada?.cidadesVizinhas ?? [
    'Bairros Centrais',
    'Zona Norte e Sul',
    'Cidades Vizinhas',
    'Condomínios da Região',
  ];

  // Cálculo geográfico do raio de 35 km:
  // ~0.32 graus de latitude e ~0.35 graus de longitude cobrem ~35 km de raio
  const minLon = (lon - 0.35).toFixed(4);
  const minLat = (lat - 0.32).toFixed(4);
  const maxLon = (lon + 0.35).toFixed(4);
  const maxLat = (lat + 0.32).toFixed(4);

  const bbox35km = `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox35km}&layer=mapnik&marker=${lat}%2C${lon}`;

  return {
    lat,
    lon,
    cidade,
    estado,
    cidadesVizinhas,
    bbox35km,
    tempoMedio: '25 a 45 minutos de deslocamento',
    raioKmPadrao: 35,
    osmEmbedUrl,
  };
}
