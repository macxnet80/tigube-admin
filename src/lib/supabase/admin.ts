import { createClient } from '@supabase/supabase-js'

// Fallback zu echten Credentials falls Umgebungsvariablen fehlen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://puvzrdnziuowznetwwey.supabase.co'
// Unterstütze beide Varianten: VITE_SUPABASE_SERVICE_ROLE_KEY und VITE_SUPABASE_SERVICE_ROLE
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_SERVICE_ROLE

console.log('Admin Supabase URL:', supabaseUrl)
console.log('Admin Service Role Key:', supabaseServiceRoleKey ? 'Set' : 'Missing')
if (!supabaseServiceRoleKey) {
  console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY oder VITE_SUPABASE_SERVICE_ROLE fehlt in .env!')
  console.warn('⚠️ RLS-Policies könnten den Zugriff auf alle Benutzer einschränken.')
}

// Admin Client mit Service Role für vollständigen Datenzugriff
// Falls Service Role Key fehlt, verwende normalen Client mit anon key
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dnpyZG56aXVvd3puZXR3d2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzU5ODIsImV4cCI6MjA2NDQxMTk4Mn0.rwUy71BrLybVgPlTdtgml9UlsN4BOW3BbU76nnUY-wk'

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'supabase-admin-storage' // Separater Storage-Key für Admin-Client
      }
    })
  : createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'supabase-admin-storage' // Separater Storage-Key auch für Fallback
      }
    })

export { supabaseAdmin as default }
