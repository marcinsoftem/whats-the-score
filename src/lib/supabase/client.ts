import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').replace(/^["']|["']$/g, '')
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder').replace(/^["']|["']$/g, '')
  
  if (supabaseKey === 'placeholder') {
    console.error('Supabase client is being created with a PLACEHOLDER key! Check your environment variables.');
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}

export const isConfigured = () => {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^["']|["']$/g, '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim()
  
  const isUrlValid = url !== '' && !url.includes('placeholder')
  const isKeyValid = key !== '' && !key.includes('placeholder')
  
  if (!isUrlValid) console.warn('Supabase URL is missing or placeholder!');
  if (!isKeyValid) console.warn('Supabase ANON KEY is missing or placeholder!');
  
  return isUrlValid && isKeyValid
}
