'use client'

import { useState } from 'react'
import { createClient, isConfigured } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Loader2, Globe, ArrowLeft, CheckCircle2 } from 'lucide-react'
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

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (otp.length !== 8) return
    
    setVerificationLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    })

    if (error) {
      setError(t.auth.invalidCodeError)
      setVerificationLoading(false)
    } else {
      router.push('/login/reset-password')
    }
  }

  const handleOtpInput = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const newOtp = otp.split('');
    newOtp[index] = digit;
    const combined = newOtp.join('').slice(0, 8);
    setOtp(combined);

    if (digit && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    
    if (combined.length === 8 && !combined.includes(' ')) {
      // Auto-submit could be handled here if desired
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (pastedData) {
      setOtp(pastedData);
      // Focus the last input or the one after the last pasted digit
      const nextIndex = Math.min(pastedData.length, 7);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    }
  }

  // Common Header for both views
  const renderHeader = (isOtp: boolean) => (
    <div className="text-center mb-8">
      <button 
        onClick={() => isOtp ? setSuccess(false) : router.push('/login')} 
        className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-6 text-sm font-bold uppercase tracking-widest italic group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        {t.auth.back}
      </button>
      <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">{t.auth.forgotPasswordTitle}</h1>
      <p className="text-muted mt-2 px-6 text-sm font-bold uppercase tracking-widest opacity-60 italic">
        {isOtp ? t.auth.enterCode : t.auth.forgotPasswordDesc}
      </p>
    </div>
  )

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-2">
        {renderHeader(success)}

        <div className="card shadow-2xl p-8 bg-black/40 border border-white/5 rounded-[32px] backdrop-blur-xl">
          {!success ? (
            <form onSubmit={handleResetRequest} noValidate className="space-y-6">
              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center italic">
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
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    {t.auth.resetPasswordButton}
                  </div>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center italic">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <label className="text-sm font-medium text-muted uppercase tracking-wider block text-center mb-2">{t.auth.verificationCode}</label>
                <div className="flex justify-between gap-1 sm:gap-2" onPaste={handlePaste}>
                  {[...Array(8)].map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="w-full h-12 sm:h-14 bg-black/40 border border-white/10 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-primary transition-colors text-white"
                      value={otp[i] || ''}
                      onChange={(e) => handleOtpInput(e.target.value, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={verificationLoading || otp.length !== 8}
                className="btn-primary w-full h-[56px] text-lg"
              >
                {verificationLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {t.auth.verifyButton}
                  </div>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Global Footer (Language Switcher) */}
        {!success && (
          <div className="flex justify-center mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
            <button 
              onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/20 px-4 py-2 rounded-full border border-primary/10 transition-all italic mx-auto"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === 'pl' ? 'English (EN)' : 'Polski (PL)'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
