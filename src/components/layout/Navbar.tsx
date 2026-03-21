'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Home as HomeIcon, Trophy, Users, User as UserIcon, LogOut, MoreHorizontal, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Navbar() {
  const [session, setSession] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { language, setLanguage, t } = useLanguage()
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    // Clear pending path when navigation completes
    setPendingPath(null)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') return null

  const isNavItemActive = (path: string) => {
    // If we're navigating somewhere, only that path is "active"
    if (pendingPath) return pendingPath === path
    // Otherwise, check current pathname
    return pathname === path
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#121212]/95 backdrop-blur-xl border-t border-white/10 px-6 py-3 flex justify-between items-center z-[100] max-w-md mx-auto safe-area-bottom">
      <Link 
        href="/" 
        className={`nav-item transition-all duration-300 ${isNavItemActive('/') ? 'active scale-110' : 'opacity-60'}`}
        onClick={() => setPendingPath('/')}
      >
        <HomeIcon className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{t.common.home}</span>
      </Link>
      <Link 
        href="/matches" 
        className={`nav-item transition-all duration-300 ${isNavItemActive('/matches') ? 'active scale-110' : 'opacity-60'}`}
        onClick={() => setPendingPath('/matches')}
      >
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{t.common.matches}</span>
      </Link>
      <Link 
        href="/players" 
        className={`nav-item transition-all duration-300 ${isNavItemActive('/players') ? 'active scale-110' : 'opacity-60'}`}
        onClick={() => setPendingPath('/players')}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{t.common.players}</span>
      </Link>
      <Link 
        href="/stats" 
        className={`nav-item transition-all duration-300 ${isNavItemActive('/stats') ? 'active scale-110' : 'opacity-60'}`}
        onClick={() => setPendingPath('/stats')}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{t.stats.title}</span>
      </Link>
      
      <div className="flex items-center gap-6">
        {!session && (
          <Link href="/login" className="nav-item">
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t.common.login}</span>
          </Link>
        )}
        
        <Link 
          href="/settings" 
          className={`nav-item transition-all duration-300 ${isNavItemActive('/settings') ? 'active scale-110' : 'opacity-60'}`}
          onClick={() => setPendingPath('/settings')}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t.settings.more}</span>
        </Link>
      </div>
    </nav>
  )
}
