"use client"

import { Plus, Trophy, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PlayerCard } from "@/components/player/PlayerCard";

export default function Home() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem('wts_match_history');
    if (history) {
      try {
        setMatches(JSON.parse(history).slice(0, 3)); // Only show last 3 on home
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: 'short'
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl tracking-tighter font-black italic uppercase text-primary">What&apos;s The Score?</h1>
        <p className="text-muted text-sm font-medium uppercase tracking-widest opacity-70">Przejmij kontrolę nad swoją grą.</p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-lg font-black uppercase tracking-tighter italic">Ostatnie Mecze</h2>
          <Link href="/matches" className="text-primary text-[10px] uppercase font-black tracking-widest hover:underline">Zobacz wszystkie</Link>
        </div>
        
        {matches.length === 0 ? (
          <div className="card flex flex-col gap-4 items-center justify-center py-12 text-center bg-accent/10 border-dashed border-white/10 group hover:border-primary/30 transition-all">
            <Trophy className="w-10 h-10 text-muted opacity-20 group-hover:scale-110 group-hover:text-primary group-hover:opacity-40 transition-all" />
            <p className="text-muted text-xs font-bold uppercase tracking-widest italic px-8 opacity-50">Nie masz jeszcze żadnych zapisanych meczy.</p>
            <Link href="/matches/active" className="btn-primary mt-2">
              <Plus className="w-5 h-5" />
              Nowy Mecz
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match, idx) => (
              <Link href="/matches" key={match.id || idx} className="card p-4 bg-accent/20 border-white/5 hover:border-primary/20 transition-all active:scale-[0.98]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    {formatDate(match.timestamp)}
                  </span>
                  <div className="text-lg font-black font-barlow-condensed tracking-tighter">
                    <span className="text-primary">{match.totalGemy1}</span>
                    <span className="mx-2 opacity-20">:</span>
                    <span className="text-secondary">{match.totalGemy2}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary shrink-0">
                      {match.players[0].nickname[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold uppercase truncate">{match.players[0].nickname}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end overflow-hidden">
                    <span className="text-xs font-bold uppercase truncate">{match.players[1].nickname}</span>
                    <div className="w-6 h-6 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[10px] font-black text-secondary shrink-0">
                      {match.players[1].nickname[0].toUpperCase()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/matches/active" className="btn-primary w-full py-4 mt-2 shadow-[0_10px_20px_rgba(198,255,0,0.1)]">
              <Plus className="w-5 h-5" />
              Kontynuuj lub Nowy Mecz
            </Link>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-black uppercase tracking-tighter italic px-1">Szybki Wybór</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/players/new" className="card flex flex-col gap-3 items-start active:scale-95 transition-transform bg-white/5 border-white/5 relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 w-12 h-12 bg-secondary/10 rounded-full blur-xl group-hover:bg-secondary/20 transition-all" />
            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary border border-secondary/30">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-black text-[10px] uppercase tracking-widest">Dodaj Zawodnika</p>
          </Link>
          <Link href="/players?filter=virtual" className="card flex flex-col gap-3 items-start active:scale-95 transition-transform bg-white/5 border-white/5 relative overflow-hidden group">
            <div className="absolute -right-2 -top-2 w-12 h-12 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary border border-primary/30">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-black text-[10px] uppercase tracking-widest">Wirtualni Gracze</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
