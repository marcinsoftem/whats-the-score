"use client"

import { useState, useEffect } from "react"
import { Smartphone, X, Share, MoreVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export function PwaPrompt() {
  const { t } = useLanguage()
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null)

  useEffect(() => {
    // Check if site is already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true

    if (isStandalone) return

    // Identify platform
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    // Check if user dismissed it recently
    const dismissed = localStorage.getItem("pwa_prompt_dismissed")
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    if (dismissed && parseInt(dismissed) > oneWeekAgo) return

    if (isIos) {
      setPlatform("ios")
      setShow(true)
    } else if (isAndroid) {
      setPlatform("android")
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString())
  }

  if (!show || !platform) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-24 left-4 right-4 z-[200] max-w-md mx-auto"
      >
        <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted" />
          </button>

          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{t.settings.installPwa}</h3>
                <span className="text-[10px] font-bold text-muted uppercase italic tracking-tighter">What's The Score? Web App</span>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed font-medium">
              {t.settings.pwaDesc}
            </p>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              {platform === "ios" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                      <Share className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-[11px] font-bold">{t.settings.pwaIos}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                    <MoreVertical className="w-3 h-3 text-secondary" />
                  </div>
                  <span className="text-[11px] font-bold">{t.settings.pwaAndroid}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
