export type ScoreNivel = 'alto' | 'medio' | 'baixo';
/**
 * `Diagnóstico Enviado` e `Aceitou Diagnóstico` são etapas distintas de
 * propósito: a primeira é ação sua (mandou o link), a segunda é ação do
 * prospect (pediu o diagnóstico avançado na própria página). Antes as duas
 * eram a mesma coisa, e o funil contava envio como aceite.
 */
export type StatusFunil =
  | 'Novo'
  | 'Contatado'
  | 'Aguardando Diagnóstico'
  | 'Diagnóstico Enviado'
  | 'Aceitou Diagnóstico'
  | 'Em Negociação'
  | 'Cliente'
  | 'Descartado';

export interface TagsRastreamento {
  gtm: boolean;
  google_ads: boolean;
  ga4: boolean;
  meta_pixel: boolean;
}

export interface Busca {
  id: string;
  nicho: string;
  cidade: string;
  data_busca: string;
  total_encontradas: number;
  resumo_json?: {
    alto: number;
    medio: number;
    baixo: number;
  };
  created_at?: string;
}

export interface Lead {
  id: string;
  busca_id?: string;
  nicho?: string;
  cidade?: string;
  nome: string;
  telefone?: string;
  site?: string;
  gmb_nota?: number | null;
  // null = não coletado. Zero de verdade e "a coleta falhou" não podem ser o mesmo valor.
  gmb_avaliacoes?: number | null;
  gmb_verificado?: boolean;
  site_https?: boolean;
  site_responsivo?: boolean;
  instagram?: string;
  facebook?: string;
  score_pontos: number;
  score_nivel: ScoreNivel;
  score_detalhes?: string[];
  posicao_maps: number;
  status_funil: StatusFunil;
  mensagem_sugerida?: string;
  mensagem_editada?: string;
  notas?: string;
  data_contato?: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
  // Vem da view `diagnosticos_publicos` (data da coleta do ranking), não da
  // tabela `leads`.
  data_busca?: string | null;
  
  // Novos campos Inbound / Auditoria profunda
  origem?: string;
  anuncio_detectado?: boolean;
  tags_rastreamento?: TagsRastreamento;
  
  // Relacionamento opcional de busca pai
  buscas?: {
    nicho?: string;
    cidade?: string;
  };
}

export interface ScoutJSONFormat {
  nicho: string;
  cidade: string;
  data_busca?: string;
  total_encontradas?: number;
  resumo?: {
    alto: number;
    medio: number;
    baixo: number;
  };
  ranking: Array<{
    posicao_maps: number;
    nome: string;
    telefone?: string;
    site?: string;
    gmb?: {
      nota?: number;
      avaliacoes?: number;
      verificado?: boolean;
    };
    site_auditoria?: {
      https?: boolean;
      responsivo?: boolean;
    };
    redes_sociais?: {
      instagram?: string;
      facebook?: string;
    };
    score?: {
      pontos?: number;
      nivel?: ScoreNivel;
      detalhes?: string[];
    };
    mensagem_sugerida?: string;
  }>;
}
