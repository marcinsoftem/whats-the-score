import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  if (typeof window !== 'undefined') {
    (window as any)._env_debug = {
      all_public: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')),
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
    console.log('Environment Debugger initialized. Type _env_debug in console to see details.');
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase Env Check:', {
    hasUrl: !!rawUrl,
    urlLength: rawUrl?.length || 0,
    hasKey: !!rawKey,
    keyLength: rawKey?.length || 0,
    isPlaceholderUrl: rawUrl?.includes('placeholder'),
    isPlaceholderKey: rawKey?.includes('placeholder'),
    envKeysPresent: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_'))
  });

  const supabaseUrl = (rawUrl || 'https://placeholder.supabase.co').replace(/^["']|["']$/g, '').trim()
  const supabaseKey = (rawKey || 'placeholder').replace(/^["']|["']$/g, '').trim()
  
  if (supabaseKey === 'placeholder' || supabaseKey === '') {
    console.error('Supabase client is being created with a MISSING or PLACEHOLDER key!');
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
