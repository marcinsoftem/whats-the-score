"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Trophy, Target, TrendingUp, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Preloader } from "@/components/ui/Preloader";

export default function StatsPage() {
  return (
    <AuthGuard>
      <StatsContent />
    </AuthGuard>
  );
}

function StatsContent() {
  const { t } = useLanguage();
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month'>('all');
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('all');
  const [opponents, setOpponents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        const { data: matches, error } = await supabase
          .from('matches')
          .select('*, player1:player1_id(id, nickname, avatar_url), player2:player2_id(id, nickname, avatar_url)')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        if (matches) {
          setAllMatches(matches);
          
          // Extract unique opponents
          const oppsMap = new Map();
          matches.forEach(m => {
            const opp = m.player1_id === user.id ? m.player2 : m.player1;
            if (opp && !oppsMap.has(opp.id)) {
              oppsMap.set(opp.id, opp);
            }
          });
          setOpponents(Array.from(oppsMap.values()));
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  useEffect(() => {
    if (allMatches.length === 0 || !currentUser) return;

    let filtered = [...allMatches];

    // Apply Time Filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === 'month') cutoff.setMonth(now.getMonth() - 1);
      if (timeFilter === 'year') cutoff.setFullYear(now.getFullYear() - 1);
      
      filtered = filtered.filter(m => new Date(m.timestamp) >= cutoff);
    }

    // Apply Player Filter
    if (selectedOpponentId !== 'all') {
      filtered = filtered.filter(m => 
        m.player1_id === selectedOpponentId || m.player2_id === selectedOpponentId
      );
    }

    if (filtered.length > 0) {
      let wins = 0;
      let losses = 0;
      let totalGamesWon = 0;
      let totalGamesPlayed = 0;

      const recentPerformance = filtered.slice(0, 10).map((m: any) => {
        const isP1 = m.player1_id === currentUser.id;
        const userScore = Number(isP1 ? m.score1 : m.score2) || 0;
        const oppScore = Number(isP1 ? m.score2 : m.score1) || 0;
        
        if (userScore > oppScore) wins++;
        else if (oppScore > userScore) losses++;
        
        totalGamesWon += userScore;
        totalGamesPlayed += (userScore + oppScore);

        const matchTotalGames = userScore + oppScore;
        const matchWinRate = matchTotalGames > 0 ? (userScore / matchTotalGames) * 100 : 0;

        return {
          userScore,
          oppScore,
          matchWinRate: isNaN(matchWinRate) ? 0 : matchWinRate,
          win: userScore > oppScore
        };
      }).reverse();

      setStats({
        total: filtered.length,
        wins,
        losses,
        winRate: Math.round((wins / filtered.length) * 100),
        gameWinRate: totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 100) : 0,
        recentPerformance
      });
    } else {
      setStats(null);
    }
  }, [allMatches, timeFilter, selectedOpponentId, currentUser]);

  if (loading) {
    return <Preloader />;
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
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform text-foreground"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl flex-1 font-black tracking-tight uppercase text-center pr-10 italic text-primary">
            {t.stats.title}
          </h1>
        </div>

        {/* Time Filter */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative">
          {(['all', 'year', 'month'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${
                timeFilter === filter ? 'text-background' : 'text-muted hover:text-foreground'
              }`}
            >
              {filter === 'all' ? 'Wszystko' : filter === 'year' ? 'Rok' : 'Miesiąc'}
              {timeFilter === filter && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-[0_0_15px_rgba(198,255,0,0.3)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Player Filter */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Przeciwnik</span>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
            <button
              onClick={() => setSelectedOpponentId('all')}
              className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
                selectedOpponentId === 'all' ? 'scale-110' : 'opacity-40 grayscale'
              }`}
            >
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                selectedOpponentId === 'all' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-tighter">Wszyscy</span>
            </button>
            {opponents.map((opp) => (
              <button
                key={opp.id}
                onClick={() => setSelectedOpponentId(opp.id)}
                className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
                  selectedOpponentId === opp.id ? 'scale-110' : 'opacity-40 grayscale'
                }`}
              >
                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
                  selectedOpponentId === opp.id ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'
                }`}>
                  {opp.avatar_url ? (
                    <img src={opp.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-sm">{opp.nickname[0]}</div>
                  )}
                </div>
                <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full text-center">{opp.nickname}</span>
              </button>
            ))}
          </div>
        </div>
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
          <span className="text-[8px] font-black uppercase tracking-widest text-muted block mb-1">Gemy %</span>
          <span className="text-xl font-bold text-primary font-barlow-condensed">{stats.gameWinRate}%</span>
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
          <div className="h-40 w-full relative pt-4 ml-2">
            <svg viewBox="-12 0 112 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Y-Axis Labels and Grid Lines (0-100%) */}
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 40 - (val / 100) * 40;
                return (
                  <g key={val} className="text-white/20">
                    <text 
                      x="-10" 
                      y={y} 
                      className="fill-muted text-[3px] font-bold" 
                      dominantBaseline="middle"
                    >
                      {val}%
                    </text>
                    <line 
                      x1="0" 
                      y1={y} 
                      x2="100" 
                      y2={y} 
                      stroke="currentColor" 
                      strokeWidth={val === 0 || val === 100 ? "0.2" : "0.1"} 
                      strokeDasharray={val === 0 || val === 100 ? "" : "1,1"} 
                    />
                  </g>
                );
              })}

              {(() => {
                const data = stats.recentPerformance;
                const points = data.map((d: any, i: number) => {
                  const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                  const winRate = Number(d.matchWinRate) || 0;
                  const y = 40 - (winRate / 100) * 40; 
                  return `${x},${y}`;
                });
                const pathData = `M ${points.join(' L ')}`;
                const areaData = data.length > 0 ? `${pathData} L 100,40 L 0,40 Z` : "";

                return (
                  <>
                    {/* Area fill */}
                    {areaData && (
                      <motion.path
                        d={areaData}
                        fill="url(#lineGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                    
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
                      const winRate = Number(d.matchWinRate) || 0;
                      const y = 40 - (winRate / 100) * 40;
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
