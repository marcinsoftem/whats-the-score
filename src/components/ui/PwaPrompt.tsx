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
    const checkPwaStatus = () => {
      // Check if site is already in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true

      if (isStandalone) return

      // Identify platform
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIos = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)

      // Identify if we're on mobile
      const isMobile = isIos || isAndroid || /mobile|tablet|ipad|android/.test(userAgent)

      // Check if user dismissed it recently (changing to 1 hour for testing)
      const dismissed = localStorage.getItem("pwa_prompt_dismissed")
      const cooldownPeriod = 60 * 60 * 1000 // 1 hour
      const recentlyDismissed = dismissed && (Date.now() - parseInt(dismissed)) < cooldownPeriod
      
      if (recentlyDismissed) return

      if (isIos) {
        setPlatform("ios")
        setShow(true)
      } else if (isAndroid) {
        setPlatform("android")
        setShow(true)
      } else if (isMobile) {
        // Fallback for generic mobile
        setPlatform("android")
        setShow(true)
      }
    }

    const timer = setTimeout(checkPwaStatus, 1000)
    return () => clearTimeout(timer)
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
        <div className="bg-[#1a1a1a]/98 backdrop-blur-2xl border border-white/15 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Subtle Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
 
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground italic leading-tight">{t.settings.installPwa}</h3>
                <span className="text-xs font-bold text-muted uppercase italic tracking-widest opacity-60">What's The Score?</span>
              </div>
            </div>
 
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
              {t.settings.pwaDesc}
            </p>
 
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              {platform === "ios" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Share className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-bold leading-snug">{t.settings.pwaIos}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <MoreVertical className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-sm font-bold leading-snug">{t.settings.pwaAndroid}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
