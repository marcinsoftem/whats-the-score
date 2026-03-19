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
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      console.error('Error deleting match:', err);
      alert(t.common.error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <Link href="/matches/active" className="btn-primary mt-4">{t.home.startMatch}</Link>
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
                className="relative"
              >
                {/* Delete Background */}
                <div className="absolute inset-0 bg-red-500 rounded-2xl flex items-center justify-end pr-8 text-white">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>

                <motion.div
                  drag="x"
                  dragConstraints={{ left: -100, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) {
                      handleDeleteMatch(match.id);
                    }
                  }}
                  className="relative z-10"
                >
                  <div className="card p-4 sm:p-5 bg-accent/20 border-white/5 hover:border-primary/20 transition-all group overflow-hidden">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                        <Calendar className="w-3 h-3 text-primary" />
                        {formatDate(match.timestamp)}
                      </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black text-primary uppercase tracking-tighter">
                              {t.matches.matchFinished}
                            </div>
                            {(() => {
                              const isP1 = match.players[0].id === currentUser?.id;
                              const userScore = isP1 ? match.score1 : match.score2;
                              const oppScore = isP1 ? match.score2 : match.score1;
                              if (userScore > oppScore) {
                                return <Trophy className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(198,255,0,0.5)]" />;
                              }
                              return null;
                            })()}
                          </div>
                        <Link 
                          href={`/matches/active?id=${match.id}`}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 active:scale-95"
                        >
                          <Pencil className="w-3 h-3" />
                          {t.common.edit}
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-5">
                      <div className="flex flex-col gap-3 min-w-0">
                        <PlayerCard 
                          player={match.players[0]} 
                          color="primary" 
                          className="bg-transparent border-none p-0" 
                          isMe={match.players[0].id === currentUser?.id}
                          meLabel={t.common.ja}
                        />
                        <div className="text-3xl font-black font-barlow-condensed text-primary text-center">
                          {match.score1}
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-sm font-black text-muted uppercase tracking-widest italic opacity-20">VS</span>
                      </div>

                      <div className="flex flex-col gap-3 text-right min-w-0">
                        <PlayerCard 
                          player={match.players[1]} 
                          color="secondary" 
                          className="bg-transparent border-none p-0" 
                          isMe={match.players[1].id === currentUser?.id}
                          meLabel={t.common.ja}
                          alignRight 
                        />
                        <div className="text-3xl font-black font-barlow-condensed text-secondary text-center">
                          {match.score2}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                      <p className="text-[8px] font-black uppercase tracking-[0.4em] text-muted italic">{t.matches.gamesLabel}</p>
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
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
