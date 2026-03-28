"use client"

import { Share, MoreVertical, PlusSquare, ScreenShare, MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function PwaInstallationSteps() {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      {/* iOS / Safari */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-black uppercase tracking-widest text-primary italic">iOS / Safari</span>
        <div className="flex flex-col gap-2 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
               <MoreHorizontal className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {language === 'pl' ? 'Więcej' : 'More'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
               <Share className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {language === 'pl' ? 'Udostępnij' : 'Share'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
               <PlusSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {language === 'pl' ? 'Do ekranu głównego' : 'Add to Home Screen'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-white/5" />

      {/* Android / Chrome */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-black uppercase tracking-widest text-secondary italic">Android / Chrome</span>
        <div className="flex flex-col gap-2 px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
               <MoreVertical className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {language === 'pl' ? 'Więcej' : 'More'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
               <ScreenShare className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-sm font-bold text-foreground">
              {language === 'pl' ? 'Zainstaluj aplikację' : 'Install app'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
