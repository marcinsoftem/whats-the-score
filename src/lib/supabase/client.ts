import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').replace(/^["']|["']$/g, '')
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder').replace(/^["']|["']$/g, '')
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}

export const isConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return url && url !== '' && !url.includes('placeholder')
}
