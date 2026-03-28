"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Save, RefreshCcw, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";

export default function ProfileSettingsPage() {
  return (
    <AuthGuard>
      <ProfileSettingsContent />
    </AuthGuard>
  );
}

function ProfileSettingsContent() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [nickname, setNickname] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

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
      setIsLoading(false);
    }
    loadProfile();
  }, [supabase]);

  // Handle saving...
  const handleUpdateProfile = async () => {
    if (!nickname.trim() || nickname.length > 10) return;
    setIsSaving(true);
    setProfileError(null);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

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

      const avatarUrl = `https://api.dicebear.com/9.x/personas/svg?seed=${avatarSeed}`;

      const { error: pError } = await supabase
        .from('profiles')
        .update({
          nickname,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);
      
      if (pError) throw pError;

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 pb-32 items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex items-center gap-4 animate-in fade-in duration-500">
        <Link 
          href="/settings"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl flex-1 font-bold tracking-tight uppercase italic text-primary">
          {t.settings.profile}
        </h1>
      </header>

      <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-50">
        <div className="card p-6 bg-accent/10 border-white/5 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setAvatarSeed(crypto.randomUUID())}
              className="group relative"
            >
              <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-white/5 flex items-center justify-center relative overflow-hidden ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-active:scale-95">
                <img 
                  src={`https://api.dicebear.com/9.x/personas/svg?seed=${avatarSeed || 'user'}`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
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
              <label className="text-sm font-medium text-muted uppercase tracking-wider">{t.players.nickname}</label>
              <span className={`text-sm font-medium uppercase tracking-wider ${nickname.length > 10 ? 'text-secondary' : 'text-muted/40'}`}>
                {nickname.length}/10
              </span>
            </div>
            <input
              type="text"
              maxLength={10}
              className={`w-full bg-black/40 border rounded-xl p-3 focus:outline-none transition-colors text-white ${
                profileError ? 'border-secondary' : 'border-white/10 focus:border-primary'
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
            className={
              saveSuccess 
                ? "w-full h-[56px] text-lg flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl font-black uppercase tracking-widest transition-all"
                : "btn-primary w-full h-[56px] text-lg flex items-center justify-center gap-2"
            }
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
      </div>
    </div>
  );
}
