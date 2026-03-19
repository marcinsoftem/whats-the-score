'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Preloader } from '@/components/ui/Preloader'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  if (loading) {
    return <Preloader />
  }

  return <>{children}</>
}
