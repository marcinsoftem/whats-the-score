"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Trophy, Pencil, Trash2, Crown, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Preloader } from "@/components/ui/Preloader";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function MatchesPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<Preloader />}>
        <MatchesListContent />
      </Suspense>
    </AuthGuard>
  );
}

function MatchesListContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'tournaments' ? 'tournaments' : 'matches';
  const [tab, setTab] = useState<'matches' | 'tournaments'>(initialTab);
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUser({ id: user.id });

        // Load regular matches (no tournament)
        const { data: dbMatches, error } = await supabase
          .from('matches')
          .select('*, player1:player1_id(*), player2:player2_id(*), match_games(*)')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
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
                games: games,
                tournament_id: m.tournament_id
              };
            })
            .filter((m: any) => m.players[0].nickname && m.players[1].nickname);
          setMatches(formattedMatches);
        }

        // Load tournaments (participated or organized)
        const { data: tourns } = await supabase
          .from('tournaments')
          .select('*, tournament_participants(profile_id, profiles:profile_id(id, nickname, avatar_url))')
          .or(`created_by.eq.${user.id}`)
          .order('created_at', { ascending: false });

        // Also fetch tournaments where user is participant but not creator
        const { data: participantTourns } = await supabase
          .from('tournament_participants')
          .select('tournament_id')
          .eq('profile_id', user.id);

        const participantTournIds = (participantTourns || []).map((p: any) => p.tournament_id);
        const allTournIds = [...new Set([...(tourns || []).map((t: any) => t.id), ...participantTournIds])];

        if (allTournIds.length > 0) {
          const { data: allTourns } = await supabase
            .from('tournaments')
            .select('*, tournament_participants(profile_id, profiles:profile_id(id, nickname, avatar_url))')
            .in('id', allTournIds)
            .order('created_at', { ascending: false });
          setTournaments(allTourns || []);
        } else {
          setTournaments(tourns || []);
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
      const { error: mError } = await supabase.from('matches').delete().eq('id', matchId);

      if (mError) {
        if (mError.code === '23503') {
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

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative">
        {(['matches', 'tournaments'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2.5 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 flex items-center justify-center gap-2 ${tab === tabKey ? 'text-background' : 'text-muted hover:text-foreground'
              }`}
          >
            {tabKey === 'tournaments' ? (
              <Trophy className="w-3.5 h-3.5" />
            ) : null}
            {tabKey === 'matches' ? t.common.matches : t.tournament.title + 'e'}
            {tab === tabKey && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-[0_0_15px_rgba(198,255,0,0.3)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'matches' ? (
          <motion.div
            key="matches"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            {matches.length === 0 ? (
              <div className="card flex flex-col gap-4 items-center justify-center py-20 text-center bg-accent/10 border-dashed border-white/10 opacity-50">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-muted mb-2 border border-white/5">
                  <Trophy className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-muted text-sm font-medium uppercase tracking-widest italic">{t.matches.noMatches}</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {matches.map((match, idx) => {
                  const isP1 = match.players[0].id === currentUser?.id;
                  const userScore = isP1 ? match.score1 : match.score2;
                  const oppScore = isP1 ? match.score2 : match.score1;
                  const won = userScore > oppScore;

                  return (
                    <motion.div
                      key={match.id || idx}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="relative group block"
                    >
                      <Link href={`/matches/active?id=${match.id}&from=matches`} className="card p-3 px-4 bg-accent/20 border-white/5 hover:border-primary/20 transition-all active:scale-[0.98] flex items-center justify-between gap-3 relative z-10">
                        <div className="flex flex-col shrink-0 w-10">
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted">
                            {formatDate(match.timestamp)}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-bold uppercase truncate max-w-[50px] text-right">
                              {match.players[0].id === currentUser?.id ? t.common.ja : match.players[0].nickname}
                            </span>
                            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[11px] font-black text-primary overflow-hidden shrink-0">
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
                            <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[11px] font-black text-secondary overflow-hidden shrink-0">
                              {match.players[1].avatarUrl ? (
                                <img src={match.players[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (match.players[1].nickname?.[0] || '?').toUpperCase()
                              )}
                            </div>
                            <span className="text-[11px] font-bold uppercase truncate max-w-[50px]">
                              {match.players[1].id === currentUser?.id ? t.common.ja : match.players[1].nickname}
                            </span>
                          </div>
                        </div>

                        {/* Result icons: Trophy if tournament, Thumb if win */}
                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                          <div className="w-5" />
                          {match.tournament_id && (
                            <Trophy className="w-4 h-4 text-primary opacity-60" />
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="tournaments"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {tournaments.length === 0 ? (
              <div className="card flex flex-col gap-4 items-center justify-center py-20 text-center bg-accent/10 border-dashed border-white/10 opacity-50">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-muted mb-2 border border-white/5">
                  <Trophy className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-muted text-sm font-medium uppercase tracking-widest italic">{t.tournament.noTournaments}</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {tournaments.map((tourn, idx) => {
                  const parts = (tourn.tournament_participants || []).map((p: any) => p.profiles).filter(Boolean);
                  const isFinished = tourn.status === 'finished';
                  return (
                    <motion.div
                      key={tourn.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 100 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Link
                        href={`/tournaments/${tourn.id}?from=matches`}
                        className={`card p-4 flex items-center gap-4 transition-all active:scale-[0.98] ${isFinished ? 'bg-white/3 border-white/5 opacity-70' : 'bg-primary/5 border-primary/15 hover:border-primary/30'}`}
                      >
                        {/* Stacked avatars */}
                        <div className="flex -space-x-2 shrink-0">
                          {parts.slice(0, 4).map((p: any, i: number) => (
                            <div
                              key={p.id}
                              className="w-11 h-11 rounded-full border-2 border-background bg-white/5 overflow-hidden flex items-center justify-center text-[11px] font-black"
                              style={{ zIndex: parts.length - i }}
                            >
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                              ) : (
                                (p.nickname || '?')[0].toUpperCase()
                              )}
                            </div>
                          ))}
                          {parts.length > 4 && (
                            <div className="w-11 h-11 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[11px] font-black text-primary">
                              +{parts.length - 4}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`font-black uppercase tracking-tight text-sm truncate ${isFinished ? 'text-muted' : 'text-primary'}`}>{tourn.name}</p>
                          <p className="text-[11px] text-muted font-bold uppercase tracking-widest mt-0.5">
                            {t.tournament.participants.replace('{count}', parts.length.toString())}
                          </p>
                        </div>

                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${isFinished
                            ? 'text-muted border-white/10 bg-white/5'
                            : 'text-primary border-primary/30 bg-primary/10'
                          }`}>
                          {isFinished ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Trophy className="w-4 h-4 drop-shadow-[0_0_8px_rgba(198,255,0,0.5)]" />
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
