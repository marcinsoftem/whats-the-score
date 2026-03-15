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
      <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
      
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={() => onChange(value + 1)}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center ${btnClass} shadow-lg active:scale-90 transition-transform`}
        >
          <ChevronUp className="w-10 h-10" />
        </button>
        
        <div className={`text-7xl font-bold font-barlow-condensed w-24 h-24 flex items-center justify-center rounded-3xl border-2 ${colorClass}`}>
          {value}
        </div>

        <button 
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-16 h-12 rounded-xl flex items-center justify-center bg-accent text-white active:scale-90 transition-transform"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
