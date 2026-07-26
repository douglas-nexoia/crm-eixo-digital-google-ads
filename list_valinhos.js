const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://cqvixmdlrmqayukcaxch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRscm1xYXl1a2NheGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4OTU5MDAsImV4cCI6MjA1NDQ3MTkwMH0.2oW-xY01PZ-5x7T9c3b8r-6X1m4-Z4v2b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nome, nicho, cidade');
  
  if (error) {
    console.error('Erro:', error);
    return;
  }
  
  console.log('Total de leads no banco:', leads.length);
  const valinhos = leads.filter(l => l.cidade && l.cidade.toLowerCase().includes('valinhos'));
  console.log('Leads de Valinhos:', valinhos.map(l => ({ nome: l.nome, nicho: l.nicho, cidade: l.cidade })));
}

run();
