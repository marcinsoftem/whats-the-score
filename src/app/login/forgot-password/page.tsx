'use client'

import { useState } from 'react'
import { createClient, isConfigured } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Loader2, Globe, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function ForgotPasswordPage() {
  const { t, language, setLanguage } = useLanguage()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.includes('@')) {
      setError(t.auth.errors.invalidEmail)
      return
    }

    setLoading(true)
    setError(null)

    if (!isConfigured()) {
      setError(t.auth.emailConfigError)
      setLoading(false)
      return
    }

    // Determine return URL
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    // We redirect directly to reset-password and pass current UI language
    const redirectTo = `${origin}/login/reset-password?lang=${language}`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter text-white uppercase italic">{t.common.success}</h1>
            <p className="text-muted text-base px-4">{t.auth.linkSent}</p>
          </div>
          <Link 
            href="/login" 
            className="btn-primary w-full h-[56px] text-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.auth.back.toUpperCase()}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 text-sm font-bold uppercase tracking-widest italic group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t.auth.back}
          </Link>
          <h1 className="text-3xl font-bold italic tracking-tighter text-primary">{t.auth.forgotPasswordTitle}</h1>
          <p className="text-muted mt-2">{t.auth.forgotPasswordDesc}</p>
        </div>

        <div className="card shadow-2xl p-6">
          <form onSubmit={handleResetRequest} noValidate className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.email}</label>
              <input
                type="email"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors text-white"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-[56px] text-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  {t.auth.resetPasswordButton}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-4 text-center">
          <button 
            onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-all italic mx-auto"
          >
            <Globe className="w-3 h-3" />
            {language === 'pl' ? 'English (EN)' : 'Polski (PL)'}
          </button>
        </div>
      </div>
    </div>
  )
}
