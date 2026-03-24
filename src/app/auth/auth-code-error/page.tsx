'use client'

import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function AuthCodeErrorPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      
      <h1 className="text-3xl font-black italic tracking-tighter text-white mb-4 uppercase">
        {t.auth.errors.generic}
      </h1>
      
      <p className="text-muted text-base mb-8 max-w-xs mx-auto">
        Próba wymiany kodu autoryzacyjnego zakończyła się niepowodzeniem. 
        Może to oznaczać, że link jest nieaktualny lub został już użyty.
      </p>

      <div className="space-y-3 w-full max-w-xs">
        <Link 
          href="/login" 
          className="btn-primary w-full h-[56px] text-lg flex items-center justify-center gap-2"
        >
          {t.common.login.toUpperCase()}
        </Link>
        <Link 
          href="/" 
          className="w-full h-[56px] bg-white/5 text-white font-bold flex items-center justify-center gap-2 rounded-xl"
        >
          <Home className="w-5 h-5" />
          {t.common.home.toUpperCase()}
        </Link>
      </div>
    </div>
  )
}
