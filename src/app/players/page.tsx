"use client"
 
import { useState, useEffect } from "react";
import { ChevronLeft, UserPlus, Loader2, Pencil, Trash2, AlertTriangle, Shield, CheckCircle2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const standardizedUser = user ? {
        id: user.id,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Ty',
        type: 'real'
      } : { id: 'anon', nickname: 'Ty', type: 'real' };
      setCurrentUser(standardizedUser);

      // 2. Load Virtual Players
      const savedPlayers = localStorage.getItem('wts_players');
      const virtualPlayers = savedPlayers ? JSON.parse(savedPlayers) : [];
      
      // 3. Load Match History (to find players played with historically)
      const history = localStorage.getItem('wts_match_history');
      const matchesList = history ? JSON.parse(history) : [];
      setMatches(matchesList);

      // 4. Load Global Registered Players from Supabase
      let globalRealPlayers: any[] = [];
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (!profilesError && profiles) {
          globalRealPlayers = profiles.map(p => ({
            id: p.id,
            nickname: p.nickname || 'Anonim',
            type: 'real',
            avatarUrl: p.avatar_url
          }));
        }
      } catch (err) {
        console.error('Error fetching global profiles:', err);
      }

      // 5. Extract additional real players from match history (backward compatibility)
      const localRealPlayersMap = new Map();
      matchesList.forEach((match: any) => {
        match.players.forEach((p: any) => {
          if (p.type === 'real' && p.id !== standardizedUser.id) {
            localRealPlayersMap.set(p.id, p);
          }
        });
      });

      // 6. Merge: Global profiles take precedence, then local history, then virtual
      const allRealPlayersMap = new Map();
      
      // Add local ones first
      localRealPlayersMap.forEach((p, id) => allRealPlayersMap.set(id, p));
      // Overwrite with global ones (more up-to-date)
      globalRealPlayers.forEach((p) => {
        if (p.id !== standardizedUser.id) {
          allRealPlayersMap.set(p.id, p);
        }
      });

      const allPlayers = [...virtualPlayers, ...Array.from(allRealPlayersMap.values())];
      const sortedPlayers = allPlayers.sort((a: any, b: any) => 
        a.nickname.localeCompare(b.nickname)
      );
      setPlayers(sortedPlayers);

      setIsLoaded(true);
    }
    init();
  }, []);

  const handleDeleteClick = (player: any) => {
    setDeleteId(player.id);
    
    // Check if player has match history
    const historyFound = matches.some(match => 
      match.players.some((p: any) => p.id === player.id)
    );
    
    setHasHistory(historyFound);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;

    const updatedPlayers = players.filter(p => p.id !== deleteId);
    localStorage.setItem('wts_players', JSON.stringify(updatedPlayers));
    setPlayers(updatedPlayers);
    
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const filteredPlayers = players.filter(p => 
    p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-md mx-auto relative min-h-screen">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
            Zarządzaj Graczami
          </h1>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Szukaj zawodnika..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {filteredPlayers.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
            <UserPlus className="w-12 h-12" />
            <p className="text-xs font-black uppercase tracking-widest italic">Nie znaleziono graczy</p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            // Strict ownership: 
            // If logged in: owner_id must match explicitly.
            // If guest: allow if no owner or 'anon'.
            const isGuest = currentUser?.id === 'anon';
            const isOwner = isGuest 
              ? (!player.owner_id || player.owner_id === 'anon')
              : (player.owner_id === currentUser.id);
            
            const isVirtual = player.type === 'virtual';

            return (
              <div 
                key={player.id}
                className="card p-4 flex items-center justify-between gap-4 group hover:border-white/20 transition-all border-white/5 bg-accent/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black">{player.nickname[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black uppercase italic tracking-tighter text-lg leading-tight">{player.nickname}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isVirtual ? (
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">Wirtualny</span>
                      ) : (
                        <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-secondary/60 border border-secondary/20 px-1.5 py-0.5 rounded-full">
                          <Shield className="w-2 h-2" />
                          Realny
                        </div>
                      )}
                      {isOwner && isVirtual && (
                        <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 text-muted px-1.5 py-0.5 rounded-full">Ty</span>
                      )}
                    </div>
                  </div>
                </div>

                {isVirtual && isOwner && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/players/new?id=${player.id}`}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all active:scale-90 border border-white/5"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(player)}
                      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90 border border-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <Link 
          href="/players/new"
          className="btn-primary w-full py-6 text-xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] flex items-center justify-center gap-3"
        >
          <UserPlus className="w-6 h-6" />
          NOWY ZAWODNIK
        </Link>
      </div>
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-background border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col items-center text-center gap-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${hasHistory ? 'bg-secondary/10 text-secondary' : 'bg-red-500/10 text-red-500'}`}>
                {hasHistory ? <AlertTriangle className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  {hasHistory ? 'Ważne ostrzeżenie!' : 'Czy na pewno?'}
                </h3>
                <p className="text-muted text-sm font-medium leading-relaxed">
                  {hasHistory 
                    ? 'Ten zawodnik ma przypisane mecze w historii. Usunięcie go spowoduje, że jego dane w tamtych meczach mogą być niepełne. Kontynuować?'
                    : 'Czy na pewno chcesz usunąć tego zawodnika? Ta operacja jest nieodwracalna.'}
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 ${
                    hasHistory ? 'bg-[#FF5722] text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  Tak, usuń gracza
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all active:scale-95"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
