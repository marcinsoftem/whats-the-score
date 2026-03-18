"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { useState, useEffect, Suspense } from "react";
import { ScoreCounter } from "@/components/match/ScoreCounter";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Player } from "@/types";
import { ChevronLeft, Save, Trash2, Pencil, Calendar, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Mock data removed

export default function MatchPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <MatchPageContent />
      </Suspense>
    </AuthGuard>
  );
}

function MatchPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [games, setGames] = useState<{ p1: number, p2: number }[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [actionSheetIndex, setActionSheetIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Setup state
  const [isSetup, setIsSetup] = useState(true);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // New match state
  const [matchId, setMatchId] = useState<string>("");
  const [matchDate, setMatchDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const supabase = createClient();

  // Load players and state from Supabase on mount
  useEffect(() => {
    async function init() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const standardizedUser = user ? {
        id: user.id,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Ty',
        avatarUrl: user.user_metadata?.avatar_url,
        type: 'real'
      } : { id: 'anon', nickname: 'Ty', type: 'real' };
      setCurrentUser(standardizedUser);

      // 2. Fetch all profiles from Supabase
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) throw profilesError;

        if (profiles) {
          const playersList = profiles
            .filter((p: any) => {
              if (p.type === 'real' && p.id !== standardizedUser.id) return true;
              if (p.type === 'virtual' && p.owner_id === standardizedUser.id) return true;
              return false;
            })
            .map((p: any) => ({
              id: p.id,
              nickname: p.nickname || 'Anonim',
              type: p.type || 'real',
              avatarUrl: p.avatar_url,
              owner_id: p.owner_id
            }));
          setAvailablePlayers(playersList);
        }

        // 3. Load Match Data
        if (editId) {
          const { data: matchToEdit, error: matchError } = await supabase
            .from('matches')
            .select('*, match_games(*)')
            .eq('id', editId)
            .single();

          if (!matchError && matchToEdit) {
            setMatchId(matchToEdit.id);
            setMatchDate(matchToEdit.timestamp.split('T')[0]);
            const formattedGames = (matchToEdit.match_games || [])
              .sort((a: any, b: any) => a.game_index - b.game_index)
              .map((g: any) => ({ p1: g.p1_score, p2: g.p2_score }));
            
            // Re-fetch players to ensure we have full objects
            const { data: p1, error: p1Error } = await supabase.from('profiles').select('*').eq('id', matchToEdit.player1_id).single();
            const { data: p2, error: p2Error } = await supabase.from('profiles').select('*').eq('id', matchToEdit.player2_id).single();
            
            if (p1Error || p2Error || !p1 || !p2) {
              console.error('Match is orphaned (players deleted). Redirecting...');
              router.push('/');
              return;
            }

            const p1Formatted = { ...p1, avatarUrl: p1.avatar_url };
            const p2Formatted = { ...p2, avatarUrl: p2.avatar_url };

            const shouldSwap = p2.id === standardizedUser.id;
            
            if (shouldSwap) {
              setPlayer1(p2Formatted as any);
              setPlayer2(p1Formatted as any);
              setGames(formattedGames.map((g: any) => ({ p1: g.p2, p2: g.p1 })));
            } else {
              setPlayer1(p1Formatted as any);
              setPlayer2(p2Formatted as any);
              setGames(formattedGames);
            }
            
            setScore1(0);
            setScore2(0);
            setIsSetup(false);
          }
        } else {
          const savedMatch = localStorage.getItem('wts_active_match');
          if (savedMatch) {
            const data = JSON.parse(savedMatch);
            setScore1(data.score1 || 0);
            setScore2(data.score2 || 0);
            setGames(data.games || []);
            setMatchId(data.matchId || crypto.randomUUID());
            setMatchDate(data.matchDate || new Date().toISOString().split('T')[0]);
            setPlayer1(data.player1 || null);
            setPlayer2(data.player2 || null);
            if (data.player1 && data.player2) setIsSetup(false);
          }
        }
      } catch (err) {
        console.error('Error initializing match:', err);
      }
      setIsLoaded(true);
    }
    init();
  }, [editId]);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Save progress to Supabase and localStorage
  const saveMatchToDb = async () => {
    if (!isLoaded || isSetup || !player1 || !player2) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      const isSwapped = player1?.id !== currentUser?.id && player2?.id === currentUser?.id;

      // 1. Save main match record
      const matchData = {
        id: matchId,
        player1_id: isSwapped ? player2.id : player1.id,
        player2_id: isSwapped ? player1.id : player2.id,
        score1: games.filter(g => (isSwapped ? g.p2 > g.p1 : g.p1 > g.p2)).length,
        score2: games.filter(g => (isSwapped ? g.p1 > g.p2 : g.p2 > g.p1)).length,
        timestamp: new Date(matchDate).toISOString(),
        created_by: currentUser?.id === 'anon' || !currentUser?.id ? null : currentUser?.id
      };

      console.log('Saving match to Supabase:', matchData);

      const { error: matchError } = await supabase
        .from('matches')
        .upsert(matchData);
      
      if (matchError) throw matchError;

      // 2. Save games
      // First delete existing games for this match to ensure synchronization
      const { error: delError } = await supabase.from('match_games').delete().eq('match_id', matchId);
      if (delError) throw delError;

      if (games.length > 0) {
        const gamesData = games.map((g, i) => ({
          match_id: matchId,
          game_index: i,
          p1_score: isSwapped ? g.p2 : g.p1,
          p2_score: isSwapped ? g.p1 : g.p2
        }));

        const { error: gamesError } = await supabase
          .from('match_games')
          .insert(gamesData);
        
        if (gamesError) throw gamesError;
      }

      // 3. Update local storage for temporary persistence
      const state = { score1, score2, games, matchId, matchDate, player1, player2 };
      localStorage.setItem('wts_active_match', JSON.stringify(state));
    } catch (err: any) {
      console.error('Error saving match to DB:', err);
      setSaveError(err.message || t.matches.active.syncError);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSetup) {
      saveMatchToDb();
    }
  }, [isLoaded, isSetup, score1, score2, games, matchDate, player1, player2, currentUser]);

  const p1Games = games.filter(g => g.p1 > g.p2).length;
  const p2Games = games.filter(g => g.p2 > g.p1).length;

  // ... (rest of validation and handlers remain the same)
  const isValidScore = (
    (score1 === 11 && score2 <= 9) || 
    (score2 === 11 && score1 <= 9) || 
    (score1 > 11 && score1 - score2 === 2) || 
    (score2 > 11 && score2 - score1 === 2)
  );

  const handleFinishGame = () => {
    if (!isValidScore) return;
    
    if (editingIndex !== null) {
      const newGames = [...games];
      newGames[editingIndex] = { p1: score1, p2: score2 };
      setGames(newGames);
      setEditingIndex(null);
    } else {
      setGames([...games, { p1: score1, p2: score2 }]);
    }
    
    setScore1(0);
    setScore2(0);
  };

  const handleDeleteGame = (index: number) => {
    const newGames = [...games];
    newGames.splice(index, 1);
    setGames(newGames);
    if (editingIndex === index) {
      setEditingIndex(null);
      setScore1(0);
      setScore2(0);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
    setActionSheetIndex(null);
  };

  const handleEditGame = (index: number) => {
    const game = games[index];
    setScore1(game.p1);
    setScore2(game.p2);
    setEditingIndex(index);
    setActionSheetIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setScore1(0);
    setScore2(0);
  };

  const router = useRouter();

  const handleGoBack = () => {
    // Clear active match if we were editing specific one
    if (editId) {
      localStorage.removeItem('wts_active_match');
    }
    const from = searchParams.get('from');
    const backUrl = from === 'players' ? '/players' : '/';
    router.push(backUrl);
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleGoBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
            {editId ? t.matches.active.editTitle : t.matches.active.matchInProgress}
          </h1>
        </div>

        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5 group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-all group-hover:bg-primary/20">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-muted group-hover:text-primary transition-colors">{t.matches.active.matchDate}</span>
          </div>
          <input 
            type="date" 
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-foreground outline-none border-none p-0 focus:ring-0 cursor-pointer selection:bg-primary/30"
          />
        </div>
      </header>

      {saveError && (
        <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-2xl flex items-center justify-center gap-2 animate-pulse">
          <span className="text-[10px] font-black uppercase text-secondary italic">Błąd synchronizacji: {saveError}</span>
        </div>
      )}

      {isSaving && !saveError && (
        <div className="bg-primary/10 border border-primary/20 p-2 rounded-2xl flex items-center justify-center gap-2 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          <span className="text-[9px] font-black uppercase text-primary italic">{t.matches.active.syncing}</span>
        </div>
      )}

      <div className="flex justify-between items-center bg-accent/30 p-4 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-bold font-barlow-condensed leading-none text-primary">{p1Games}</span>
          <span className="text-[10px] uppercase font-black text-muted tracking-tighter">{t.matches.gamesLabel.replace(':', '')}</span>
        </div>
        <div className="text-[10px] uppercase font-black text-primary tracking-[0.2em] px-5 py-2 bg-primary/10 rounded-full border border-primary/20">
          {t.matches.active.matchResult}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-bold font-barlow-condensed leading-none text-secondary">{p2Games}</span>
          <span className="text-[10px] uppercase font-black text-muted tracking-tighter">{t.matches.gamesLabel.replace(':', '')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8 items-start py-4 relative">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-3/4 bg-white/5 hidden sm:block" />
        
        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setScore1(11); setScore2(7); }}
            className="text-left active:scale-95 transition-transform"
          >
            <PlayerCard 
              player={player1!} 
              color="primary" 
              className="bg-transparent border-none p-0" 
              isMe={player1?.id === currentUser?.id}
              meLabel={t.common.ja}
            />
          </button>
          <ScoreCounter label={t.matches.active.yourScore} value={score1} onChange={setScore1} color="primary" />
        </div>

        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setScore1(7); setScore2(11); }}
            className="text-right active:scale-95 transition-transform"
          >
            <PlayerCard 
              player={player2!} 
              color="secondary" 
              className="bg-transparent border-none p-0" 
              isMe={player2?.id === currentUser?.id}
              meLabel={t.common.ja}
              alignRight 
            />
          </button>
          <ScoreCounter label={t.matches.active.opponent} value={score2} onChange={setScore2} color="secondary" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">{t.matches.active.previousGames}</h2>
            {editingIndex !== null && (
              <button 
                onClick={handleCancelEdit}
                className="text-[10px] text-secondary font-bold hover:underline flex items-center gap-1 uppercase tracking-tighter"
              >
                {t.matches.active.cancelEdit} {editingIndex + 1}
              </button>
            )}
          </div>
          <span className="text-[10px] text-primary font-bold">{games.length} {t.matches.active.saved}</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {games.length === 0 ? (
            <div className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-muted/30 text-xs uppercase font-bold tracking-widest italic">
              {t.matches.active.noGames}
            </div>
          ) : (
            games.map((game, i) => (
              <button 
                key={i} 
                onClick={() => setActionSheetIndex(i)}
                className={`card min-w-[140px] flex flex-col items-center gap-1 py-4 px-4 border transition-all text-center relative ${
                  editingIndex === i 
                    ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(198,255,0,0.1)] ring-1 ring-primary/20" 
                    : "bg-white/5 border-white/5 hover:border-primary/30 active:scale-95"
                }`}
              >
                <span className={`text-[9px] uppercase font-black tracking-widest ${editingIndex === i ? "text-primary" : "text-muted"}`}>
                  Gem {i+1} {editingIndex === i && `(${t.common.edit.toUpperCase()})`}
                </span>
                <span className="text-2xl font-bold font-barlow-condensed tracking-wider text-foreground">
                  <span className={game.p1 > game.p2 ? "text-primary" : ""}>{game.p1}</span>
                  <span className="mx-1 text-muted">:</span>
                  <span className={game.p2 > game.p1 ? "text-secondary" : ""}>{game.p2}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </section>
      
      <div className="fixed bottom-[62px] left-0 right-0 p-4 bg-[#121212] z-[90] max-w-md mx-auto shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <button 
          onClick={handleFinishGame}
          disabled={!isValidScore}
          className="btn-primary w-full py-5 text-xl tracking-tighter shadow-[0_0_30px_rgba(198,255,0,0.1)] disabled:opacity-20 disabled:grayscale disabled:shadow-none transition-all italic font-black uppercase"
        >
          {editingIndex !== null ? t.matches.active.updateGame : t.matches.active.saveGame}
        </button>
      </div>

      {/* Mobile Action Sheet */}
      {actionSheetIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-16 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0" 
            onClick={() => setActionSheetIndex(null)}
          />
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-[2.5rem] p-6 pb-14 shadow-2xl relative animate-in slide-in-from-bottom-full duration-300 border border-white/10">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-center font-black uppercase tracking-widest text-muted mb-6">
              {t.matches.active.gameOptions} {actionSheetIndex + 1}
            </h3>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleEditGame(actionSheetIndex!)}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-foreground transition-all active:scale-95"
              >
                <Pencil className="w-5 h-5" />
                {t.matches.active.editScore}
              </button>
              <button 
                onClick={() => handleDeleteGame(actionSheetIndex!)}
                className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-red-500 transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                {t.matches.active.deleteGame}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
