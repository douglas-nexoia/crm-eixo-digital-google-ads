const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://cqvixmdkjvlgoeqxbavf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRranZsZ29lcXhiYXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTE2NTIsImV4cCI6MjEwMDU2NzY1Mn0.A_8wogQgOicXzK71ju_Gqes-kXdH59IR8AVtxVAErcM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // 1. Buscar o lead Mr. Conforto
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
    const nichoLead = lead.nicho || '';
    const { data: concorrentes } = await supabase
      .from('leads')
      .select('*')
      .neq('id', lead.id)
      .ilike('nicho', `%${nichoLead}%`);

    console.log('--- CONCORRENTES DO MESMO NICHO ---');
    console.log(concorrentes ? concorrentes.length : 0, 'encontrados');
    if (concorrentes) {
      concorrentes.slice(0, 10).forEach(c => {
        console.log(`- ${c.nome} (Nicho: "${c.nicho}", Cidade: "${c.cidade}", Posição: ${c.posicao_maps})`);
      });
    }
  }
}

run();
