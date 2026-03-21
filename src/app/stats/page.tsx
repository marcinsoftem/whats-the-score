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
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'week'>('all');
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('all');
  const [opponents, setOpponents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [medals, setMedals] = useState<{ gold: number; silver: number; bronze: number }>({ gold: 0, silver: 0, bronze: 0 });
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUser(user);

        const { data: matches, error } = await supabase
          .from('matches')
          .select('*, player1:player1_id(id, nickname, avatar_url), player2:player2_id(id, nickname, avatar_url), match_games(*)')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('timestamp', { ascending: false })
          .order('created_at', { ascending: false });

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

        // Load medals
        const { data: medalsData } = await supabase
          .from('tournament_medals')
          .select('medal')
          .eq('profile_id', user.id);
        if (medalsData) {
          const counts = medalsData.reduce((acc: any, m: any) => {
            acc[m.medal] = (acc[m.medal] || 0) + 1;
            return acc;
          }, { gold: 0, silver: 0, bronze: 0 });
          setMedals(counts);
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
      if (timeFilter === 'week') cutoff.setDate(now.getDate() - 7);
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
      let draws = 0;
      let totalGamesWon = 0;
      let totalGamesPlayed = 0;
      let totalPointsScored = 0;
      let totalPointsLost = 0;
      let totalPointsPlayed = 0;

      // Calculate global stats for ALL filtered matches
      filtered.forEach((m: any) => {
        const isP1 = m.player1_id === currentUser.id;
        const userScore = Number(isP1 ? m.score1 : m.score2) || 0;
        const oppScore = Number(isP1 ? m.score2 : m.score1) || 0;
        
        if (userScore > oppScore) wins++;
        else if (oppScore > userScore) losses++;
        else draws++;
        
        totalGamesWon += userScore;
        totalGamesPlayed += (userScore + oppScore);

        (m.match_games || []).forEach((g: any) => {
          const userPoints = isP1 ? Number(g.p1_score) : Number(g.p2_score);
          const oppPoints = isP1 ? Number(g.p2_score) : Number(g.p1_score);
          totalPointsScored += userPoints;
          totalPointsLost += oppPoints;
          totalPointsPlayed += (userPoints + oppPoints);
        });
      });

      // Calculate recent performance for the chart (last 10 matches)
      const recentPerformance = filtered.slice(0, 10).map((m: any) => {
        const isP1 = m.player1_id === currentUser.id;
        const userScore = Number(isP1 ? m.score1 : m.score2) || 0;
        const oppScore = Number(isP1 ? m.score2 : m.score1) || 0;
        
        let matchPointsWon = 0;
        let matchPointsTotal = 0;
        (m.match_games || []).forEach((g: any) => {
          const uP = isP1 ? Number(g.p1_score) : Number(g.p2_score);
          const oP = isP1 ? Number(g.p2_score) : Number(g.p1_score);
          matchPointsWon += uP;
          matchPointsTotal += (uP + oP);
        });

        const matchPointWinRate = matchPointsTotal > 0 ? (matchPointsWon / matchPointsTotal) * 100 : 0;

        return {
          userScore,
          oppScore,
          matchPointWinRate: isNaN(matchPointWinRate) ? 0 : matchPointWinRate,
          win: userScore > oppScore
        };
      }).reverse();

      // Calculate stats per sparing partner
      const oppStatsObj: any = {};
      allMatches.forEach((m: any) => {
        const isP1 = m.player1_id === currentUser.id;
        const opponent = isP1 ? m.player2 : m.player1;
        if (!opponent) return;

        if (!oppStatsObj[opponent.id]) {
          oppStatsObj[opponent.id] = { 
            name: opponent.nickname, 
            avatar: opponent.avatar_url,
            won: 0, 
            total: 0, 
            lastPlayed: m.timestamp 
          };
        }

        if (new Date(m.timestamp) > new Date(oppStatsObj[opponent.id].lastPlayed)) {
          oppStatsObj[opponent.id].lastPlayed = m.timestamp;
        }

        (m.match_games || []).forEach((g: any) => {
          const uP = isP1 ? Number(g.p1_score) : Number(g.p2_score);
          const oP = isP1 ? Number(g.p2_score) : Number(g.p1_score);
          oppStatsObj[opponent.id].won += uP;
          oppStatsObj[opponent.id].total += (uP + oP);
        });
      });

      const vsOpponents = Object.values(oppStatsObj)
        .sort((a: any, b: any) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
        .slice(0, 4)
        .map((o: any) => ({
          name: o.name,
          avatar: o.avatar,
          rate: o.total > 0 ? Math.round((o.won / o.total) * 100) : 0
        }));

      setStats({
        total: filtered.length,
        wins,
        losses,
        draws,
        winRate: Math.round((wins / filtered.length) * 100),
        gameWinRate: totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 100) : 0,
        pointsWinRate: totalPointsPlayed > 0 ? Math.round((totalPointsScored / totalPointsPlayed) * 100) : 0,
        pointsWon: totalPointsScored,
        pointsLost: totalPointsLost,
        pointsBalance: totalPointsScored - totalPointsLost,
        vsOpponents,
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
          {(['all', 'year', 'month', 'week'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${
                timeFilter === filter ? 'text-background' : 'text-muted hover:text-foreground'
              }`}
            >
              {filter === 'all' ? t.stats.filterAll : 
               filter === 'year' ? t.stats.filterYear : 
               filter === 'month' ? t.stats.filterMonth : 
               t.stats.filterWeek}
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
          <span className="text-[11px] font-black uppercase tracking-widest text-muted px-2">Przeciwnik</span>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
            <button
              onClick={() => setSelectedOpponentId('all')}
              className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
                selectedOpponentId === 'all' ? 'scale-110' : 'opacity-40 grayscale'
              }`}
            >
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
                selectedOpponentId === 'all' ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">Wszyscy</span>
            </button>
            {opponents.map((opp) => (
              <button
                key={opp.id}
                onClick={() => setSelectedOpponentId(opp.id)}
                className={`flex flex-col items-center gap-2 min-w-[60px] transition-all ${
                  selectedOpponentId === opp.id ? 'scale-110' : 'opacity-40 grayscale'
                }`}
              >
                <div className={`w-14 h-14 rounded-full border-2 overflow-hidden ${
                  selectedOpponentId === opp.id ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5'
                }`}>
                  {opp.avatar_url ? (
                    <img src={opp.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-sm">{opp.nickname[0]}</div>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter truncate w-full text-center">{opp.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Medals */}
      {(medals.gold > 0 || medals.silver > 0 || medals.bronze >= 0) && (
        <div className="flex gap-3">
          <div className="flex-1 card py-3 bg-yellow-400/5 border-yellow-400/10 flex flex-col items-center justify-center gap-1">
            <span className="text-xl">🥇</span>
            <span className="text-lg font-black text-yellow-500 font-barlow-condensed leading-none">{medals.gold}</span>
          </div>
          <div className="flex-1 card py-3 bg-zinc-400/5 border-zinc-400/10 flex flex-col items-center justify-center gap-1">
            <span className="text-xl">🥈</span>
            <span className="text-lg font-black text-zinc-300 font-barlow-condensed leading-none">{medals.silver}</span>
          </div>
          <div className="flex-1 card py-3 bg-orange-400/5 border-orange-400/10 flex flex-col items-center justify-center gap-1">
            <span className="text-xl">🥉</span>
            <span className="text-lg font-black text-orange-400 font-barlow-condensed leading-none">{medals.bronze}</span>
          </div>
        </div>
      )}

      {/* Matches Summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.common.matches}
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 card py-2.5 bg-green-500/5 border-green-500/10 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-green-500/60 leading-tight">{t.stats.wins}</span>
            <span className="text-lg font-bold text-green-500 font-barlow-condensed leading-none">{stats.wins}</span>
          </div>
          <div className="flex-1 card py-2.5 bg-red-500/5 border-red-500/10 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500/60 leading-tight">{t.stats.losses}</span>
            <span className="text-lg font-bold text-red-500 font-barlow-condensed leading-none">{stats.losses}</span>
          </div>
          <div className="flex-1 card py-2.5 bg-white/5 border-white/5 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">{t.stats.draws}</span>
            <span className="text-lg font-bold text-foreground font-barlow-condensed leading-none">{stats.draws}</span>
          </div>
        </div>
      </div>

      {/* Points Summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2">
          <Target className="w-5 h-5 text-secondary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.pointsWinRate}
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 card py-2.5 bg-white/5 border-white/5 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">{t.stats.pointsWon}</span>
            <span className="text-lg font-bold text-foreground font-barlow-condensed leading-none">{stats.pointsWon}</span>
          </div>
          <div className="flex-1 card py-2.5 bg-white/5 border-white/5 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">{t.stats.pointsLost}</span>
            <span className="text-lg font-bold text-foreground font-barlow-condensed leading-none">{stats.pointsLost}</span>
          </div>
          <div className="flex-1 card py-2.5 bg-secondary/5 border-secondary/10 flex flex-col items-center justify-center gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-secondary/60 leading-tight">{t.stats.pointsBalance}</span>
            <span className="text-lg font-bold text-secondary font-barlow-condensed leading-none">{stats.pointsBalance > 0 ? `+${stats.pointsBalance}` : stats.pointsBalance}</span>
          </div>
        </div>
      </div>

      {/* Efficiency Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.winRate}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 bg-primary/5 border-primary/10 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">MECZE</span>
            <span className="text-2xl font-black italic tracking-tighter text-primary font-barlow-condensed leading-none">{stats.winRate}%</span>
          </div>
          <div className="card p-4 bg-secondary/5 border-secondary/10 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">SETY</span>
            <span className="text-2xl font-black italic tracking-tighter text-secondary font-barlow-condensed leading-none">{stats.gameWinRate}%</span>
          </div>
          <div className="card p-4 bg-accent/5 border-accent/10 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">PUNKTY</span>
            <span className="text-2xl font-black italic tracking-tighter text-accent font-barlow-condensed leading-none">{stats.pointsWinRate}%</span>
          </div>
        </div>
      </section>



      {/* Recent Trend Chart (Line Chart) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.pointsWinRate}
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
              
              {(() => {
                const data = stats.recentPerformance;
                if (data.length === 0) return null;
                
                const rates = data.map((d: any) => Number(d.matchPointWinRate) || 0);
                const rawMin = Math.min(...rates);
                const rawMax = Math.max(...rates);
                
                // Scale range: min rounded down, max rounded up, with a bit of buffer
                const minY = Math.max(0, Math.floor(rawMin / 5) * 5 - 5);
                const maxY = Math.min(100, Math.ceil(rawMax / 5) * 5 + 5);
                const rangeY = maxY - minY || 1;

                // Dynamic grid lines (4 positions)
                const gridSteps = [minY, minY + (rangeY * 0.33), minY + (rangeY * 0.66), maxY];

                const points = data.map((d: any, i: number) => {
                  const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                  const pointRate = Number(d.matchPointWinRate) || 0;
                  const y = 40 - ((pointRate - minY) / rangeY) * 40; 
                  return `${x},${y}`;
                });
                const pathData = `M ${points.join(' L ')}`;
                const areaData = `${pathData} L 100,40 L 0,40 Z`;

                return (
                  <>
                    {/* Dynamic Y-Axis Labels and Grid Lines */}
                    {gridSteps.map((val) => {
                      const y = 40 - ((val - minY) / rangeY) * 40;
                      return (
                        <g key={val} className="text-white/20">
                          <text 
                            x="-10" 
                            y={y} 
                            className="fill-white/30 text-[4px] font-bold" 
                            dominantBaseline="middle"
                          >
                            {Math.round(val)}%
                          </text>
                          <line x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.1" strokeDasharray="1,1" />
                        </g>
                      );
                    })}

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
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Data Points */}
                    {points.map((p: string, i: number) => {
                      const [px, py] = p.split(',').map(Number);
                      return (
                        <motion.circle
                          key={i}
                          cx={px}
                          cy={py}
                          r="1.2"
                          className={data[i].win ? "fill-primary" : "fill-red-500"}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + i * 0.1 }}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
          
          <div className="flex justify-between mt-4 px-1">
             <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{stats.recentPerformance.length > 0 ? "Starsze" : ""}</span>
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-black italic">Ostatnie</span>
          </div>
        </div>
      </section>

      {/* VS Sparing Partners Bar Chart */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.vsSparingPartners}
          </h2>
        </div>
        <div className="card p-6 bg-accent/5 border-white/5 relative h-60 flex items-end justify-around pt-12">
          {stats.vsOpponents.map((opp: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <div className="flex-1 w-full flex flex-col items-center justify-end relative px-1">
                 <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${opp.rate}%` }}
                   transition={{ duration: 1, delay: i * 0.1 }}
                    className={`w-6 sm:w-8 rounded-t-sm relative transition-all min-h-[4px] shadow-sm ${
                      opp.rate >= 50 ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                 >
                   <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-black font-barlow-condensed text-foreground whitespace-nowrap">
                      {opp.rate}%
                   </span>
                 </motion.div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white/10 overflow-hidden bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center shrink-0 shadow-lg">
                {opp.avatar ? (
                  <img src={opp.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent/20">
                     <span className="text-[11px] font-black text-foreground drop-shadow-sm">{opp.name ? opp.name[0] : '?'}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase truncate max-w-[64px] text-center text-muted group-hover:text-foreground transition-colors pt-1">
                {opp.name}
              </span>
            </div>
          ))}
          {stats.vsOpponents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center italic text-muted text-sm px-6 text-center">
               Więcej rozegranych meczów pokaże tu Twoich partnerów.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
