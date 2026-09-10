import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pingSupabase } from '@/lib/supabaseHealthCheck'

if (import.meta.env.DEV) {
  pingSupabase().then(({ ok, error }) => {
    if (ok) console.info('[supabase] connected')
    else console.error('[supabase] connection check failed:', error)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
