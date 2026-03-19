"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Globe, Info, LogOut, Check, Smartphone, User as UserIcon, Save, RefreshCcw, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  const handleUpdateProfile = async () => {
    if (!nickname.trim() || nickname.length > 10) return;
    setIsSaving(true);
    setProfileError(null);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      // 1. Check if nickname taken by ANOTHER person
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('type', 'real')
        .ilike('nickname', nickname)
        .neq('id', user.id)
        .maybeSingle();
      
      if (existing) {
        setProfileError(t.players.alreadyExists);
        setIsSaving(false);
        return;
      }

      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`;

      // 2. Update profiles table
      const { error: pError } = await supabase
        .from('profiles')
        .update({
          nickname,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);
      
      if (pError) throw pError;

      // 3. Update auth metadata
      const { error: aError } = await supabase.auth.updateUser({
        data: {
          nickname,
          avatar_url: avatarUrl
        }
      });

      if (aError) throw aError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setProfileError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm(t.settings.logoutConfirm)) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  const languages = [
    { code: 'pl', name: t.settings.pl },
    { code: 'en', name: t.settings.en },
  ];

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-md mx-auto min-h-screen">
      <header className="flex items-center gap-4">
        <Link 
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
          {t.settings.title}
        </h1>
      </header>

      <div className="flex flex-col gap-6">
        {/* Profile Section */}
        {session && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
              <UserIcon className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted">
                {t.settings.profile}
              </h2>
            </div>
            <div className="card p-6 bg-accent/10 border-white/5 flex flex-col gap-6">
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => setAvatarSeed(crypto.randomUUID())}
                  className="group relative"
                >
                  <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-white/5 flex items-center justify-center relative overflow-hidden ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-active:scale-95">
                    <img 
                      key={avatarSeed}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed || 'Ty'}&clothing=graphicShirt&accessoriesProbability=0`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCcw className="w-6 h-6 text-white animate-spin" />
                    </div>
                  </div>
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic opacity-50">
                  {t.players.clickToRandomize}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-muted italic">{t.players.nickname}</label>
                  <span className={`text-[10px] font-black ${nickname.length > 10 ? 'text-secondary' : 'text-muted/40'}`}>
                    {nickname.length}/10
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  className={`w-full bg-white/5 border rounded-2xl p-4 text-lg font-bold text-foreground outline-none transition-all placeholder:text-muted/20 ${
                    profileError ? 'border-secondary' : 'border-white/10 focus:border-primary/50'
                  }`}
                  placeholder={t.players.nickname}
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setProfileError(null);
                  }}
                />
                {profileError && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-center">{profileError}</p>
                )}
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={isSaving || !nickname.trim() || nickname.length > 10}
                className={`w-full h-[56px] rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] ${
                  saveSuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-background shadow-[0_10px_30px_rgba(198,255,0,0.15)] disabled:opacity-20'
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    {t.settings.profileSaved}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {t.settings.saveProfile}
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Language Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">
              {t.settings.language}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as 'pl' | 'en')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                  language === lang.code 
                    ? "bg-primary/10 border-primary/50 text-foreground" 
                    : "bg-white/5 border-white/5 text-muted hover:border-white/10"
                }`}
              >
                <span className="font-bold tracking-tight">{lang.name}</span>
                {language === lang.code && <Check className="w-5 h-5 text-primary" />}
              </button>
            ))}
          </div>
        </section>

        {/* PWA Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <Smartphone className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">
              {t.settings.installPwa}
            </h2>
          </div>
          <div className="card p-6 bg-primary/5 border-primary/10 flex flex-col gap-5">
            <p className="text-sm text-muted/80 leading-relaxed font-medium">
              {t.settings.pwaDesc}
            </p>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">iOS / Safari</span>
                <p className="text-sm text-foreground font-bold">{t.settings.pwaIos}</p>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-secondary italic">Android / Chrome</span>
                <p className="text-sm text-foreground font-bold">{t.settings.pwaAndroid}</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">
              {t.settings.about}
            </h2>
          </div>
          <div className="card p-6 bg-accent/10 border-white/5 flex flex-col gap-4">
            <p className="text-sm text-muted leading-relaxed font-medium">
              {t.settings.aboutDesc}
            </p>
            <div className="flex justify-between items-center py-2 border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted/50">
                {t.settings.version}
              </span>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                1.0.0
              </span>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        {session && (
          <section className="mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary font-black uppercase tracking-widest text-sm hover:bg-secondary/20 transition-all active:scale-[0.98] group"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              {t.settings.logout}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
