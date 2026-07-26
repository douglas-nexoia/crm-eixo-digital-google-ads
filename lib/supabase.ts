import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Cliente único do Supabase da aplicação.
 *
 * Precisa ser uma instância só: duas chamadas de createClient no mesmo browser
 * criam dois clientes de auth concorrentes disputando a sessão no localStorage.
 * Qualquer módulo que precise do client importa daqui.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
