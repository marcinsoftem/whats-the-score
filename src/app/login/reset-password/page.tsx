'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Key, Loader2, Globe, Eye, EyeOff } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function ResetPasswordPage() {
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
    // Basic check to see if user is actually authenticated (handled by callback exchange)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        // If no session, they shouldn't be here unless they just completed the flow
        if (!success) {
          router.replace('/login')
        }
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
      setError(resetError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Log out after success to ensure they login with new password
      await supabase.auth.signOut()
    }
  }

  if (success) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter text-white uppercase italic">{t.common.success}</h1>
            <p className="text-muted text-base px-4">{t.auth.passwordChanged}</p>
          </div>
          <Link 
            href="/login" 
            className="btn-primary w-full h-[56px] text-lg flex items-center justify-center gap-2"
          >
            {t.common.login.toUpperCase()}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold italic tracking-tighter text-primary">{t.auth.resetPasswordTitle}</h1>
          <p className="text-muted mt-2">{t.auth.resetPasswordDesc}</p>
        </div>

        <div className="card shadow-2xl p-6">
          <form onSubmit={handleResetPassword} noValidate className="space-y-4">
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold text-center">
                {error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-[56px] text-lg mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
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
