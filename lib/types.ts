export type ScoreNivel = 'alto' | 'medio' | 'baixo';
export type StatusFunil = 'Novo' | 'Contatado' | 'Aceitou Diagnóstico' | 'Em Negociação' | 'Cliente' | 'Descartado';

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
  gmb_nota?: number;
  gmb_avaliacoes?: number;
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
      responsivo?: border;
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
