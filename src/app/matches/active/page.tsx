"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { useState, useEffect } from "react";
import { ScoreCounter } from "@/components/match/ScoreCounter";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Player } from "@/types";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

// Mock data for demo
const initialPlayers: Player[] = [
  { id: '1', nickname: 'Miki', type: 'real' },
  { id: '2', nickname: 'Marcin', type: 'virtual' }
];

export default function MatchPage() {
  return (
    <AuthGuard>
      <MatchPageContent />
    </AuthGuard>
  );
}

function MatchPageContent() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [games, setGames] = useState<{ p1: number, p2: number }[]>([
    { p1: 11, p2: 8 },
    { p1: 11, p2: 9 }
  ]);

  const p1Games = games.filter(g => g.p1 > g.p2).length;
  const p2Games = games.filter(g => g.p2 > g.p1).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Link href="/" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl flex-1">Mecz w toku</h1>
        <button className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center active:scale-90 transition-transform">
          <Save className="w-5 h-5" />
        </button>
      </header>

      <div className="flex justify-between items-center bg-accent/50 p-4 rounded-3xl border border-border/50">
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-bold font-barlow-condensed leading-none">{p1Games}</span>
          <span className="text-[10px] uppercase font-bold text-muted">Gamy</span>
        </div>
        <div className="text-xs uppercase font-bold text-muted tracking-widest px-4 py-1 bg-background rounded-full border border-border/50">
          Wynik Meczu
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-bold font-barlow-condensed leading-none">{p2Games}</span>
          <span className="text-[10px] uppercase font-bold text-muted">Gamy</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start py-4 relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3/4 bg-border/50 hidden sm:block" />
        
        <div className="flex flex-col gap-6">
          <PlayerCard player={initialPlayers[0]} className="p-2 gap-2 scale-90" />
          <ScoreCounter label="Zawodnik 1" value={score1} onChange={setScore1} color="primary" />
        </div>

        <div className="flex flex-col gap-6 text-right">
          <PlayerCard player={initialPlayers[1]} className="p-2 gap-2 scale-90 flex-row-reverse" />
          <ScoreCounter label="Zawodnik 2" value={score2} onChange={setScore2} color="secondary" />
        </div>
      </div>

      <section className="flex flex-col gap-4 mb-4">
        <h2 className="text-lg">Poprzednie Gamy</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {games.map((game, i) => (
            <div key={i} className="card min-w-[100px] flex flex-col items-center gap-1 py-3 px-4 bg-accent/20">
              <span className="text-[10px] uppercase text-muted font-bold">Gama {i+1}</span>
              <span className="text-xl font-bold font-barlow-condensed tracking-wider">
                {game.p1} : {game.p2}
              </span>
            </div>
          ))}
          <div className="card min-w-[100px] flex flex-col items-center justify-center gap-1 py-3 px-4 border-dashed border-primary/30 text-primary">
             <span className="text-[10px] uppercase font-bold">Następna</span>
          </div>
        </div>
      </section>
      
      <button className="btn-primary w-full py-5 text-xl tracking-tighter shadow-[0_0_30px_rgba(198,255,0,0.2)]">
        Zakończ Gamę
      </button>
    </div>
  );
}
