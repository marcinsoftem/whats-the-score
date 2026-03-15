'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home as HomeIcon, Trophy, Users, User as UserIcon, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const [session, setSession] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') return null

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-white/10 px-6 py-3 flex justify-between items-center z-[100] max-w-md mx-auto">
      <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <HomeIcon className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
      </Link>
      <Link href="/matches" className={`nav-item ${isActive('/matches') ? 'active' : ''}`}>
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Mecze</span>
      </Link>
      <Link href="/players" className={`nav-item ${isActive('/players') ? 'active' : ''}`}>
        <Users className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Gracze</span>
      </Link>
      
      {session ? (
        <button onClick={handleLogout} className="nav-item">
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Wyloguj</span>
        </button>
      ) : (
        <Link href="/login" className="nav-item">
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Zaloguj</span>
        </Link>
      )}
    </nav>
  )
}
