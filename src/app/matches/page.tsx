"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Calendar, Trophy, Users, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/player/PlayerCard";
import { createClient } from "@/lib/supabase/client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Preloader } from "@/components/ui/Preloader";

export default function MatchesPage() {
  return (
    <AuthGuard>
      <MatchesListContent />
    </AuthGuard>
  );
}

function MatchesListContent() {
  const { t, language } = useLanguage();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        // Fetch current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setCurrentUser({ id: user.id });

        const { data: dbMatches, error } = await supabase
          .from('matches')
          .select('*, player1:player1_id(*), player2:player2_id(*), match_games(*)')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        if (dbMatches) {
          const formattedMatches = dbMatches
            .map((m: any) => {
              const shouldSwap = m.player2_id === user.id;
              
              const games = (m.match_games || [])
                .sort((a: any, b: any) => a.game_index - b.game_index)
                .map((g: any) => ({ 
                  p1: shouldSwap ? g.p2_score : g.p1_score, 
                  p2: shouldSwap ? g.p1_score : g.p2_score 
                }));
              
              return {
                id: m.id,
                timestamp: m.timestamp,
                score1: shouldSwap ? m.score2 : m.score1,
                score2: shouldSwap ? m.score1 : m.score2,
                players: shouldSwap ? [
                  { id: m.player2?.id, nickname: m.player2?.nickname, avatarUrl: m.player2?.avatar_url, type: m.player2?.type },
                  { id: m.player1?.id, nickname: m.player1?.nickname, avatarUrl: m.player1?.avatar_url, type: m.player1?.type }
                ] : [
                  { id: m.player1?.id, nickname: m.player1?.nickname, avatarUrl: m.player1?.avatar_url, type: m.player1?.type },
                  { id: m.player2?.id, nickname: m.player2?.nickname, avatarUrl: m.player2?.avatar_url, type: m.player2?.type }
                ],
                games: games
              };
            })
            .filter((m: any) => m.players[0].nickname && m.players[1].nickname);
          setMatches(formattedMatches);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
      }
      setIsLoaded(true);
    }
    init();
  }, []);

  const handleDeleteMatch = async (matchId: string) => {
    try {
      console.log('History: Attempting to delete match with ID:', matchId);
      
      const { error: mError } = await supabase.from('matches').delete().eq('id', matchId);
      
      if (mError) {
        if (mError.code === '23503') { // Foreign key constraint violation
          const { error: gError } = await supabase.from('match_games').delete().eq('match_id', matchId);
          if (gError) throw gError;
          const { error: mError2 } = await supabase.from('matches').delete().eq('id', matchId);
          if (mError2) throw mError2;
        } else {
          throw mError;
        }
      }

      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err: any) {
      console.error('Full delete error object from history:', err);
      alert(`${t.common.error}: ${err.message || 'Błąd serwera'} (Kod: ${err.code || 'Brak'})`);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { 
      day: '2-digit', 
      month: 'short'
    });
  };

  if (!isLoaded) return <Preloader />;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Link 
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl flex-1 font-bold tracking-tight uppercase italic text-primary">{t.matches.title}</h1>
      </header>

      {matches.length === 0 ? (
        <div className="card flex flex-col gap-4 items-center justify-center py-20 text-center bg-accent/10 border-dashed border-white/10 opacity-50">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-muted mb-2 border border-white/5">
            <Trophy className="w-8 h-8 opacity-20" />
          </div>
          <p className="text-muted text-sm font-medium uppercase tracking-widest italic">{t.matches.noMatches}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <AnimatePresence initial={false}>
            {matches.map((match, idx) => (
                <motion.div 
                  key={match.id || idx}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="relative group block"
                >
                  <Link href={`/matches/active?id=${match.id}`} className="card p-3 px-4 bg-accent/20 border-white/5 hover:border-primary/20 transition-all active:scale-[0.98] flex items-center justify-between gap-3 relative z-10">
                    <div className="flex flex-col shrink-0 w-10">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                        {formatDate(match.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase truncate max-w-[50px] text-right">
                          {match.players[0].id === currentUser?.id ? t.common.ja : match.players[0].nickname}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] font-black text-primary overflow-hidden shrink-0">
                          {match.players[0].avatarUrl ? (
                            <img src={match.players[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (match.players[0].nickname?.[0] || '?').toUpperCase()
                          )}
                        </div>
                      </div>
                      
                      <div className="text-lg font-black font-barlow-condensed tracking-tighter flex items-center gap-1 shrink-0">
                        <span className="text-primary">{match.score1}</span>
                        <span className="opacity-20 text-xs">:</span>
                        <span className="text-secondary">{match.score2}</span>
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[9px] font-black text-secondary overflow-hidden shrink-0">
                          {match.players[1].avatarUrl ? (
                            <img src={match.players[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (match.players[1].nickname?.[0] || '?').toUpperCase()
                          )}
                        </div>
                        <span className="text-[10px] font-bold uppercase truncate max-w-[50px]">
                          {match.players[1].id === currentUser?.id ? t.common.ja : match.players[1].nickname}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const isP1 = match.players[0].id === currentUser?.id;
                      const userScore = isP1 ? match.score1 : match.score2;
                      const oppScore = isP1 ? match.score2 : match.score1;
                      if (userScore > oppScore) {
                        return <Trophy className="w-6 h-6 text-primary shrink-0 self-center drop-shadow-[0_0_8px_rgba(198,255,0,0.5)]" />;
                      }
                      return <div className="w-6 shrink-0" />; // Placeholder to maintain alignment
                    })()}
                  </Link>
                </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
