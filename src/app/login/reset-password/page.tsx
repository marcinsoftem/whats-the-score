'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Key, Loader2, Globe, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

function ResetPasswordContent() {
  const { t, language, setLanguage } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true)
  const [isExchanging, setIsExchanging] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Synchronous param detection
  const code = searchParams.get('code')

  useEffect(() => {
    // Detect PWA mode
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true
    )

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setHasSession(true)
      } else if (!code && !success && !isExchanging) {
        // Only redirect to login IF no session AND no code in URL
        router.replace('/login')
      }
    }
    
    checkSession()
  }, [supabase.auth, router, code, success, isExchanging])

  const handleManualExchange = async () => {
    if (!code) return
    
    setIsExchanging(true)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Code exchange failed:', error)
      router.replace('/auth/auth-code-error')
      return
    }
    
    // Success - clean up URL and update state
    const newUrl = window.location.pathname + (window.location.search.replace(/code=[^&]*(&|$)/, '').replace(/\?$/, ''))
    window.history.replaceState({}, '', newUrl)
    setHasSession(true)
    setIsExchanging(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      setError(t.auth.errors.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsDoNotMatch)
      return
    }

    setLoading(true)
    setError(null)

    const { error: resetError } = await supabase.auth.updateUser({
      password: password
    })

    if (resetError) {
      let errorMessage = resetError.message;
      if (resetError.message.toLowerCase().includes('should be different from the old password')) {
        errorMessage = t.auth.errors.samePassword;
      }
      setError(errorMessage)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Log out after success to ensure they login with new password
      await supabase.auth.signOut()
    }
  }

  // 1. Loading during code exchange
  if (isExchanging) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted text-sm font-black uppercase tracking-widest italic animate-pulse">
          {t.auth.authenticating}
        </p>
      </div>
    )
  }

  // 2. Success screen
  if (success) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter text-white uppercase italic">{t.common.success}</h1>
            <p className="text-muted text-base px-4">{t.auth.passwordChanged}</p>
            {!isStandalone && (
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-6 animate-pulse px-8 italic">
                {t.auth.returnToPwa}
              </p>
            )}
          </div>
          <Link 
            href="/login" 
            className="btn-primary w-full h-[56px] text-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            {t.common.login.toUpperCase()}
          </Link>
        </div>
      </div>
    )
  }

  // 3. Manual authorization screen (Bridge)
  if (code && !hasSession) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
        <div className="w-full max-w-md space-y-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(198,255,0,0.1)]">
            <Key className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
              {t.auth.forgotPasswordTitle}
            </h1>
            <p className="text-muted text-base leading-relaxed px-6">
              {t.auth.welcomeBack}
            </p>
          </div>

          <div className="pt-8">
            <button 
              onClick={handleManualExchange}
              disabled={isExchanging}
              className="btn-primary w-full h-[64px] text-lg flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(198,255,0,0.2)]"
            >
              {isExchanging ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  {t.auth.authorizeAction}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 4. Password form (only if session is active)
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold italic tracking-tighter text-primary">{t.home.title}</h1>
          <p className="text-muted mt-2">{t.auth.resetPasswordTitle}</p>
        </div>

        <div className="card shadow-2xl p-8">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.newPassword}</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 focus:outline-none focus:border-primary transition-colors text-white"
                    placeholder={t.auth.newPasswordPlaceholder}
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.confirmPassword}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors text-white"
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-[56px] text-lg mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  {t.auth.saveNewPasswordButton}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background text-foreground fixed inset-0 z-[200]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
