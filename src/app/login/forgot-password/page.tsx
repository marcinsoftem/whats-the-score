'use client'

import { useState } from 'react'
import { createClient, isConfigured } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, Globe, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function ForgotPasswordPage() {
  const { t, language, setLanguage } = useLanguage()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

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

    // Still use resetPasswordForEmail - it sends the 6-digit code (OTP) as .Token in template
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 4) return
    
    setVerificationLoading(true)
    setError(null)
    
    console.log('Verifying recovery OTP for:', email)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    })

    if (error) {
      console.error('OTP Verification failed:', error)
      setError(t.auth.invalidCodeError)
      setVerificationLoading(false)
    } else {
      console.log('OTP verified successfully, session established')
      // Once verified, a session is established. Go directly to password change page.
      router.push('/login/reset-password')
    }
  }

  // OTP Form View
  if (success) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-3xl font-bold italic tracking-tighter text-primary uppercase">{t.auth.forgotPasswordTitle}</h1>
            <p className="text-muted mt-2 px-6">{t.auth.enterCode}</p>
            <p className="text-primary/60 text-xs font-bold mt-1">{email}</p>
          </div>

          <div className="card shadow-2xl p-8 space-y-6">
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-sm font-bold text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{t.auth.verificationCode}</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full bg-black/40 border-2 border-primary/20 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.5em] focus:outline-none focus:border-primary transition-all text-white placeholder:text-white/5"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <button
                type="submit"
                disabled={verificationLoading || otp.length < 6}
                className="btn-primary w-full h-[64px] text-lg shadow-[0_10px_30px_rgba(198,255,0,0.2)]"
              >
                {verificationLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  t.auth.verifyButton
                )}
              </button>
            </form>
            
            <button 
              onClick={() => setSuccess(false)}
              className="text-xs text-muted hover:text-white transition-colors block mx-auto font-bold uppercase tracking-widest italic"
            >
              {t.auth.back}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 text-sm font-bold uppercase tracking-widest italic group">
            <Mail className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t.auth.back}
          </Link>
          <h1 className="text-3xl font-bold italic tracking-tighter text-primary uppercase">{t.auth.forgotPasswordTitle}</h1>
          <p className="text-muted mt-2">{t.auth.forgotPasswordDesc}</p>
        </div>

        <div className="card shadow-2xl p-8">
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
              className="btn-primary w-full h-[56px] text-lg font-black italic tracking-wider transition-all hover:scale-[1.02] active:scale-98"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  {t.auth.resetPasswordButton}
                </div>
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
