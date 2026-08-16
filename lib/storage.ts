import { Lead, Busca } from './types';

const STORAGE_KEY_LEADS = 'eixo_crm_leads_mock';
const STORAGE_KEY_BUSCAS = 'eixo_crm_buscas_mock';

export const INITIAL_BUSCAS: Busca[] = [];

export const INITIAL_LEADS: Lead[] = [];

export function getLocalBuscas(): Busca[] {
  if (typeof window === 'undefined') return INITIAL_BUSCAS;
  const data = localStorage.getItem(STORAGE_KEY_BUSCAS);
  if (!data) {
    return INITIAL_BUSCAS;
  }
  try {
    const parsed = JSON.parse(data);
    // Filtrar dados mockados legados se houver
    return Array.isArray(parsed) ? parsed.filter(b => b.id !== 'b1') : [];
  } catch {
    return [];
  }
}

export function getLocalLeads(): Lead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  const data = localStorage.getItem(STORAGE_KEY_LEADS);
  if (!data) {
    return INITIAL_LEADS;
  }
  try {
    const parsed = JSON.parse(data);
    // Filtrar dados mockados legados se houver
    const mockIds = new Set(['l1', 'l2', 'l3', 'l4']);
    return Array.isArray(parsed) ? parsed.filter(l => !mockIds.has(l.id)) : [];
  } catch {
    return [];
  }
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
