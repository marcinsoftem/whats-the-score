'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient, isConfigured } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Loader2, FastForward, CheckCircle2, Globe } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

function RegisterContent() {
  const { t, language, setLanguage } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState(1)
  const [avatarSeed, setAvatarSeed] = useState(() => crypto.randomUUID())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const inviteId = searchParams.get('invite_id')
  const inviteNickname = searchParams.get('nickname')
  const inviteSeed = searchParams.get('seed')

  useEffect(() => {
    if (inviteNickname) setNickname(inviteNickname)
    if (inviteSeed) setAvatarSeed(inviteSeed)
  }, [inviteNickname, inviteSeed])

  // migrateMatches function removed - now handled by DB trigger handle_new_user with invite_id

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    setError(null)

    // Check if nickname already exists
    try {
      // Check if any REAL user already has this nickname
      const { data: realProfiles, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('type', 'real')
        .ilike('nickname', nickname);

      if (checkError) throw checkError;

      if (realProfiles && realProfiles.length > 0) {
        setError('Ten pseudonim jest już zajęty przez innego zarejestrowanego użytkownika.');
        setLoading(false);
        return;
      }

      // If we have an invite_id, we should also check if that nickname is already 
      // taken by another virtual profile (though multiple virtual are allowed, 
      // we only want to ensure no conflicts during conversion if needed).
      // Actually, since virtual players can have same names, we just proceed.
    } catch (err) {
      console.error('Pre-registration check failed:', err);
    }

    // Check if Supabase is configured
    if (!isConfigured()) {
      setError(t.auth.emailConfigError)
      setLoading(false)
      return
    }

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`

    const isValidUUID = (id: string | null) => {
      if (!id) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    const cleanInviteId = isValidUUID(inviteId) ? inviteId : null;
    console.log('Registering with:', { email, nickname, cleanInviteId });

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nickname,
          avatar_url: avatarUrl,
          type: 'real',
          invite_id: cleanInviteId, // Passed to DB trigger for automated claiming
        },
      },
    })

    if (signUpError) {
      console.error('Registration error details:', signUpError);
      if (signUpError.message.includes('rate limit')) {
        setError('Osiągnięto limit wysyłki e-maili. Odczekaj chwilę lub poproś administratora o wyłączenie potwierdzania e-maili w Supabase.')
      } else {
        // Show more details if available in the error object (e.g. from trigger)
        const detailedError = signUpError.message + (signUpError.cause ? ` (${signUpError.cause})` : '');
        setError(detailedError)
      }
      setLoading(false)
    } else {
      router.push('/login?message=Check your email to confirm your account')
    }
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold italic tracking-tighter text-primary">{t.home.title}</h1>
          <p className="text-muted mt-2">{t.home.subtitle}</p>
        </div>

        <div className="card shadow-2xl relative overflow-hidden min-h-[360px] flex flex-col justify-center p-6">
          <div className="absolute top-0 left-0 w-full h-1">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${step === 1 ? '50%' : '100%'}` }}
            />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.email}</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors text-white"
                    placeholder="twoj@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.password}</label>
                  <input
                    type="password"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors text-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full h-[56px] text-lg"
                >
                  {t.auth.nextStep}
                  <FastForward className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <button 
                    type="button"
                    onClick={() => setAvatarSeed(crypto.randomUUID())}
                    className="group relative"
                  >
                    <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-white/5 mx-auto flex items-center justify-center relative overflow-hidden ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-active:scale-95">
                      <img 
                        key={avatarSeed}
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    </div>
                  </button>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">{t.players.clickToRandomize}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.auth.nickname}</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors text-white"
                    placeholder={t.players.nickname}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/5 text-white font-bold h-[56px] rounded-xl"
                  >
                    {t.auth.back}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-[2] h-[56px] text-lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        {t.auth.createAccountButton}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-muted">
          {t.auth.haveAccount}{' '}
          <Link href="/login" className="text-secondary font-bold hover:underline">
            {t.auth.signIn.toUpperCase()}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
