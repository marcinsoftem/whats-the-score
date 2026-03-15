import { Player } from "@/types";
import { User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  className?: string;
  alignRight?: boolean;
  color?: "primary" | "secondary";
}

export function PlayerCard({ player, className, alignRight, color = "primary" }: PlayerCardProps) {
  const isVirtual = player.type === 'virtual';

  return (
    <div className={cn("card flex items-center gap-4", alignRight && "flex-row-reverse text-right", className)}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
        isVirtual 
          ? "bg-accent border-muted/30 text-muted" 
          : color === "primary" 
            ? "bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(198,255,0,0.2)]" 
            : "bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(255,0,255,0.2)]"
      )}>
        {player.avatarUrl ? (
          <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className="w-6 h-6" />
        )}
      </div>
      
      <div className={cn("flex-1 overflow-hidden", alignRight && "items-end flex flex-col")}>
        <div className={cn("flex items-center gap-2", alignRight && "flex-row-reverse")}>
          <p className="font-bold text-lg leading-tight uppercase tracking-tight truncate">{player.nickname}</p>
          {isVirtual && (
            <span className={cn(
              "text-[10px] uppercase font-black px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0",
              color === "primary" 
                ? "bg-primary/10 text-primary border-primary/30" 
                : "bg-secondary/10 text-secondary border-secondary/30"
            )}>
              <ShieldAlert className="w-2.5 h-2.5" />
              Vir
            </span>
          )}
        </div>
        <p className="text-muted text-[10px] uppercase tracking-[0.2em] font-black opacity-50">Squash Player</p>
      </div>
    </div>
  );
}
