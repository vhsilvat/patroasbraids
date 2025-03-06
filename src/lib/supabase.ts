import { createClient } from '@supabase/supabase-js'

// Essas variáveis devem ser substituídas pelas suas credenciais reais do Supabase
// Em ambiente de produção, use variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-supabase.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon-publica'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)