"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AboutSettingsPage() {
  return (
    <AuthGuard>
      <AboutSettingsContent />
    </AuthGuard>
  );
}

function AboutSettingsContent() {
  const { t } = useLanguage();
  const [isPwaExpanded, setIsPwaExpanded] = useState(false);
  const [isReleaseNotesExpanded, setIsReleaseNotesExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-md mx-auto min-h-screen p-6">
      <header className="flex items-center gap-4 animate-in fade-in duration-500">
        <Link 
          href="/settings"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
          {t.settings.about}
        </h1>
      </header>

      <div className="flex flex-col gap-6">
        <div className="card p-6 bg-accent/10 border-white/5 flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-50">
          <p className="text-sm text-muted leading-relaxed font-medium">
            {t.settings.aboutDesc}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Collapsible items logic same as before... */}
          <button
            onClick={() => {
              setIsPwaExpanded(!isPwaExpanded);
              if (isReleaseNotesExpanded) setIsReleaseNotesExpanded(false);
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              isPwaExpanded 
                ? "bg-primary/10 border-primary/50 text-foreground" 
                : "bg-white/5 border-white/5 text-muted hover:border-white/20"
            }`}
          >
            <h2 className="text-sm font-black uppercase tracking-widest italic">
              {t.settings.installPwa}
            </h2>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isPwaExpanded ? 'rotate-180 text-primary' : 'text-muted'}`} />
          </button>

          <AnimatePresence>
            {isPwaExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => {
              setIsReleaseNotesExpanded(!isReleaseNotesExpanded);
              if (isPwaExpanded) setIsPwaExpanded(false);
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              isReleaseNotesExpanded 
                ? "bg-primary/10 border-primary/50 text-foreground" 
                : "bg-white/5 border-white/5 text-muted hover:border-white/20"
            }`}
          >
            <h2 className="text-sm font-black uppercase tracking-widest italic">
              {t.settings.releaseNotes}
            </h2>
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isReleaseNotesExpanded ? 'rotate-180 text-primary' : 'text-muted'}`} />
          </button>

          <AnimatePresence>
            {isReleaseNotesExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="card p-6 bg-accent/5 border-white/5 flex flex-col gap-6">
                  {Object.values(t.settings.releases).map((release: any) => (
                    <div key={release.version} className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded tracking-tighter uppercase italic">{release.version}</span>
                        <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest">{release.date}</span>
                      </div>
                      <p className="text-xs text-muted/80 leading-snug">
                        {release.note}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-8 flex flex-col items-center gap-2 pt-8 border-t border-white/5 opacity-50 text-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] italic text-muted">
              {t.settings.version}
            </span>
            <span className="text-xs font-black text-primary italic">
              1.0.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
