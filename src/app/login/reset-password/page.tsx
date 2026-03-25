'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session && !success) {
        router.replace('/login')
      }
    }
    checkSession()
  }, [supabase.auth, router, success])

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
      await supabase.auth.signOut()
    }
  }

  if (success) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
        <div className="w-full max-w-md space-y-6 text-center animate-in zoom-in duration-500">
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">{t.common.success}</h1>
            <p className="text-muted text-base px-8 font-bold uppercase tracking-widest opacity-60 italic">{t.auth.passwordChanged}</p>
          </div>
          <Link 
            href="/login" 
            className="btn-primary w-full h-[56px] text-lg font-black italic tracking-widest flex items-center justify-center rounded-2xl shadow-[0_8px_30px_rgba(198,255,0,0.15)] uppercase"
          >
            {t.common.login}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-2">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">{t.home.title}</h1>
          <p className="text-muted mt-2 font-bold uppercase tracking-widest text-xs opacity-60 italic">{t.auth.resetPasswordTitle}</p>
        </div>

        <div className="card shadow-2xl p-8 bg-black/40 border border-white/5 rounded-[32px] backdrop-blur-xl">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center italic">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] italic ml-1">{t.auth.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full h-[56px] bg-white/5 border border-white/10 rounded-2xl px-5 pr-12 focus:outline-none focus:border-primary transition-colors text-white font-bold"
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-2 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] italic ml-1">{t.auth.confirmPassword}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full h-[56px] bg-white/5 border border-white/10 rounded-2xl px-5 focus:outline-none focus:border-primary transition-colors text-white font-bold"
                  placeholder={t.auth.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-[56px] text-lg font-black italic tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_30px_rgba(198,255,0,0.15)] rounded-2xl uppercase"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                t.auth.saveNewPasswordButton
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-8 text-center">
          <button 
            onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/20 px-4 py-2 rounded-full border border-primary/10 transition-all italic mx-auto"
          >
            <Globe className="w-3.5 h-3.5" />
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
