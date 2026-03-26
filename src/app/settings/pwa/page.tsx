"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PwaSettingsPage() {
  return (
    <AuthGuard>
      <PwaSettingsContent />
    </AuthGuard>
  );
}

function PwaSettingsContent() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-md mx-auto min-h-screen p-6">
      <header className="flex items-center gap-4">
        <Link 
          href="/settings"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
          {t.settings.installPwa}
        </h1>
      </header>

      <div className="flex flex-col gap-6">
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
      </div>
    </div>
  );
}
