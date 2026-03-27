"use client"
 
import { useState, useEffect } from "react";
import { ChevronLeft, UserPlus, Loader2, Pencil, Trash2, AlertTriangle, Shield, CheckCircle2, Search, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthGuard from "@/components/auth/AuthGuard";

import { Preloader } from "@/components/ui/Preloader";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PlayersPage() {
  return (
    <AuthGuard>
      <PlayersPageContent />
    </AuthGuard>
  );
}

function PlayersPageContent() {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<any[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyFavs, setShowOnlyFavs] = useState(false);
  const [showOnlyVirtual, setShowOnlyVirtual] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const standardizedUser = {
        id: user.id,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Ty',
        type: 'real'
      };
      setCurrentUser(standardizedUser);

      try {
        // 2. Fetch favorites
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('profile_id')
          .eq('user_id', user.id);
        
        if (favorites) {
          setFavIds(favorites.map(f => f.profile_id));
        }

        // 3. Fetch all profiles from Supabase
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) throw profilesError;

        if (profiles) {
          const allPlayers = profiles
            .filter(p => {
              if (p.type === 'real' && p.id !== standardizedUser.id) return true;
              if (p.type === 'virtual' && p.owner_id === standardizedUser.id) return true;
              return false;
            })
            .map(p => ({
              id: p.id,
              nickname: p.nickname || t.common.anonim,
              type: p.type || 'real',
              avatarUrl: p.avatar_url,
              owner_id: p.owner_id
            }));

          const sortedPlayers = allPlayers.sort((a: any, b: any) => 
            a.nickname.localeCompare(b.nickname)
          );
          setPlayers(sortedPlayers);
        }

        // 4. Fetch Matches from Supabase
        const { data: dbMatches, error: matchesError } = await supabase
          .from('matches')
          .select('*, player1:player1_id(*), player2:player2_id(*)');
        
        if (!matchesError && dbMatches) {
          setMatches(dbMatches);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }

      setIsLoaded(true);
    }
    init();
  }, []);

  const toggleFavorite = async (profileId: string) => {
    if (!currentUser) return;
    
    const isFav = favIds.includes(profileId);
    
    try {
      if (isFav) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('profile_id', profileId);
        setFavIds(prev => prev.filter(id => id !== profileId));
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: currentUser.id, profile_id: profileId });
        setFavIds(prev => [...prev, profileId]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDeleteClick = (player: any) => {
    setDeleteId(player.id);
    
    // Check if player has match history in the fetched matches
    const historyFound = matches.some(match => 
      match.player1_id === player.id || match.player2_id === player.id
    );
    
    setHasHistory(historyFound);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteId);
      
      if (error) throw error;

      setPlayers(prev => prev.filter(p => p.id !== deleteId));
    } catch (err: any) {
      console.error('Error deleting player:', err);
      alert("Błąd usuwania gracza: " + (err.message || "Błąd RLS lub kluczy obcych. Sprawdź nowe instrukcje w implementation_plan.md"));
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.nickname.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = showOnlyFavs ? favIds.includes(p.id) : true;
    const matchesVirtual = showOnlyVirtual ? p.type === 'virtual' : true;
    return matchesSearch && matchesFav && matchesVirtual;
  });

  if (!isLoaded) return <Preloader />;

  return (
    <div className="flex flex-col gap-8 pb-20 relative">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
            {t.players.title}
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={t.players.searchPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
            <button
              onClick={() => setShowOnlyFavs(!showOnlyFavs)}
              className={`flex-1 py-2.5 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all ${
                showOnlyFavs 
                  ? "bg-primary text-background shadow-[0_0_20px_rgba(198,255,0,0.4)] scale-[1.02]" 
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              {t.players.filters.favorites}
            </button>
            <button
              onClick={() => setShowOnlyVirtual(!showOnlyVirtual)}
              className={`flex-1 py-2.5 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all ${
                showOnlyVirtual 
                  ? "bg-primary text-background shadow-[0_0_20px_rgba(198,255,0,0.4)] scale-[1.02]" 
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              {t.players.filters.virtual}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {filteredPlayers.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
            <UserPlus className="w-12 h-12" />
            <p className="text-xs font-black uppercase tracking-widest italic">{t.players.noPlayers}</p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            // Strict ownership: 
            // If logged in: owner_id must match explicitly.
            // If guest: allow if no owner or 'anon'.
            const isGuest = currentUser?.id === 'anon';
            const isOwner = isGuest 
              ? (!player.owner_id || player.owner_id === 'anon') // Check both for safety
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
                      {isVirtual && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded-full">{t.players.virtual}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(player.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${
                      favIds.includes(player.id) 
                        ? "bg-primary text-background border-primary shadow-primary/20" 
                        : "bg-white/5 text-muted border-white/10 hover:text-primary hover:bg-white/10 hover:border-primary/30"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${favIds.includes(player.id) ? "fill-current" : ""}`} />
                  </button>

                  {isVirtual && isOwner && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/players/new?id=${player.id}&from=players`}
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
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8">
        <Link 
          href="/players/new?from=players"
          className="btn-primary w-full py-6 text-xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] flex items-center justify-center gap-3"
        >
          <UserPlus className="w-6 h-6" />
          {t.players.createPlayer}
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
                  {hasHistory ? t.players.deleteConfirmTitle : t.players.deleteConfirmQuestion}
                </h3>
                <p className="text-muted text-sm font-medium leading-relaxed">
                  {hasHistory 
                    ? t.players.deleteConfirmMatchText
                    : t.players.deleteConfirmText}
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 ${
                    hasHistory ? 'bg-[#FF5722] text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {t.players.deleteConfirmButton}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
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
