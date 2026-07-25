export type StatusFunil = 
  | 'Novo' 
  | 'Contatado' 
  | 'Aceitou Diagnóstico' 
  | 'Em Negociação' 
  | 'Cliente' 
  | 'Descartado';

export type ScoreNivel = 'baixo' | 'medio' | 'alto';

export interface GMBData {
  nota: number | null;
  avaliacoes: number | null;
  verificado: boolean;
}

export interface SiteAuditoriaData {
  tem_site: boolean;
  https: boolean;
  responsivo: boolean;
}

export interface RedesSociaisData {
  instagram: string | null;
  facebook: string | null;
}

export interface ScoreData {
  pontos: number;
  nivel: ScoreNivel;
  detalhes: string[];
}

export interface LeadScoutItem {
  posicao_maps: number;
  nome: string;
  telefone: string | null;
  site: string | null;
  gmb: GMBData;
  site_auditoria: SiteAuditoriaData;
  redes_sociais: RedesSociaisData;
  score: ScoreData;
  mensagem_sugerida?: string;
}

export interface ScoutJSONFormat {
  nicho: string;
  cidade: string;
  data_busca: string;
  total_encontradas: number;
  resumo: {
    alto: number;
    medio: number;
    baixo: number;
  };
  ranking: LeadScoutItem[];
}

export interface Busca {
  id: string;
  nicho: string;
  cidade: string;
  data_busca: string;
  total_encontradas: number;
  resumo_json: {
    alto: number;
    medio: number;
    baixo: number;
  };
  arquivo_path?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  busca_id: string;
  nome: string;
  telefone: string | null;
  site: string | null;
  gmb_nota: number | null;
  gmb_avaliacoes: number | null;
  gmb_verificado: boolean;
  site_https: boolean;
  site_responsivo: boolean;
  instagram: string | null;
  facebook: string | null;
  score_pontos: number;
  score_nivel: ScoreNivel;
  score_detalhes: string[];
  posicao_maps: number;
  status_funil: StatusFunil;
  mensagem_sugerida: string | null;
  mensagem_editada: string | null;
  data_contato: string | null;
  notas: string | null;
  slug: string;
  created_at: string;
  // Campos relacionais opcionais
  buscas?: Busca;
}
