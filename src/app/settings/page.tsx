"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, ChevronRight, Globe, Info, LogOut, Smartphone, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setNickname(session.user.user_metadata?.nickname || "");
        
        const avatarUrl = session.user.user_metadata?.avatar_url || "";
        if (avatarUrl) {
          try {
            const url = new URL(avatarUrl);
            const seed = url.searchParams.get('seed');
            if (seed) setAvatarSeed(seed);
          } catch (e) {
            setAvatarSeed(session.user.id);
          }
        }
      }
    });

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setNickname(profile.nickname || "");
        if (profile.avatar_url) {
          try {
            const url = new URL(profile.avatar_url);
            const seed = url.searchParams.get('seed');
            if (seed) setAvatarSeed(seed);
          } catch (e) {
            setAvatarSeed(user.id);
          }
        }
      }
    }
    loadProfile();
  }, [supabase]);

  const handleLogout = async () => {
    if (confirm(t.settings.logoutConfirm)) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex items-center gap-4">
        <Link 
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl flex-1 font-bold tracking-tight uppercase italic text-primary">
          {t.settings.title}
        </h1>
      </header>

      <div className="flex flex-col gap-6">
        {/* Profile Card */}
        {session && (
          <section className="flex flex-col gap-4">
            <Link 
              href="/settings/profile" 
              className="flex items-center gap-4 p-4 rounded-3xl bg-accent/10 border border-white/5 hover:border-primary/30 hover:bg-accent/20 transition-all group active:scale-[0.98]"
            >
              <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-white/5 flex items-center justify-center relative overflow-hidden group-hover:ring-2 ring-primary/30 transition-all">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed || 'Ty'}&clothing=graphicShirt&accessoriesProbability=0`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-muted italic">{t.settings.profile}</span>
                <span className="text-xl font-bold text-foreground tracking-tight">{nickname || 'Gracz'}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </section>
        )}

        <div className="w-full h-px bg-white/5 my-2" />

        {/* Menu Items */}
        <section className="flex flex-col gap-3">
          <Link
            href="/settings/about"
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight text-foreground">{t.settings.about}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
          </Link>

          <Link
            href="/settings/language"
            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <span className="font-bold tracking-tight text-foreground">{t.settings.language}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
          </Link>
        </section>

        {/* Logout Section */}
        {session && (
          <section className="mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary font-black uppercase tracking-widest text-sm hover:bg-secondary/20 transition-all active:scale-[0.98] group"
            >
              <LogOut className="w-5 h-5" />
              {t.settings.logout}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
