import { Player } from "@/types";
import { User, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  className?: string;
  alignRight?: boolean;
  color?: "primary" | "secondary";
  isMe?: boolean;
}

export function PlayerCard({ player, className, alignRight, color = "primary", isMe }: PlayerCardProps) {
  // We specify colors based on props, typically primary for P1 and secondary for P2
  const borderColorClass = color === "primary" ? "border-primary" : "border-secondary";
  const bgColorClass = color === "primary" ? "bg-primary/10" : "bg-secondary/10";
  const textColorClass = color === "primary" ? "text-primary" : "text-secondary";
  const glowClass = color === "primary" ? "shadow-[0_0_15px_rgba(198,255,0,0.15)]" : "shadow-[0_0_15px_rgba(255,0,255,0.15)]";

  return (
    <div className={cn("card flex items-center gap-4", alignRight && "flex-row-reverse text-right", className)}>
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
        borderColorClass, bgColorClass, textColorClass, glowClass
      )}>
        {player.avatarUrl ? (
          <img src={player.avatarUrl} alt={player.nickname} className="w-full h-full rounded-full object-cover" />
        ) : (
          <User className="w-6 h-6" />
        )}
      </div>
      
      <div className={cn("flex-1 min-w-0", alignRight && "items-end flex flex-col")}>
        <div className={cn("flex items-center w-full", alignRight && "flex-row-reverse")}>
          <p className={cn(
            "font-extrabold text-xl leading-none uppercase tracking-tighter truncate",
            textColorClass
          )}>
            {isMe ? 'Ja' : player.nickname}
          </p>
        </div>
        <p className="text-muted text-[9px] mt-1 uppercase tracking-[0.2em] font-black opacity-40 leading-tight">
          SQUASH<br />PLAYER
        </p>
      </div>
    </div>
  );
}
