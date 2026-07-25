import { Lead, Busca } from './types';

const STORAGE_KEY_LEADS = 'eixo_crm_leads_mock';
const STORAGE_KEY_BUSCAS = 'eixo_crm_buscas_mock';

export const INITIAL_BUSCAS: Busca[] = [
  {
    id: 'b1',
    nicho: 'odontologia',
    cidade: 'Jundiaí/SP',
    data_busca: new Date().toISOString(),
    total_encontradas: 4,
    resumo_json: { alto: 2, medio: 1, baixo: 1 },
    created_at: new Date().toISOString()
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'l1',
    busca_id: 'b1',
    nome: 'Clínica Sorriso Perfeito',
    telefone: '11988887777',
    site: null,
    gmb_nota: 3.9,
    gmb_avaliacoes: 8,
    gmb_verificado: false,
    site_https: false,
    site_responsivo: false,
    instagram: null,
    facebook: null,
    score_pontos: 85,
    score_nivel: 'alto',
    score_detalhes: [
      'Sem site próprio',
      'Nota GMB muito baixa (3.9)',
      'Poucas avaliações no GMB (8)',
      'Perfil GMB não verificado',
      'Sem Instagram',
      'Sem Facebook'
    ],
    posicao_maps: 4,
    status_funil: 'Novo',
    mensagem_sugerida: 'Olá! Notei que a Clínica Sorriso Perfeito está em #4 no Google Maps em Jundiaí/SP com nota 3.9. Fizemos uma análise gratuita dos seus concorrentes. Posso enviar?',
    mensagem_editada: null,
    data_contato: null,
    notas: 'Lead com altíssimo potencial de conversão.',
    slug: 'clinica-sorriso-perfeito-jundiai',
    created_at: new Date().toISOString()
  },
  {
    id: 'l2',
    busca_id: 'b1',
    nome: 'Odonto Excellence Jundiaí',
    telefone: '11977776666',
    site: 'http://odontoexcellence.com.br',
    gmb_nota: 4.8,
    gmb_avaliacoes: 142,
    gmb_verificado: true,
    site_https: false,
    site_responsivo: true,
    instagram: 'https://instagram.com/odontoexcellence',
    facebook: null,
    score_pontos: 35,
    score_nivel: 'baixo',
    score_detalhes: [
      'Site sem certificado de segurança HTTPS',
      'Sem página no Facebook'
    ],
    posicao_maps: 1,
    status_funil: 'Cliente',
    mensagem_sugerida: 'Olá! Parabéns pela liderança no Maps! Identificamos um detalhe crítico no HTTPS do seu site.',
    mensagem_editada: null,
    data_contato: new Date().toISOString(),
    notas: 'Cliente em carteira.',
    slug: 'odonto-excellence-jundiai',
    created_at: new Date().toISOString()
  },
  {
    id: 'l3',
    busca_id: 'b1',
    nome: 'Dra. Ana Odontologia Estética',
    telefone: '11966665555',
    site: 'https://draanaodonto.com.br',
    gmb_nota: 4.3,
    gmb_avaliacoes: 29,
    gmb_verificado: true,
    site_https: true,
    site_responsivo: false,
    instagram: 'https://instagram.com/draana',
    facebook: 'https://facebook.com/draana',
    score_pontos: 60,
    score_nivel: 'medio',
    score_detalhes: [
      'Site não é adaptado para celulares (não responsivo)',
      'Poucas avaliações em relação aos concorrentes do topo'
    ],
    posicao_maps: 3,
    status_funil: 'Aceitou Diagnóstico',
    mensagem_sugerida: 'Olá Dra. Ana! Notamos que seu site não abre bem no celular de potenciais pacientes.',
    mensagem_editada: null,
    data_contato: new Date().toISOString(),
    notas: 'Aguardando envio do diagnóstico.',
    slug: 'dra-ana-odontologia-estetica',
    created_at: new Date().toISOString()
  },
  {
    id: 'l4',
    busca_id: 'b1',
    nome: 'Instituto Orto Smile',
    telefone: '11955554444',
    site: null,
    gmb_nota: 4.1,
    gmb_avaliacoes: 15,
    gmb_verificado: false,
    site_https: false,
    site_responsivo: false,
    instagram: null,
    facebook: null,
    score_pontos: 78,
    score_nivel: 'alto',
    score_detalhes: [
      'Sem site web',
      'Perfil GMB não verificado',
      'Sem redes sociais vinculadas'
    ],
    posicao_maps: 2,
    status_funil: 'Contatado',
    mensagem_sugerida: 'Olá! Tudo bem? Vi que o Instituto Orto Smile está sem site oficial no perfil do Google.',
    mensagem_editada: null,
    data_contato: new Date().toISOString(),
    notas: 'Mensagem enviada via WhatsApp.',
    slug: 'instituto-orto-smile',
    created_at: new Date().toISOString()
  }
];

export function getLocalBuscas(): Busca[] {
  if (typeof window === 'undefined') return INITIAL_BUSCAS;
  const data = localStorage.getItem(STORAGE_KEY_BUSCAS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_BUSCAS, JSON.stringify(INITIAL_BUSCAS));
    return INITIAL_BUSCAS;
  }
  return JSON.parse(data);
}

export function getLocalLeads(): Lead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  const data = localStorage.getItem(STORAGE_KEY_LEADS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(INITIAL_LEADS));
    return INITIAL_LEADS;
  }
  return JSON.parse(data);
}

export function saveLocalLead(updatedLead: Lead): Lead {
  const leads = getLocalLeads();
  const index = leads.findIndex(l => l.id === updatedLead.id);
  if (index !== -1) {
    leads[index] = updatedLead;
  } else {
    leads.push(updatedLead);
  }
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
  return updatedLead;
}

export function saveLocalBuscaAndLeads(busca: Busca, leads: Lead[]): void {
  const buscas = getLocalBuscas();
  buscas.unshift(busca);
  localStorage.setItem(STORAGE_KEY_BUSCAS, JSON.stringify(buscas));

  const currentLeads = getLocalLeads();
  const newLeads = [...leads, ...currentLeads];
  localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(newLeads));
}
