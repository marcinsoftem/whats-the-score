"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Globe, Info, LogOut, Check } from "lucide-react";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, [supabase]);

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
