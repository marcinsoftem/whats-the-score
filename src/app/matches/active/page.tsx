"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { useState, useEffect } from "react";
import { ScoreCounter } from "@/components/match/ScoreCounter";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Player } from "@/types";
import { ChevronLeft, Save, Trash2, Pencil } from "lucide-react";
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
  const [games, setGames] = useState<{ p1: number, p2: number }[]>([]);

  const p1Games = games.filter(g => g.p1 > g.p2).length;
  const p2Games = games.filter(g => g.p2 > g.p1).length;

  // Strict Squash validation (PAR-11):
  // 1. A game is won by the first player to reach 11 points (if lead is at least 2).
  // 2. If score reaches 10-10, game continues until lead is exactly 2.
  const isValidScore = (
    (score1 === 11 && score2 <= 9) || 
    (score2 === 11 && score1 <= 9) || 
    (score1 > 11 && score1 - score2 === 2) || 
    (score2 > 11 && score2 - score1 === 2)
  );

  const handleFinishGame = () => {
    if (!isValidScore) return;
    
    setGames([...games, { p1: score1, p2: score2 }]);
    setScore1(0);
    setScore2(0);
  };

  const handleDeleteGame = (index: number) => {
    const newGames = [...games];
    newGames.splice(index, 1);
    setGames(newGames);
  };

  const handleEditGame = (index: number) => {
    const game = games[index];
    setScore1(game.p1);
    setScore2(game.p2);
    handleDeleteGame(index);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex items-center gap-4">
        <button 
          onClick={handleGoBack}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl flex-1 font-bold tracking-tight uppercase">Mecz w toku</h1>
        <button className="w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_15px_rgba(198,255,0,0.3)]">
          <Save className="w-5 h-5" />
        </button>
      </header>

      <div className="flex justify-between items-center bg-accent/30 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-bold font-barlow-condensed leading-none text-primary">{p1Games}</span>
          <span className="text-[10px] uppercase font-black text-muted tracking-tighter">Gemy</span>
        </div>
        <div className="text-[10px] uppercase font-black text-primary tracking-[0.2em] px-5 py-2 bg-primary/10 rounded-full border border-primary/20">
          Wynik Meczu
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-bold font-barlow-condensed leading-none text-secondary">{p2Games}</span>
          <span className="text-[10px] uppercase font-black text-muted tracking-tighter">Gemy</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8 items-start py-4 relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3/4 bg-white/5 hidden sm:block" />
        
        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setScore1(11); setScore2(7); }}
            className="text-left active:scale-95 transition-transform"
          >
            <PlayerCard player={initialPlayers[0]} className="bg-transparent border-none p-0" />
          </button>
          <ScoreCounter label="Twój Wynik" value={score1} onChange={setScore1} color="primary" />
        </div>

        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setScore1(7); setScore2(11); }}
            className="text-right active:scale-95 transition-transform"
          >
            <PlayerCard player={initialPlayers[1]} className="bg-transparent border-none p-0" alignRight />
          </button>
          <ScoreCounter label="Przeciwnik" value={score2} onChange={setScore2} color="secondary" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Poprzednie Gemy</h2>
          <span className="text-[10px] text-primary font-bold">{games.length} Zapisano</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {games.length === 0 ? (
            <div className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-muted/30 text-xs uppercase font-bold tracking-widest italic">
              Brak rozegranych gemów
            </div>
          ) : (
            games.map((game, i) => (
              <div key={i} className="card min-w-[140px] flex flex-col items-center gap-1 py-4 px-4 bg-white/5 border border-white/5 hover:border-primary/30 transition-colors relative group">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditGame(i)}
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                    title="Edytuj"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGame(i)}
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-secondary hover:text-white transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[9px] uppercase text-muted font-black tracking-widest">Gem {i+1}</span>
                <span className="text-2xl font-bold font-barlow-condensed tracking-wider text-foreground">
                  <span className={game.p1 > game.p2 ? "text-primary" : ""}>{game.p1}</span>
                  <span className="mx-1 text-muted">:</span>
                  <span className={game.p2 > game.p1 ? "text-secondary" : ""}>{game.p2}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
      
      <div className="fixed bottom-[62px] left-0 right-0 p-4 bg-[#121212] z-[90] max-w-md mx-auto shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <button 
          onClick={handleFinishGame}
          disabled={!isValidScore}
          className="btn-primary w-full py-5 text-xl tracking-tighter shadow-[0_0_30px_rgba(198,255,0,0.1)] disabled:opacity-20 disabled:grayscale disabled:shadow-none transition-all italic font-black"
        >
          Zapisz
        </button>
      </div>
    </div>
  );
}
