"use client"

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function Preloader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          {/* Animated rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-t-2 border-r-2 border-primary/20 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-20 h-20 border-b-2 border-l-2 border-secondary/30 rounded-full"
          />
          
          {/* Central Logo/Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div
               animate={{ 
                 scale: [1, 1.1, 1],
                 opacity: [0.5, 1, 0.5]
               }}
               transition={{ 
                 duration: 2, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               }}
               className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(198,255,0,0.5)]"
             >
               <Loader2 className="w-6 h-6 text-black animate-spin" />
             </motion.div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black italic tracking-tighter text-primary"
          >
            WCZYTYWANIE...
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-muted/60"
          >
            Przygotowujemy Twój panel
          </motion.p>
        </div>
      </motion.div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 blur-[120px] -z-10 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-secondary/5 blur-[120px] -z-10 rounded-full translate-x-[50px] -translate-y-[30px]" />
    </div>
  );
}
