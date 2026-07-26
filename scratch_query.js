const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://cqvixmdlrmqayukcaxch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRscm1xYXl1a2NheGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4OTU5MDAsImV4cCI6MjA1NDQ3MTkwMH0.2oW-xY01PZ-5x7T9c3b8r-6X1m4-Z4v2b';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // 1. Ver o lead Mr. Conforto
  const { data: target } = await supabase
    .from('leads')
    .select('*')
    .ilike('nome', '%Mr. Conforto%');
  
  console.log('--- LEAD ENCONTRADO ---');
  console.log(target);

  if (target && target.length > 0) {
    const lead = target[0];
    console.log(`Nicho salvo no lead: "${lead.nicho}"`);
    console.log(`Cidade salva no lead: "${lead.cidade}"`);

    // 2. Buscar outros do mesmo nicho e cidade
    const { data: concorrentes } = await supabase
      .from('leads')
      .select('*')
      .ilike('nicho', `%${lead.nicho}%`)
      .ilike('cidade', `%${lead.cidade}%`);

    console.log('--- CONCORRENTES DO MESMO NICHO E CIDADE ---');
    console.log(concorrentes ? concorrentes.length : 0, 'encontrados');
    if (concorrentes) {
      concorrentes.slice(0, 5).forEach(c => {
        console.log(`- ${c.nome} (Nicho: "${c.nicho}", Cidade: "${c.cidade}", Posição: ${c.posicao_maps})`);
      });
    }

    // 3. Ver todos os nichos do banco para entender como estão categorizados
    const { data: todos } = await supabase.from('leads').select('nicho, cidade');
    const nichos = new Set(todos.map(t => t.nicho));
    const cidades = new Set(todos.map(t => t.cidade));
    console.log('--- TODOS OS NICHOS NO BANCO ---');
    console.log(Array.from(nichos));
    console.log('--- TODAS AS CIDADES NO BANCO ---');
    console.log(Array.from(cidades));
  }
}

run();
