import { createClient } from '@supabase/supabase-js'

// Fallback zu echten Credentials falls Umgebungsvariablen fehlen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://puvzrdnziuowznetwwey.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dnpyZG56aXVvd3puZXR3d2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzU5ODIsImV4cCI6MjA2NDQxMTk4Mn0.rwUy71BrLybVgPlTdtgml9UlsN4BOW3BbU76nnUY-wk'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export { supabase as default }
