'use client'

import { useState, useEffect } from 'react'
import { createClient, isConfigured } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Loader2, FastForward, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState(1)
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
  }, [inviteNickname])

  const migrateMatches = (newUserId: string) => {
    if (!inviteId) return

    // 1. Migrate match history
    const history = localStorage.getItem('wts_match_history')
    if (history) {
      const matches = JSON.parse(history)
      const updatedMatches = matches.map((match: any) => {
        const updatedPlayers = match.players.map((p: any) => 
          p.id === inviteId ? { ...p, id: newUserId, type: 'real' } : p
        )
        return { ...match, players: updatedPlayers }
      })
      localStorage.setItem('wts_match_history', JSON.stringify(updatedMatches))
    }

    // 2. Remove from virtual players list
    const savedPlayers = localStorage.getItem('wts_players')
    if (savedPlayers) {
      const players = JSON.parse(savedPlayers)
      const filteredPlayers = players.filter((p: any) => p.id !== inviteId)
      localStorage.setItem('wts_players', JSON.stringify(filteredPlayers))
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    setError(null)

    // Check if Supabase is configured
    if (!isConfigured()) {
      setError('Błąd konfiguracji Supabase. Na Vercel upewnij się, że masz dodane zmienne NEXT_PUBLIC_SUPABASE_URL oraz NEXT_PUBLIC_SUPABASE_ANON_KEY (z przedrostkiem NEXT_PUBLIC_).')
      setLoading(false)
      return
    }

    const avatarUrl = inviteSeed 
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${inviteSeed}&clothing=graphicShirt&accessoriesProbability=0`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
          avatar_url: avatarUrl,
          type: 'real',
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      if (signUpData.user) {
        migrateMatches(signUpData.user.id)
      }
      router.push('/login?message=Check your email to confirm your account')
    }
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-background text-foreground overflow-hidden overscroll-none fixed inset-0">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-primary">REJESTRACJA</h1>
          <p className="text-muted mt-2">Dołącz do społeczności WTS</p>
        </div>

        <div className="card shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${step === 1 ? '50%' : '100%'}` }}
            />
          </div>

          <form onSubmit={handleRegister} className="space-y-6 pt-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">Email</label>
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
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">Hasło</label>
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
                  DALEJ
                  <FastForward className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted uppercase tracking-wider">Pseudonim</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-primary transition-colors text-white"
                    placeholder="Twoja ksywa"
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
                    WRÓĆ
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
                        STWÓRZ KONTO
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-muted">
          Masz już konto?{' '}
          <Link href="/login" className="text-secondary font-bold hover:underline">
            ZALOGUJ SIĘ
          </Link>
        </p>
      </div>
    </div>
  )
}
