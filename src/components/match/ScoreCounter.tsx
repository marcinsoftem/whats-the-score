"use client"

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CounterProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  color?: 'primary' | 'secondary';
}

export function ScoreCounter({ label, value, onChange, color = 'primary' }: CounterProps) {
  const colorClass = color === 'primary' ? 'text-primary border-primary bg-primary/5' : 'text-secondary border-secondary bg-secondary/5';
  const btnClass = color === 'primary' ? 'bg-primary text-black' : 'bg-secondary text-white';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">{label}</span>
      
      <div className="flex flex-col items-center gap-3">
        <button 
          onClick={() => onChange(value + 1)}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center ${btnClass} shadow-lg active:scale-95 transition-all hover:scale-105`}
        >
          <ChevronUp className="w-8 h-8 sm:w-10 sm:h-10" />
        </button>
        
        <div className={`text-6xl sm:text-7xl font-bold font-barlow-condensed w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-3xl border-2 ${colorClass} shadow-inner`}>
          {value}
        </div>

        <button 
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-12 h-10 sm:w-16 sm:h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-muted hover:text-white active:scale-95 transition-all"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
