import { Plus } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl tracking-tighter">What&apos;s The Score?</h1>
        <p className="text-muted text-sm">Przejmij kontrolę nad swoją grą.</p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl">Ostatnie Mecze</h2>
          <Link href="/matches" className="text-primary text-xs uppercase font-bold tracking-widest hover:underline">Zobacz wszystkie</Link>
        </div>
        
        <div className="card flex flex-col gap-4 items-center justify-center py-12 text-center bg-accent/30 border-dashed">
          <p className="text-muted text-sm">Nie masz jeszcze żadnych meczów.</p>
          <Link href="/matches/active" className="btn-primary">
            <Plus className="w-5 h-5" />
            Nowy Mecz
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Szybki Wybór</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link href="/players/new" className="card flex flex-col gap-2 items-start active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm">Dodaj Zawodnika</p>
          </Link>
          <Link href="/players?filter=virtual" className="card flex flex-col gap-2 items-start active:scale-95 transition-transform">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Plus className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm">Wirtualni Gracze</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
