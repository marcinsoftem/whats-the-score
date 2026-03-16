"use client"

import { useState, useEffect, Suspense } from "react";
import { ChevronLeft, UserPlus, Loader2, RefreshCcw, Save, Copy, Check, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AddPlayerContent() {
  const [nickname, setNickname] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const editId = searchParams.get('id');

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      const standardizedUser = user ? {
        id: user.id,
        nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || 'Ty',
        type: 'real'
      } : { id: 'anon', nickname: 'Ty', type: 'real' };
      setCurrentUser(standardizedUser);
    }
    getUser();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !currentUser) return;
    
    const savedPlayers = localStorage.getItem('wts_players');
    const players = savedPlayers ? JSON.parse(savedPlayers) : [];

    if (editId) {
      const player = players.find((p: any) => p.id === editId);
      
      // Ownership check: allow if no owner (legacy), if owner is 'anon' (shared on device), or if current user matches
      const isGuest = currentUser?.id === 'anon';
      const isOwner = isGuest 
        ? (!player?.owner_id || player?.owner_id === 'anon')
        : (player?.owner_id === currentUser.id);

      if (player && player.type === 'virtual' && isOwner) {
        setNickname(player.nickname);
        // Extract seed from URL if possible
        try {
          const url = new URL(player.avatarUrl);
          const seed = url.searchParams.get('seed');
          if (seed) setAvatarSeed(seed);
        } catch (e) {}
        setIsEdit(true);
      } else if (player) {
        router.push("/");
      }
    } else if (!isEdit) {
      setAvatarSeed(crypto.randomUUID());
    }
  }, [editId, mounted, currentUser]);

  if (!mounted) return null;

  const generateRandomAvatar = () => {
    setAvatarSeed(crypto.randomUUID());
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (!cleanNick) return;
    if (cleanNick.length > 10) {
      setError("Nick może mieć max 10 znaków");
      return;
    }

    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const savedPlayers = localStorage.getItem('wts_players');
      let players = savedPlayers ? JSON.parse(savedPlayers) : [];
      
      const cleanNickLower = cleanNick.toLowerCase();
      const exists = players.some((p: any) => p.nickname.toLowerCase() === cleanNickLower && p.id !== editId);
      
      if (exists) {
        setError("Gracz o takim nicku już istnieje");
        setLoading(false);
        return;
      }

      if (isEdit) {
        players = players.map((p: any) => p.id === editId && p.type === 'virtual' ? {
          ...p,
          nickname: cleanNick,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`
        } : p);
      } else {
        const newPlayer = {
          id: crypto.randomUUID(),
          nickname: cleanNick,
          type: 'virtual',
          owner_id: currentUser?.id || 'anon',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`
        };
        players.push(newPlayer);
      }

      localStorage.setItem('wts_players', JSON.stringify(players));
      
      setLoading(false);
      router.push("/");
    }, 500);
  };

  const handleCopyInvite = () => {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/register?invite_id=${editId}&nickname=${encodeURIComponent(nickname)}&seed=${avatarSeed}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-md mx-auto">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
            DODAJ WIRTUALNEGO ZAWODNIKA
          </h1>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <button 
            type="button"
            onClick={generateRandomAvatar}
            className="group relative"
          >
            <div className="w-28 h-28 rounded-full bg-accent/20 border-2 border-white/5 mx-auto flex items-center justify-center relative overflow-hidden ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30 group-active:scale-95">
              <img 
                key={avatarSeed}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`} 
                alt="Avatar preview" 
                className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-white animate-spin" />
              </div>
            </div>
            
          </button>
          
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">KLIKNIJ, ABY WYLOSOWAĆ</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleAddPlayer} className="flex flex-col gap-6 px-1">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-muted italic">Pseudonim</label>
            <span className={`text-[10px] font-black ${nickname.length > 10 ? 'text-secondary' : 'text-muted/40'}`}>
              {nickname.length}/10
            </span>
          </div>
          <input
            type="text"
            required
            autoFocus
            maxLength={10}
            className={`w-full bg-white/5 border rounded-2xl p-4 text-lg font-bold text-foreground outline-none transition-all placeholder:text-muted/20 ${
              error ? 'border-secondary/50 bg-secondary/5' : 'border-white/10 focus:border-primary/50'
            }`}
            placeholder="Wpisz pseudonim..."
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError(null);
            }}
          />
          {error && (
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-center animate-pulse">{error}</p>
          )}
        </div>

        <button 
          type="submit"
          disabled={!nickname.trim() || loading || nickname.length > 10}
          className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] active:scale-[0.98] transition-all group disabled:opacity-20 disabled:grayscale disabled:shadow-none mt-4"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              {isEdit ? <Save className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              {isEdit ? 'ZAPISZ ZMIANY' : 'UTWÓRZ ZAWODNIKA'}
            </>
          )}
        </button>
      </form>

      {isEdit && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-secondary/10 border border-secondary/20 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Share2 className="w-12 h-12 text-secondary" />
            </div>
            
            <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-2 italic">Zaproś do aplikacji</h3>
            <p className="text-[11px] leading-relaxed text-muted font-medium mb-4 pr-12">
              Chcesz, aby ten zawodnik sam wpisywał wyniki? Wyślij mu ten link, aby mógł utworzyć prawdziwe konto zachowując swoje mecze.
            </p>
            
            <button
              onClick={handleCopyInvite}
              className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                copySuccess 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'bg-white/5 border-white/10 text-white active:scale-95'
              }`}
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  SKOPIOWANO!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  KOPIUJ LINK DO REJESTRACJI
                </>
              )}
            </button>
          </div>
        </div>
      )}


      <div className="p-6 bg-accent/10 border border-white/5 rounded-3xl mt-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2 italic">Dobra rada</h3>
        <p className="text-[11px] leading-relaxed text-muted font-medium">
          Wirtualni gracze są widoczni tylko na Twoim urządzeniu. Możesz ich używać do szybkich meczy bez potrzeby pełnej rejestracji.
        </p>
      </div>
    </div>
  );
}

export default function AddPlayerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AddPlayerContent />
    </Suspense>
  );
}
