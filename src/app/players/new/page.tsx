"use client"

import { useState, useEffect } from "react";
import { ChevronLeft, UserPlus, Loader2, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddPlayerPage() {
  const [nickname, setNickname] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAvatarSeed(crypto.randomUUID());
    setMounted(true);
  }, []);

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
      const players = savedPlayers ? JSON.parse(savedPlayers) : [];
      
      const exists = players.some((p: any) => p.nickname.toLowerCase() === cleanNick.toLowerCase());
      if (exists) {
        setError("Gracz o takim nicku już istnieje");
        setLoading(false);
        return;
      }

      const newPlayer = {
        id: crypto.randomUUID(),
        nickname: cleanNick,
        type: 'virtual',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&clothing=graphicShirt&accessoriesProbability=0`
      };

      localStorage.setItem('wts_players', JSON.stringify([...players, newPlayer]));
      
      setLoading(false);
      router.push("/");
    }, 500);
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
            Dodaj Zawodnika
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
            
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-background shadow-lg text-black">
              <RefreshCcw className="w-4 h-4" />
            </div>
          </button>
          
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Kliknij w awatar aby wylosować</p>
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
            placeholder="Ksywka..."
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
              <UserPlus className="w-6 h-6" />
              UTWÓRZ GRACZA
            </>
          )}
        </button>
      </form>

      <div className="p-6 bg-accent/10 border border-white/5 rounded-3xl mt-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2 italic">Dobra rada</h3>
        <p className="text-[11px] leading-relaxed text-muted font-medium">
          Wirtualni gracze są widoczni tylko na Twoim urządzeniu. Możesz ich używać do szybkich meczy bez potrzeby pełnej rejestracji.
        </p>
      </div>
    </div>
  );
}
