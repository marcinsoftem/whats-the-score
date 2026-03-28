"use client"

import { Plus, Trophy, Calendar, Users, User as UserIcon, Shield, Check, Settings, Pencil, Loader2, Trash2, Star, Crown } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlayerCard } from "@/components/player/PlayerCard";
import { createClient } from "@/lib/supabase/client";
import AuthGuard from "@/components/auth/AuthGuard";
import { Preloader } from "@/components/ui/Preloader";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<any[]>([]);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userPlayer = {
        id: user.id,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Ty',
        type: 'real',
        avatarUrl: user.user_metadata?.avatar_url
      };
      setCurrentUser(userPlayer);

      // 2. Load Profiles & Matches from Supabase
      try {
        setError(null);

        // Fetch favorites for this user
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('profile_id')
          .eq('user_id', user.id);

        const favIds = (favorites || []).map(f => f.profile_id);

        const { data: profiles, error: pError } = await supabase.from('profiles').select('*');

        // Filter by current user
        const { data: dbMatches, error: mError } = await supabase
          .from('matches')
          .select('*, player1:player1_id(*), player2:player2_id(*), match_games(*)')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .order('timestamp', { ascending: false })
          .limit(5);

        if (pError) throw pError;
        if (mError) throw mError;

        if (profiles) {
          const userNickLower = userPlayer.nickname.trim().toLowerCase();
          const opponents = profiles
            .filter(p => {
              const pNickLower = (p.nickname || '').trim().toLowerCase();
              if (p.id === userPlayer.id || pNickLower === userNickLower) return false;
              if (!favIds.includes(p.id)) return false;
              if (p.type === 'real') return true;
              if (p.type === 'virtual' && p.owner_id === userPlayer.id) return true;
              return false;
            })
            .map(p => ({
              id: p.id,
              nickname: p.nickname || 'Anonim',
              type: p.type || 'real',
              avatarUrl: p.avatar_url
            }));
          setAvailablePlayers(opponents);
        }

        if (dbMatches) {
          const formattedMatches = dbMatches
            .map(m => {
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
            .filter(m => m.players[0].nickname && m.players[1].nickname);
          setMatches(formattedMatches);
        }

        // Load active tournaments
        const { data: tourns } = await supabase
          .from('tournaments')
          .select('*, tournament_participants(profile_id, profiles:profile_id(id, nickname, avatar_url))')
          .eq('status', 'active')
          .or(`created_by.eq.${user.id}`)
          .order('created_at', { ascending: false });
        setActiveTournaments(tourns || []);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || t.home.dbError);
      }

      setIsLoaded(true);
    }
    init();
  }, []);

  const togglePlayer = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleNewMatch = () => {
    if (selectedIds.length !== 1) return;
    const opponentId = selectedIds[0];
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
    router.push("/matches/active");
  };

  const handleStartTournament = async () => {
    if (selectedIds.length < 2 || !currentUser) return;
    setIsCreatingTournament(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' });
      const tournamentName = `Turniej ${dateStr}`;

      // Create tournament
      const { data: tournament, error: tError } = await supabase
        .from('tournaments')
        .insert({ created_by: currentUser.id, name: tournamentName, status: 'active' })
        .select()
        .single();

      if (tError || !tournament) throw tError || new Error('Tournament creation failed');

      // All participants = selectedIds + organizer (current user)
      const allParticipantIds = [currentUser.id, ...selectedIds].filter((id, idx, arr) => arr.indexOf(id) === idx);

      // Insert participants
      await supabase.from('tournament_participants').insert(
        allParticipantIds.map(pid => ({ tournament_id: tournament.id, profile_id: pid }))
      );

      // Generate round-robin matches (each vs each)
      const matchInserts = [];
      for (let i = 0; i < allParticipantIds.length; i++) {
        for (let j = i + 1; j < allParticipantIds.length; j++) {
          matchInserts.push({
            id: crypto.randomUUID(),
            player1_id: allParticipantIds[i],
            player2_id: allParticipantIds[j],
            score1: 0,
            score2: 0,
            tournament_id: tournament.id,
            timestamp: new Date().toISOString(),
            created_by: currentUser.id
          });
        }
      }

      if (matchInserts.length > 0) {
        const { error: mError } = await supabase.from('matches').insert(matchInserts);
        if (mError) throw mError;
      }

      router.push(`/tournaments/${tournament.id}?from=home`);
    } catch (err: any) {
      console.error('Error creating tournament:', err);
      alert('Nie udało się utworzyć turnieju: ' + err.message);
    } finally {
      setIsCreatingTournament(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (err) {
      console.error('Error deleting match:', err);
      alert('Nie udało się usunąć meczu');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short'
    });
  };


  if (!isLoaded) return <Preloader />;

  const isTournamentMode = selectedIds.length >= 2;

  return (
    <div className="flex flex-col gap-8">
      <header className="text-left">
        <h1 className="text-4xl font-bold italic tracking-tighter text-primary">{t.home.title}</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-widest opacity-60 italic">{t.home.subtitle}</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col gap-1 items-center justify-center text-center">
          <span className="text-xs font-black uppercase text-red-500 italic">{t.home.dbError}</span>
          <p className="text-[12px] text-red-500/70">{error}</p>
        </div>
      )}

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted italic">{t.home.whoToday}</h2>
            <div className="flex items-center gap-2">
              {availablePlayers.length > 0 && (
                <span className="text-[11px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {t.home.playerCount.replace('{count}', availablePlayers.length.toString())}
                </span>
              )}
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-[11px] font-black uppercase text-muted hover:text-secondary transition-colors px-2 py-0.5"
                >
                  ✕ Wyczyść
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 px-4 no-scrollbar -mx-4 scroll-px-4">
            {availablePlayers.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex flex-col items-center gap-3 min-w-[70px] transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
                >
                  <div className={`w-14 h-14 rounded-full border-2 p-0.5 transition-all duration-300 relative ${isSelected
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
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300 shadow-lg">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-tighter truncate w-full text-center transition-colors ${isSelected ? 'text-secondary' : 'text-muted'}`}>
                    {player.nickname}
                  </span>
                </button>
              );
            })}

            <Link
              href="/players/new?from=home"
              className="flex flex-col items-center gap-3 min-w-[70px] shrink-0 opacity-40 hover:opacity-100 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 group hover:border-primary transition-colors">
                <Plus className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-tighter text-muted whitespace-nowrap">{t.players.addPlayer}</span>
            </Link>
          </div>
        </div>

        {/* Mode info banner */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-center gap-3"
            >
              {isTournamentMode ? (
                <span className="text-[13px] font-black uppercase tracking-widest text-primary italic">
                  Turniej ({selectedIds.length + 1} graczy)
                </span>
              ) : (
                <>
                  <span className="text-[14px] font-black uppercase tracking-widest text-primary italic">{t.common.ja}</span>
                  <span className="text-[12px] font-black text-muted opacity-30 italic">VS</span>
                  <span className="text-[14px] font-black uppercase tracking-widest text-secondary italic">
                    {availablePlayers.find(p => p.id === selectedIds[0])?.nickname}
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <div className="relative">
          {isTournamentMode ? (
            <button
              onClick={handleStartTournament}
              disabled={isCreatingTournament}
              className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] active:scale-[0.98] transition-all group disabled:opacity-50 disabled:grayscale disabled:shadow-none relative z-10"
            >
              {isCreatingTournament ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Trophy className="w-6 h-6" />
              )}
              {t.tournament.startTournament.toUpperCase()}
            </button>
          ) : (
            <button
              onClick={handleNewMatch}
              disabled={selectedIds.length !== 1}
              className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] active:scale-[0.98] transition-all group disabled:opacity-20 disabled:grayscale disabled:shadow-none relative z-10"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              {t.home.startMatch.toUpperCase()}
            </button>
          )}

          {selectedIds.length > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-2xl -z-0 rounded-full animate-pulse" />
          )}
        </div>
      </section>

      {/* Active Tournaments section */}
      {activeTournaments.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2">
              {t.tournament.activeTournaments}
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {activeTournaments.map(tourn => {
              const parts = (tourn.tournament_participants || []).map((p: any) => p.profiles).filter(Boolean);
              return (
                <Link
                  key={tourn.id}
                  href={`/tournaments/${tourn.id}?from=home`}
                  className="card p-3 px-4 bg-primary/5 border-primary/15 hover:border-primary/30 transition-all active:scale-[0.98] flex items-center gap-3"
                >
                  {/* Date */}
                  <div className="flex flex-col shrink-0 w-10">
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted">
                      {formatDate(tourn.created_at)}
                    </span>
                  </div>

                  {/* Stacked avatars */}
                  <div className="flex-1 flex justify-center">
                    <div className="flex -space-x-2">
                      {parts.slice(0, 6).map((p: any, idx: number) => (
                        <div
                          key={p.id}
                          className="w-9 h-9 rounded-full border-2 border-background bg-white/5 overflow-hidden flex items-center justify-center text-[10px] font-black"
                          style={{ zIndex: parts.length - idx }}
                        >
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                          ) : (
                            (p.nickname || "?")[0].toUpperCase()
                          )}
                        </div>
                      ))}
                      {parts.length > 6 && (
                        <div className="w-9 h-9 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                          +{parts.length - 6}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trophy */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(198,255,0,0.5)]" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <h2 className="text-lg font-black uppercase tracking-tighter italic">{t.home.recentMatches}</h2>
          <Link href="/matches" className="text-primary text-[11px] uppercase font-black tracking-widest hover:underline">{t.home.viewHistory}</Link>
        </div>

        {matches.length === 0 ? (
          <div className="card flex flex-col gap-4 items-center justify-center py-12 text-center bg-accent/10 border-dashed border-white/10 opacity-50">
            <Trophy className="w-10 h-10 text-muted opacity-20" />
            <p className="text-muted text-xs font-bold uppercase tracking-widest italic px-8 opacity-50">{t.matches.noMatches}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {matches.map((match, idx) => (
                <motion.div
                  key={match.id || idx}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  className="relative group"
                >
                  <Link href={`/matches/active?id=${match.id}&from=home`} className="card p-3 px-4 bg-accent/20 border-white/5 hover:border-primary/20 transition-all active:scale-[0.98] flex items-center justify-between gap-3 relative z-10">
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

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <div className="w-6 shrink-0" />
                      {match.tournament_id && (
                        <Trophy className="w-4 h-4 text-primary opacity-60" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

    </div>
  );
}
