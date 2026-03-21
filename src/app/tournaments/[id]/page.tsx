"use client"

import { useState, useEffect } from "react";
import { ChevronLeft, Trophy, Loader2, CheckCircle2, Crown, Lock, LockOpen, Shield, Play, Glasses, Star, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthGuard from "@/components/auth/AuthGuard";
import { Preloader } from "@/components/ui/Preloader";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";

export default function TournamentPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<Preloader />}>
        <TournamentContent />
      </Suspense>
    </AuthGuard>
  );
}

function TournamentContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tournamentId = params.id as string;
  const from = searchParams.get('from');

  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [medals, setMedals] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      try {
        // Load tournament
        const { data: tourn } = await supabase
          .from("tournaments")
          .select("*")
          .eq("id", tournamentId)
          .single();
        if (!tourn) { router.push("/"); return; }
        setTournament(tourn);

        // Load participants
        const { data: parts } = await supabase
          .from("tournament_participants")
          .select("profile_id, profiles:profile_id(*)")
          .eq("tournament_id", tournamentId);
        setParticipants((parts || []).map((p: any) => p.profiles));

        // Load matches
        const { data: ms } = await supabase
          .from("matches")
          .select("*, player1:player1_id(*), player2:player2_id(*), match_games(*)")
          .eq("tournament_id", tournamentId)
          .order("created_at", { ascending: true });
        setMatches(ms || []);

        // Load medals (if finished)
        if (tourn.status === "finished") {
          const { data: meds } = await supabase
            .from("tournament_medals")
            .select("*, profile:profile_id(*)")
            .eq("tournament_id", tournamentId);
          setMedals(meds || []);
        }
      } catch (err) {
        console.error("Error loading tournament:", err);
      }

      setIsLoaded(true);
    }
    init();
  }, [tournamentId]);

  const computeLeaderboard = () => {
    const scores: Record<string, { profile: any; wins: number; draws: number; losses: number; played: number; totalMatches: number; smallScored: number; smallConceded: number }> = {};
    participants.forEach((p) => {
      const playerTotalMatches = matches.filter(m => m.player1_id === p.id || m.player2_id === p.id).length;
      scores[p.id] = { profile: p, wins: 0, draws: 0, losses: 0, played: 0, totalMatches: playerTotalMatches, smallScored: 0, smallConceded: 0 };
    });

    matches.forEach((m) => {
      const hasResult = m.match_games && m.match_games.length > 0;
      if (!hasResult) return;
      const p1id = m.player1_id;
      const p2id = m.player2_id;
      if (!scores[p1id] || !scores[p2id]) return;
      
      scores[p1id].played++;
      scores[p2id].played++;

      if (m.score1 > m.score2) {
        scores[p1id].wins++;
        scores[p2id].losses++;
      } else if (m.score2 > m.score1) {
        scores[p2id].wins++;
        scores[p1id].losses++;
      } else {
        // Draw
        scores[p1id].draws++;
        scores[p2id].draws++;
      }

      // Small points
      m.match_games.forEach((g: any) => {
        scores[p1id].smallScored += g.p1_score || 0;
        scores[p1id].smallConceded += g.p2_score || 0;
        scores[p2id].smallScored += g.p2_score || 0;
        scores[p2id].smallConceded += g.p1_score || 0;
      });
    });

    return Object.values(scores).sort((a, b) => 
      b.wins - a.wins || 
      b.draws - a.draws || 
      a.losses - b.losses ||
      (b.smallScored - b.smallConceded) - (a.smallScored - a.smallConceded) ||
      b.smallScored - a.smallScored
    );
  };

  const MatchItem = ({ match, idx }: { match: any; idx: number }) => {
    const hasGames = match.match_games && match.match_games.length > 0;
    const canEdit = isOrganizer && !isFinished && !hasGames;
    const canView = hasGames;

    const matchEl = (
      <motion.div
        className={`card p-3 px-4 bg-accent/20 flex items-center justify-between gap-3 transition-all ${
          canEdit ? "border-primary/20 hover:border-primary/40" : "border-white/5"
        }`}
      >
        <div className="flex flex-col shrink-0 w-10">
          {hasGames ? (
            <span className="text-[11px] font-black uppercase tracking-widest text-muted">{formatDate(match.timestamp)}</span>
          ) : (
            <span className="text-[11px] font-black uppercase text-primary/40">–</span>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-bold uppercase truncate max-w-[50px] text-right">
              {match.player1_id === currentUser?.id ? "Ja" : match.player1?.nickname}
            </span>
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-black text-primary overflow-hidden shrink-0">
              {match.player1?.avatar_url ? (
                <img src={match.player1.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (match.player1?.nickname?.[0] || "?").toUpperCase()
              )}
            </div>
          </div>

          <div className="text-lg font-black font-barlow-condensed tracking-tighter flex items-center gap-1 shrink-0">
            {hasGames ? (
              <>
                <span className="text-primary">{match.score1}</span>
                <span className="opacity-20 text-xs">:</span>
                <span className="text-secondary">{match.score2}</span>
              </>
            ) : (
              <span className="text-[12px] font-black uppercase text-muted tracking-widest">vs</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center text-[10px] font-black text-secondary overflow-hidden shrink-0">
              {match.player2?.avatar_url ? (
                <img src={match.player2.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (match.player2?.nickname?.[0] || "?").toUpperCase()
              )}
            </div>
            <span className="text-[11px] font-bold uppercase truncate max-w-[50px]">
              {match.player2_id === currentUser?.id ? "Ja" : match.player2?.nickname}
            </span>
          </div>
        </div>

        {canEdit ? (
          <span className="text-[10px] font-black uppercase text-primary border border-primary/30 bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">GRAJ</span>
        ) : !hasGames && !isOrganizer ? (
          <span className="text-[10px] font-black uppercase text-muted border border-white/10 bg-white/5 px-1.5 py-0.5 rounded-full shrink-0">–</span>
        ) : (
          <div className="w-5 shrink-0" />
        )}
      </motion.div>
    );

    if (isOrganizer && !isFinished && (canEdit || canView)) {
      return (
        <Link href={`/matches/active?id=${match.id}&from=tournament&tournamentId=${tournamentId}`}>
          {matchEl}
        </Link>
      );
    }
    if (!isOrganizer && canView) {
      return (
        <Link href={`/matches/active?id=${match.id}&from=tournament&tournamentId=${tournamentId}`}>
          {matchEl}
        </Link>
      );
    }
    return matchEl;
  };

  const handleDeleteTournament = async () => {
    if (!tournamentId || !isOrganizer) return;
    setIsDeleting(true);

    try {
      // 1. Get all match IDs for this tournament
      const matchIds = matches.map(m => m.id);

      // 2. Delete games for all those matches first
      if (matchIds.length > 0) {
        await supabase
          .from('match_games')
          .delete()
          .in('match_id', matchIds);
        
        // 3. Delete the matches
        await supabase
          .from('matches')
          .delete()
          .eq('tournament_id', tournamentId);
      }

      // 4. Delete participants
      await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId);

      // 5. Delete the tournament itself
      const { error: tError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (tError) throw tError;

      router.push('/');
    } catch (err: any) {
      console.error('Error deleting tournament:', err);
      // alert('Błąd usuwania turnieju: ' + err.message);
      setIsDeleting(false);
    }
  };

  const handleEndTournament = async () => {
    if (!isConfirmingEnd) {
      setIsConfirmingEnd(true);
      setTimeout(() => setIsConfirmingEnd(false), 4000);
      return;
    }

    setIsEnding(true);
    try {
      const board = computeLeaderboard();
      const medalTypes = ["gold", "silver", "bronze"] as const;
      const medalInserts = board.slice(0, 3).map((entry, i) => ({
        tournament_id: tournamentId,
        profile_id: entry.profile.id,
        medal: medalTypes[i],
      }));

      // Delete old medals if any (to allow re-ending)
      await supabase.from("tournament_medals").delete().eq("tournament_id", tournamentId);

      if (medalInserts.length > 0) {
        await supabase.from("tournament_medals").insert(medalInserts);
      }

      await supabase.from("tournaments").update({ status: "finished" }).eq("id", tournamentId);

      // Reload
      const { data: meds } = await supabase
        .from("tournament_medals")
        .select("*, profile:profile_id(*)")
        .eq("tournament_id", tournamentId);
      setMedals(meds || []);
      setTournament((prev: any) => ({ ...prev, status: "finished" }));
    } catch (err) {
      console.error("Error ending tournament:", err);
    } finally {
      setIsEnding(false);
      setIsConfirmingEnd(false);
    }
  };

  const handleToggleLock = async () => {
    if (!isOrganizer) return;
    const newStatus = isFinished ? "active" : "finished";
    
    try {
      if (newStatus === "active") {
        await supabase.from("tournaments").update({ status: "active" }).eq("id", tournamentId);
        setTournament((prev: any) => ({ ...prev, status: "active" }));
      } else {
        await handleEndTournament();
      }
    } catch (err) {
      console.error("Error toggling tournament lock:", err);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
  };

  const medalColor = (idx: number) => {
    if (idx === 0) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
    if (idx === 1) return "text-zinc-300 border-zinc-300/30 bg-zinc-300/10";
    return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  };

  const isOrganizer = tournament && currentUser && tournament.created_by === currentUser.id;
  const isFinished = tournament?.status === "finished";
  const leaderboard = computeLeaderboard();
  const allMatchesPlayed = matches.length > 0 && matches.every(m => m.match_games && m.match_games.length > 0);

  if (!isLoaded) return <Preloader />;

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4">
        <button
          onClick={() => router.push(from === 'matches' ? '/matches?tab=tournaments' : '/')}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black tracking-tight uppercase italic text-primary truncate">
            {tournament?.name || t.tournament.title}
          </h1>
        </div>
        <div className="flex-none flex items-center gap-2">
          {isOrganizer && !isFinished && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isEnding || isDeleting}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-red-500 hover:bg-red-500/10 hover:border-red-500/30 shrink-0"
              title="Usuń turniej"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          {isOrganizer ? (
            <button
              onClick={handleToggleLock}
              disabled={isEnding || isDeleting}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform text-foreground shrink-0"
              title={isFinished ? "Odblokuj turniej" : "Zablokuj turniej"}
            >
              {isEnding ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : isFinished ? (
                <Lock className="w-5 h-5 text-secondary" />
              ) : (
                <LockOpen className="w-5 h-5 text-primary" />
              )}
            </button>
          ) : (
            <div className={`w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-40 shrink-0`}>
              {isFinished ? (
                <Lock className="w-5 h-5" />
              ) : (
                <LockOpen className="w-5 h-5" />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Participants avatars */}
      <section className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {participants.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-1.5 min-w-[52px]">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0 ${
                tournament?.created_by === p.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
              }`}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black">{(p.nickname || "?")[0].toUpperCase()}</span>
                )}
              </div>
              {tournament?.created_by === p.id && (
                <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5 z-10 scale-110">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.6)] border border-background">
                    <Star className="w-3.5 h-3.5 text-black fill-black" />
                  </div>
                </div>
              )}
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter text-muted truncate w-full text-center">
              {p.id === currentUser?.id ? "Ja" : p.nickname}
            </span>
          </div>
        ))}
      </section>

      {/* Leaderboard */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-1">
          <Trophy className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t.tournament.leaderboard}</h2>
        </div>
        <div className="flex flex-col gap-2">
          {leaderboard.map((entry, idx) => (
            <motion.div
              key={entry.profile.id}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${isFinished && idx < 3 ? medalColor(idx) : "border-white/5 bg-white/5"}`}
            >
              <span className="text-lg w-7 text-center font-black">
                {isFinished && idx < 3
                  ? ["🥇","🥈","🥉"][idx]
                  : `${idx + 1}`}
              </span>
              <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {entry.profile.avatar_url ? (
                  <img src={entry.profile.avatar_url} alt={entry.profile.nickname} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black">{(entry.profile.nickname || "?")[0].toUpperCase()}</span>
                )}
              </div>
              <span className="flex-1 font-black uppercase text-sm tracking-tight truncate">
                {entry.profile.id === currentUser?.id ? "Ja" : entry.profile.nickname}
              </span>
              
              {/* Center: Small Points */}
              <div className="flex gap-1 text-muted/70 text-[11px] font-black bg-white/5 px-2.5 py-1 rounded-lg shrink-0 mx-2">
                <span>{entry.smallScored}</span>
                <span className="opacity-30">:</span>
                <span>{entry.smallConceded}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-black tracking-widest uppercase text-sm">
                <span className="text-muted/60">{entry.played}/{entry.totalMatches}</span>
                <div className="flex gap-2.5">
                  <span className="text-green-500">{entry.wins}{language === 'pl' ? 'Z' : 'W'}</span>
                  <span className="text-muted">{entry.draws}{language === 'pl' ? 'R' : 'D'}</span>
                  <span className="text-red-500">{entry.losses}{language === 'pl' ? 'P' : 'L'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Matches Sections */}
      <section className="flex flex-col gap-8">
        {/* Pending Matches */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <Play className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">Mecze do rozegrania</h2>
            <span className="ml-auto text-[11px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              {matches.filter(m => !m.match_games || m.match_games.length === 0).length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {matches.filter(m => !m.match_games || m.match_games.length === 0).map((match, idx) => (
                <MatchItem key={match.id} match={match} idx={idx} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Played Matches */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-1">
            <CheckCircle2 className="w-4 h-4 text-muted" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">Mecze rozegrane</h2>
            <span className="ml-auto text-[11px] font-black uppercase text-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {matches.filter(m => m.match_games && m.match_games.length > 0).length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
              {[...matches.filter(m => m.match_games && m.match_games.length > 0)].reverse().map((match, idx) => (
                <MatchItem key={match.id} match={match} idx={idx} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* End tournament button (organizer only, active only) */}
      {isOrganizer && !isFinished && (
        <div className="flex flex-col gap-3">
          <button
            onClick={allMatchesPlayed ? handleEndTournament : undefined}
            disabled={isEnding || !allMatchesPlayed}
            className={`w-full py-5 rounded-[20px] font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
              isConfirmingEnd
                ? "bg-secondary text-white border-secondary shadow-[0_0_20px_rgba(255,87,34,0.3)]"
                : !allMatchesPlayed
                ? "bg-white/5 border border-white/10 text-muted/40 cursor-not-allowed"
                : "bg-white/5 border border-white/10 text-muted hover:text-foreground hover:bg-white/10"
            }`}
          >
            {isEnding ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isConfirmingEnd ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Na pewno zakończ
              </>
            ) : !allMatchesPlayed ? (
              <>
                <Trophy className="w-5 h-5 opacity-40" />
                {t.tournament.endTournament}
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                {t.tournament.endTournament}
              </>
            )}
          </button>
          {isConfirmingEnd && (
            <p className="text-center text-[11px] text-muted font-bold uppercase tracking-widest animate-pulse">
              Kliknij ponownie, aby potwierdzić
            </p>
          )}
          {!isConfirmingEnd && !allMatchesPlayed && (
            <p className="text-center text-[10px] text-muted/50 font-black uppercase tracking-[0.2em] italic">
              Rozegraj wszystkie mecze, aby móc zakończyć turniej
            </p>
          )}
        </div>
      )}

      {/* Finished state notice */}
      {isFinished && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted">
          <Lock className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-widest">{t.tournament.finished}</span>
        </div>
      )}
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-background border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <Trash2 className="w-10 h-10" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Usuń turniej
                </h3>
                <p className="text-muted text-sm font-medium leading-relaxed">
                  Czy na pewno chcesz całkowicie usunąć ten turniej? Spowoduje to nieodwracalne usunięcie wszystkich powiązanych meczów i wyników z historii.
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleDeleteTournament}
                  disabled={isDeleting}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "TAK, USUŃ TURNIEJ"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all active:scale-95"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
