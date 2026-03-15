"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { useState, useEffect } from "react";
import { ScoreCounter } from "@/components/match/ScoreCounter";
import { PlayerCard } from "@/components/player/PlayerCard";
import { Player } from "@/types";
import { ChevronLeft, Save, Trash2, Pencil, Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";

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

  // New match state
  const [matchId, setMatchId] = useState<string>("");
  const [matchDate, setMatchDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Load players and state from localStorage on mount
  useEffect(() => {
    // 1. Load Available Players
    const savedPlayers = localStorage.getItem('wts_players');
    let playersList: Player[] = [];
    if (savedPlayers) {
      playersList = JSON.parse(savedPlayers);
    } else {
      // Default players if none exist
      playersList = [
        { id: 'p1', nickname: 'Miki', type: 'real' },
        { id: 'p2', nickname: 'Marcin', type: 'virtual' },
        { id: 'p3', nickname: 'Gracz Testowy', type: 'virtual' }
      ];
      localStorage.setItem('wts_players', JSON.stringify(playersList));
    }
    setAvailablePlayers(playersList);

    // 2. Load Match Data
    if (editId) {
      const history = JSON.parse(localStorage.getItem('wts_match_history') || '[]');
      const matchToEdit = history.find((m: any) => m.id === editId);
      if (matchToEdit) {
        setMatchId(matchToEdit.id);
        setMatchDate(matchToEdit.timestamp.split('T')[0]);
        setGames(matchToEdit.games || []);
        setScore1(matchToEdit.score1 || 0);
        setScore2(matchToEdit.score2 || 0);
        setPlayer1(matchToEdit.players[0]);
        setPlayer2(matchToEdit.players[1]);
        setIsSetup(false); // Go straight to scoring when editing
      } else {
        setMatchId(crypto.randomUUID());
      }
    } else {
      const savedMatch = localStorage.getItem('wts_active_match');
      if (savedMatch) {
        try {
          const data = JSON.parse(savedMatch);
          setScore1(data.score1 || 0);
          setScore2(data.score2 || 0);
          setGames(data.games || []);
          setMatchId(data.matchId || crypto.randomUUID());
          setMatchDate(data.matchDate || new Date().toISOString().split('T')[0]);
          setPlayer1(data.player1 || null);
          setPlayer2(data.player2 || null);
          if (data.player1 && data.player2) setIsSetup(false);
        } catch (e) {
          console.error("Failed to parse saved match", e);
          setMatchId(crypto.randomUUID());
        }
      } else {
        setMatchId(crypto.randomUUID());
        setPlayer1(playersList[0] || null);
        setPlayer2(playersList[1] || null);
      }
    }
    setIsLoaded(true);
  }, [editId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded || isSetup) return;
    
    const state = { score1, score2, games, matchId, matchDate, player1, player2 };
    localStorage.setItem('wts_active_match', JSON.stringify(state));
    
    // Also update global history whenever games change
    if (games.length > 0 && player1 && player2) {
      const history = JSON.parse(localStorage.getItem('wts_match_history') || '[]');
      const existingMatchIdx = history.findIndex((m: any) => m.id === matchId);
      
      const matchData = {
        id: matchId,
        players: [player1, player2],
        games: games,
        timestamp: new Date(matchDate).toISOString(),
        score1: score1, 
        score2: score2,
        totalGemy1: games.filter(g => g.p1 > g.p2).length,
        totalGemy2: games.filter(g => g.p2 > g.p1).length,
      };

      if (existingMatchIdx >= 0) {
        history[existingMatchIdx] = matchData;
      } else {
        history.unshift(matchData);
      }
      localStorage.setItem('wts_match_history', JSON.stringify(history));
    }
  }, [score1, score2, games, isLoaded, matchId, matchDate, player1, player2, isSetup]);

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

  const handleGoBack = () => {
    // Clear active match if we were editing specific one
    if (editId) {
      localStorage.removeItem('wts_active_match');
    }
    window.location.href = "/";
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
            {editId ? 'Edycja Meczu' : 'Mecz w toku'}
          </h1>
        </div>

        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5 group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-all group-hover:bg-primary/20">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-black tracking-widest text-muted group-hover:text-primary transition-colors">Data Meczu</span>
          </div>
          <input 
            type="date" 
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-foreground outline-none border-none p-0 focus:ring-0 cursor-pointer selection:bg-primary/30"
          />
        </div>
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
            <PlayerCard player={player1!} color="primary" className="bg-transparent border-none p-0" />
          </button>
          <ScoreCounter label="Twój Wynik" value={score1} onChange={setScore1} color="primary" />
        </div>

        <div className="flex flex-col gap-8">
          <button 
            onClick={() => { setScore1(7); setScore2(11); }}
            className="text-right active:scale-95 transition-transform"
          >
            <PlayerCard player={player2!} color="secondary" className="bg-transparent border-none p-0" alignRight />
          </button>
          <ScoreCounter label="Przeciwnik" value={score2} onChange={setScore2} color="secondary" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">Poprzednie Gemy</h2>
            {editingIndex !== null && (
              <button 
                onClick={handleCancelEdit}
                className="text-[10px] text-secondary font-bold hover:underline flex items-center gap-1 uppercase tracking-tighter"
              >
                Anuluj edycję gema {editingIndex + 1}
              </button>
            )}
          </div>
          <span className="text-[10px] text-primary font-bold">{games.length} Zapisano</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {games.length === 0 ? (
            <div className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center text-muted/30 text-xs uppercase font-bold tracking-widest italic">
              Brak rozegranych gemów
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
                  Gem {i+1} {editingIndex === i && "(EDYTUJESZ)"}
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
          {editingIndex !== null ? 'Aktualizuj Gem' : 'Zapisz Gem'}
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
              Opcje dla Gema {actionSheetIndex + 1}
            </h3>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => handleEditGame(actionSheetIndex!)}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-foreground transition-all active:scale-95"
              >
                <Pencil className="w-5 h-5" />
                Edytuj wynik
              </button>
              <button 
                onClick={() => handleDeleteGame(actionSheetIndex!)}
                className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-red-500 transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                Usuń gem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
