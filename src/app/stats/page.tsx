"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Trophy, Target, TrendingUp, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function StatsPage() {
  return (
    <AuthGuard>
      <StatsContent />
    </AuthGuard>
  );
}

function StatsContent() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: matches, error } = await supabase
          .from('matches')
          .select('*')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        if (matches && matches.length > 0) {
          let wins = 0;
          let losses = 0;
          let totalPoints = 0;
          let opponentPoints = 0;

          const recentPerformance = matches.slice(0, 10).map((m: any) => {
            const isP1 = m.player1_id === user.id;
            const userScore = isP1 ? m.score1 : m.score2;
            const oppScore = isP1 ? m.score2 : m.score1;
            
            if (userScore > oppScore) wins++;
            else if (oppScore > userScore) losses++;
            
            totalPoints += userScore;
            opponentPoints += oppScore;

            return {
              userScore,
              oppScore,
              win: userScore > oppScore
            };
          }).reverse();

          setStats({
            total: matches.length,
            wins,
            losses,
            winRate: Math.round((wins / matches.length) * 100),
            avgPoints: (totalPoints / matches.length).toFixed(1),
            recentPerformance
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 opacity-20">
          <Activity className="w-10 h-10" />
        </div>
        <p className="text-muted font-bold uppercase tracking-widest text-sm leading-relaxed max-w-[200px]">
          {t.stats.noData}
        </p>
        <Link href="/" className="btn-primary px-8">
          {t.common.home}
        </Link>
      </div>
    );
  }

  const winRateRadius = 40;
  const winRateCircumference = 2 * Math.PI * winRateRadius;
  const winRateOffset = winRateCircumference - (stats.winRate / 100) * winRateCircumference;

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-md mx-auto min-h-screen">
      <header className="flex items-center gap-4">
        <Link 
          href="/"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
          {t.stats.title}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 bg-primary/5 border-primary/10 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t.stats.totalMatches}</span>
          <span className="text-4xl font-black italic tracking-tighter text-primary font-barlow-condensed leading-none">{stats.total}</span>
        </div>
        <div className="card p-5 bg-secondary/5 border-secondary/10 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary/60">{t.stats.winRate}</span>
          <span className="text-4xl font-black italic tracking-tighter text-secondary font-barlow-condensed leading-none">{stats.winRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 bg-white/5 border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted block mb-1">{t.stats.wins}</span>
          <span className="text-xl font-bold text-green-500 font-barlow-condensed">{stats.wins}</span>
        </div>
        <div className="card p-4 bg-white/5 border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted block mb-1">{t.stats.losses}</span>
          <span className="text-xl font-bold text-red-500 font-barlow-condensed">{stats.losses}</span>
        </div>
        <div className="card p-4 bg-white/5 border-white/5 text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted block mb-1">{t.stats.avgPoints}</span>
          <span className="text-xl font-bold text-primary font-barlow-condensed">{stats.avgPoints}</span>
        </div>
      </div>

      {/* Win Rate Chart */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">
            {t.stats.performance}
          </h2>
        </div>
        <div className="card p-8 bg-accent/10 border-white/5 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={winRateRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                className="text-white/5"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={winRateRadius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={winRateCircumference}
                initial={{ strokeDashoffset: winRateCircumference }}
                animate={{ strokeDashoffset: winRateOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-primary"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black italic tracking-tighter leading-none">{stats.winRate}%</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-muted mt-1">{t.stats.winRate}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Trend Chart (Line Chart) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">
            {t.stats.recentTrend}
          </h2>
        </div>
        <div className="card p-6 bg-accent/10 border-white/5 relative overflow-hidden group">
          <div className="h-40 w-full relative pt-4">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Baseline and grid lines */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeWidth="0.1" className="text-white/10" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="0.1" className="text-white/10" strokeDasharray="1,1" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="0.2" className="text-white/20" />

              {(() => {
                const data = stats.recentPerformance;
                const points = data.map((d: any, i: number) => {
                  const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                  const y = 40 - (d.userScore / 3) * 40; // Max 3 games
                  return `${x},${y}`;
                });
                const pathData = `M ${points.join(' L ')}`;
                const areaData = `${pathData} L 100,40 L 0,40 Z`;

                return (
                  <>
                    {/* Area fill */}
                    <motion.path
                      d={areaData}
                      fill="url(#lineGradient)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    
                    {/* The Line */}
                    <motion.path
                      d={pathData}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                      className="drop-shadow-[0_0_8px_rgba(198,255,0,0.4)]"
                    />

                    {/* Data Points */}
                    {data.map((d: any, i: number) => {
                      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                      const y = 40 - (d.userScore / 3) * 40;
                      return (
                        <motion.circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="1.2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8 + i * 0.1 }}
                          className={d.win ? "fill-primary" : "fill-secondary/60"}
                          stroke="#121212"
                          strokeWidth="0.5"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
          
          <div className="flex justify-between mt-4 px-1">
             <span className="text-[8px] font-bold text-muted uppercase tracking-widest">{stats.recentPerformance.length > 0 ? "Starsze" : ""}</span>
             <span className="text-[8px] font-bold text-primary uppercase tracking-widest font-black italic">Ostatnie</span>
          </div>
        </div>
      </section>
    </div>
  );
}
