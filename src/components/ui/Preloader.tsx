"use client"
 
import { motion, Variants } from "framer-motion";
 
export function Preloader() {
  const barVariants: Variants = {
    animate: (i: number) => ({
      scaleY: [0.5, 1.5, 0.5],
      transition: {
        duration: 1,
        repeat: Infinity as any,
        ease: "easeInOut" as any,
        delay: i * 0.15
      }
    })
  };
 
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-1.5 h-12">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={barVariants}
            animate="animate"
            className="w-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            style={{ height: '24px', originY: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}
