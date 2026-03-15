import { Player } from "@/types";
import { User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  className?: string;
}

export function PlayerCard({ player, className }: PlayerCardProps) {
  const isVirtual = player.type === 'virtual';

  return (
    <div className={cn("card flex items-center gap-4", className)}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center border-2",
        isVirtual ? "bg-accent border-muted/30 text-muted" : "bg-primary/20 border-primary text-primary"
      )}>
        {player.avatarUrl ? (
          <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className="w-6 h-6" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-lg leading-tight uppercase tracking-tight">{player.nickname}</p>
          {isVirtual && (
            <span className="bg-muted/10 text-muted text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-muted/20 flex items-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5" />
              Wirtualny
            </span>
          )}
        </div>
        <p className="text-muted text-xs uppercase tracking-widest font-medium">Squash Player</p>
      </div>
    </div>
  );
}
