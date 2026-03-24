'use client'

import { useState } from 'react'
import { createClient, isConfigured } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Loader2, Globe, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LoginPage() {
  const { t, language, setLanguage } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Manual format check to prevent browser from silently blocking submission
    if (!email.includes('@')) {
      setError(t.auth.errors.invalidEmail);
      return;
    }

    setLoading(true)
    setError(null)

    // Check if Supabase is configured
    if (!isConfigured()) {
      setError(t.auth.emailConfigError)
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      let errorMessage = t.auth.errors.generic;
      const lowerError = signInError.message.toLowerCase();
      
      if (lowerError.includes('invalid login credentials')) {
        errorMessage = t.auth.errors.invalidCredentials;
      } else if (lowerError.includes('email not confirmed')) {
        errorMessage = t.auth.errors.emailNotConfirmed;
      } else if (lowerError.includes('rate limit')) {
        errorMessage = t.auth.errors.rateLimit;
      } else if (lowerError.includes('email format')) {
        errorMessage = t.auth.errors.invalidEmail;
      }
      
      setError(errorMessage)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold italic tracking-tighter text-primary">{t.home.title}</h1>
          <p className="text-muted mt-2">{t.home.subtitle}</p>
        </div>

        <div className="card shadow-2xl min-h-[360px] flex flex-col justify-center p-6">
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold flex items-center justify-center text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.password}</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 focus:outline-none focus:border-primary transition-colors text-white"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end pr-1">
                <Link 
                  href="/login/forgot-password" 
                  className="text-xs font-bold text-muted hover:text-primary transition-colors italic uppercase tracking-wider"
                >
                  {t.auth.forgotPassword}
                </Link>
              </div>
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
                  <LogIn className="w-5 h-5" />
                  {t.auth.signInButton}
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-muted">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="text-secondary font-bold hover:underline">
            {t.auth.signUp.toUpperCase()}
          </Link>
        </p>

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
