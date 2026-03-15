"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Calendar, Trophy, Users, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/player/PlayerCard";

export default function MatchesPage() {
  return (
    <AuthGuard>
      <MatchesListContent />
    </AuthGuard>
  );
}

function MatchesListContent() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem('wts_match_history');
    if (history) {
      try {
        const parsedHistory = JSON.parse(history);
        // Sort by timestamp descending
        const sortedHistory = parsedHistory.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setMatches(sortedHistory);
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
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Link 
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl flex-1 font-bold tracking-tight uppercase">HISTORIA MECZÓW</h1>
      </header>

      {matches.length === 0 ? (
        <div className="card flex flex-col gap-4 items-center justify-center py-20 text-center bg-accent/10 border-dashed">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-muted mb-2">
            <Trophy className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-muted text-sm font-medium uppercase tracking-widest italic">Nie znaleziono rozegranych meczów</p>
          <Link href="/matches/active" className="btn-primary mt-4">Rozpocznij pierwszy mecz</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {matches.map((match, idx) => (
            <div key={match.id || idx} className="card p-4 sm:p-5 bg-accent/20 border-white/5 hover:border-primary/20 transition-all group overflow-hidden">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                  <Calendar className="w-3 h-3 text-primary" />
                  {formatDate(match.timestamp)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black text-primary uppercase tracking-tighter">
                    Mecz Zakończony
                  </div>
                  <Link 
                    href={`/matches/active?id=${match.id}`}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 active:scale-95"
                  >
                    <Pencil className="w-3 h-3" />
                    Edytuj
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-5">
                <div className="flex flex-col gap-3 min-w-0">
                  <PlayerCard player={match.players[0]} color="primary" className="bg-transparent border-none p-0" />
                  <div className="text-3xl font-black font-barlow-condensed text-primary text-center">
                    {match.totalGemy1}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center px-2">
                  <span className="text-sm font-black text-muted uppercase tracking-widest italic opacity-20">VS</span>
                </div>

                <div className="flex flex-col gap-3 text-right min-w-0">
                  <PlayerCard player={match.players[1]} color="secondary" className="bg-transparent border-none p-0" alignRight />
                  <div className="text-3xl font-black font-barlow-condensed text-secondary text-center">
                    {match.totalGemy2}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted italic">GEMY:</p>
                <div className="flex flex-wrap gap-2">
                  {match.games.map((game: any, i: number) => (
                    <div key={i} className="px-3 py-2 bg-white/5 rounded-xl border border-white/5 text-xs font-bold font-barlow-condensed">
                      <span className={game.p1 > game.p2 ? "text-primary" : ""}>{game.p1}</span>
                      <span className="mx-1 opacity-30">:</span>
                      <span className={game.p2 > game.p1 ? "text-secondary" : ""}>{game.p2}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
