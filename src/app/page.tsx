"use client"

import { Plus, Trophy, Calendar, Users, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PlayerCard } from "@/components/player/PlayerCard";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [opponentId, setOpponentId] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userPlayer = user ? {
        id: user.id,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Ty',
        type: 'real',
        avatarUrl: user.user_metadata?.avatar_url
      } : { id: 'anon', nickname: 'Ty', type: 'real' };
      setCurrentUser(userPlayer);

      // 2. Load Players
      const savedPlayers = localStorage.getItem('wts_players');
      let playersList = [];
      if (savedPlayers) {
        playersList = JSON.parse(savedPlayers);
      } else {
        playersList = [
          { id: 'p1', nickname: 'Marcin', type: 'virtual' },
          { id: 'p2', nickname: 'Miki', type: 'virtual' },
          { id: 'p3', nickname: 'Piotr', type: 'virtual' }
        ];
        localStorage.setItem('wts_players', JSON.stringify(playersList));
      }
      
      // Filter out current user from opponents (by ID or nickname)
      const opponents = playersList.filter((p: any) => 
        p.id !== userPlayer.id && 
        p.nickname.toLowerCase() !== userPlayer.nickname.toLowerCase()
      );
      setAvailablePlayers(opponents);
      if (opponents.length > 0) {
        setOpponentId(opponents[0].id);
      }

      // 3. Load Match History
      const history = localStorage.getItem('wts_match_history');
      if (history) {
        try {
          const parsed = JSON.parse(history);
          const sorted = parsed.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setMatches(sorted.slice(0, 3));
        } catch (e) {}
      }
      setIsLoaded(true);
    }
    init();
  }, []);

  const handleNewMatch = () => {
    const opponent = availablePlayers.find(p => p.id === opponentId);
    if (!currentUser || !opponent) return;

    localStorage.removeItem('wts_active_match');
    const newState = {
      score1: 0,
      score2: 0,
      games: [],
      matchId: crypto.randomUUID(),
      matchDate: new Date().toISOString().split('T')[0],
      player1: currentUser,
      player2: opponent
    };
    localStorage.setItem('wts_active_match', JSON.stringify(newState));
    window.location.href = "/matches/active";
  };

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

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted italic">Z kim dzisiaj grasz?</h2>
            {availablePlayers.length > 0 && (
              <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {availablePlayers.length} graczy
              </span>
            )}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar -mx-4 scroll-px-4">
            {availablePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setOpponentId(player.id)}
                className={`flex flex-col items-center gap-3 min-w-[70px] transition-all duration-300 ${
                  opponentId === player.id ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                }`}
              >
                <div className={`w-14 h-14 rounded-full border-2 p-0.5 transition-all duration-300 relative ${
                  opponentId === player.id 
                    ? 'border-secondary shadow-[0_0_15px_rgba(255,87,34,0.3)] bg-secondary/10' 
                    : 'border-white/10 bg-white/5'
                }`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black">{player.nickname[0].toUpperCase()}</span>
                    )}
                  </div>
                  {opponentId === player.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                      <Plus className="w-3 h-3 text-white rotate-45" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tighter truncate w-full text-center transition-colors ${
                  opponentId === player.id ? 'text-secondary' : 'text-muted'
                }`}>
                  {player.nickname}
                </span>
              </button>
            ))}
            
            <Link 
              href="/players/new"
              className="flex flex-col items-center gap-3 min-w-[70px] opacity-40 hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 group hover:border-primary transition-colors">
                <Plus className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted">Dodaj</span>
            </Link>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={handleNewMatch}
            disabled={!opponentId}
            className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] active:scale-[0.98] transition-all group disabled:opacity-20 disabled:grayscale disabled:shadow-none relative z-10"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            NOWY MECZ
          </button>
          
          {opponentId && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-2xl -z-0 rounded-full animate-pulse" />
          )}
        </div>

        {currentUser && opponentId && (
          <div className="flex items-center justify-center gap-2 mt-[-8px] animate-in slide-in-from-top-2 duration-500">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">{currentUser.nickname}</span>
            <span className="text-[8px] font-black text-muted opacity-30 italic">VS</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-secondary italic">
              {availablePlayers.find(p => p.id === opponentId)?.nickname}
            </span>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-lg font-black uppercase tracking-tighter italic">Ostatnie Mecze</h2>
          <Link href="/matches" className="text-primary text-[10px] uppercase font-black tracking-widest hover:underline">Zobacz wszystkie</Link>
        </div>
        
        {matches.length === 0 ? (
          <div className="card flex flex-col gap-4 items-center justify-center py-12 text-center bg-accent/10 border-dashed border-white/10 opacity-50">
            <Trophy className="w-10 h-10 text-muted opacity-20" />
            <p className="text-muted text-xs font-bold uppercase tracking-widest italic px-8 opacity-50">Nie masz jeszcze żadnych zapisanych meczy.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {matches.map((match, idx) => (
              <Link href={`/matches/active?id=${match.id}`} key={match.id || idx} className="card p-4 bg-accent/20 border-white/5 hover:border-primary/20 transition-all active:scale-[0.98]">
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
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 border-t border-white/5 pt-8">
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
