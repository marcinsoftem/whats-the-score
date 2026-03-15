"use client"

import { useState } from "react";
import { ChevronLeft, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddPlayerPage() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    
    // Simulate slight delay for premium feel
    setTimeout(() => {
      const savedPlayers = localStorage.getItem('wts_players');
      const players = savedPlayers ? JSON.parse(savedPlayers) : [];
      
      const newPlayer = {
        id: crypto.randomUUID(),
        nickname: nickname.trim(),
        type: 'virtual',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname.trim()}`
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
        
        <div className="text-center px-4">
          <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-white/5 mx-auto mb-4 flex items-center justify-center relative overflow-hidden">
            {nickname.trim() ? (
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname.trim()}`} 
                alt="Avatar preview" 
                className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" 
              />
            ) : (
              <UserPlus className="w-8 h-8 text-muted opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Profil Wirtualny</p>
        </div>
      </header>

      <form onSubmit={handleAddPlayer} className="flex flex-col gap-8 px-1">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-muted italic px-1">Pseudonim / Nick</label>
          <input
            type="text"
            required
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-lg font-bold text-foreground outline-none focus:border-primary/50 transition-all placeholder:text-muted/20"
            placeholder="Np. Marcin"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <button 
          type="submit"
          disabled={!nickname.trim() || loading}
          className="btn-primary w-full py-6 text-2xl shadow-[0_10px_30px_rgba(198,255,0,0.2)] active:scale-[0.98] transition-all group disabled:opacity-20 disabled:grayscale disabled:shadow-none"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-6 h-6" />
              ZAPISZ
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
