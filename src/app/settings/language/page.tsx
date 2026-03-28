"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LanguageSettingsPage() {
  return (
    <AuthGuard>
      <LanguageSettingsContent />
    </AuthGuard>
  );
}

function LanguageSettingsContent() {
  const { t, language, setLanguage } = useLanguage();
  const supabase = createClient();

  const handleLanguageChange = async (newLang: 'pl' | 'en') => {
    setLanguage(newLang);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.auth.updateUser({
        data: { language: newLang }
      });
    }
  };

  const languages = [
    { code: 'pl', name: t.settings.pl },
    { code: 'en', name: t.settings.en },
  ];

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex items-center gap-4">
        <Link 
          href="/settings"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl flex-1 font-bold tracking-tight uppercase italic text-primary">
          {t.settings.language}
        </h1>
      </header>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code as 'pl' | 'en')}
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
      </div>
    </div>
  );
}
