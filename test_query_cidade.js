const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://cqvixmdkjvlgoeqxbavf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdml4bWRranZsZ29lcXhiYXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTE2NTIsImV4cCI6MjEwMDU2NzY1Mn0.A_8wogQgOicXzK71ju_Gqes-kXdH59IR8AVtxVAErcM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const nicho = 'climatização';
  const cidade = 'Valinhos/SP';

  const { data: concorrentes, error } = await supabase
    .from('leads')
    .select('*')
    .ilike('nicho', `%${nicho}%`)
    .ilike('cidade', `%${cidade}%`);

  if (error) {
    console.error('Erro na query:', error);
    return;
  }

  console.log(`Filtro [Nicho: "${nicho}", Cidade: "${cidade}"]: ${concorrentes.length} concorrentes encontrados.`);
  concorrentes.forEach(c => {
    console.log(`- ${c.nome} (ID: ${c.id}, Cidade: "${c.cidade}", Posição: ${c.posicao_maps})`);
  });
}

run();
