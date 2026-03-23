"use client"

import AuthGuard from "@/components/auth/AuthGuard";
import { ChevronLeft, Trophy, Target, TrendingUp, Activity, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [activeHelp, setActiveHelp] = useState<{ title: string; desc: string } | null>(null);
  
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
          
          const oppsMap = new Map();
          matches.forEach(m => {
            const opp = m.player1_id === user.id ? m.player2 : m.player1;
            if (opp && !oppsMap.has(opp.id)) {
              oppsMap.set(opp.id, opp);
            }
          });
          setOpponents(Array.from(oppsMap.values()));
        }

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

    let matchesByTime = [...allMatches];

    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === 'week') cutoff.setDate(now.getDate() - 7);
      if (timeFilter === 'month') cutoff.setMonth(now.getMonth() - 1);
      if (timeFilter === 'year') cutoff.setFullYear(now.getFullYear() - 1);
      
      matchesByTime = matchesByTime.filter(m => new Date(m.timestamp) >= cutoff);
    }

    let filtered = [...matchesByTime];

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

      const scoreDistribution: Record<string, number> = {
        '<-10': 0, '-10/-6': 0, '-5/-1': 0, '0': 0, '1/5': 0, '6/10': 0, '>10': 0
      };

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
          
          const diff = userPoints - oppPoints;
          if (diff <= -11) scoreDistribution['<-10']++;
          else if (diff <= -6) scoreDistribution['-10/-6']++;
          else if (diff <= -1) scoreDistribution['-5/-1']++;
          else if (diff === 0) scoreDistribution['0']++;
          else if (diff >= 1 && diff <= 5) scoreDistribution['1/5']++;
          else if (diff >= 6 && diff <= 10) scoreDistribution['6/10']++;
          else if (diff >= 11) scoreDistribution['>10']++;
        });
      });

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

      const oppStatsObj: any = {};
      matchesByTime.forEach((m: any) => {
        const isP1 = m.player1_id === currentUser.id;
        const opponent = isP1 ? m.player2 : m.player1;
        if (!opponent) return;

        if (!oppStatsObj[opponent.id]) {
          oppStatsObj[opponent.id] = { 
            id: opponent.id,
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

      let sortedOpps = Object.values(oppStatsObj)
        .sort((a: any, b: any) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());
      
      let finalDisplaySet = [];

      if (selectedOpponentId === 'all') {
        finalDisplaySet = sortedOpps.slice(0, 4);
      } else {
        const selectedOpp = sortedOpps.find((o: any) => o.id === selectedOpponentId);
        const others = sortedOpps.filter((o: any) => o.id !== selectedOpponentId);
        if (selectedOpp) finalDisplaySet.push(selectedOpp);
        finalDisplaySet.push(...others.slice(0, 3));
      }

      const vsOpponents = finalDisplaySet.map((o: any) => ({
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
        recentPerformance,
        scoreDistribution: [
          { label: '<-10', count: scoreDistribution['<-10'], color: 'var(--secondary)' },
          { label: '-10/-6', count: scoreDistribution['-10/-6'], color: 'var(--secondary)' },
          { label: '-5/-1', count: scoreDistribution['-5/-1'], color: 'var(--secondary)' },
          { label: '0', count: scoreDistribution['0'], color: 'var(--muted)' },
          { label: '1/5', count: scoreDistribution['1/5'], color: 'var(--primary)' },
          { label: '6/10', count: scoreDistribution['6/10'], color: 'var(--primary)' },
          { label: '>10', count: scoreDistribution['>10'], color: 'var(--primary)' }
        ]
      });
    } else {
      setStats(null);
    }
  }, [allMatches, timeFilter, selectedOpponentId, currentUser]);

  if (loading) return <Preloader />;

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

  return (
    <div className="flex flex-col gap-8 pb-32 max-w-md mx-auto min-h-screen p-4">
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

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted px-2">{t.stats.opponent}</span>
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
              <span className="text-[10px] font-bold uppercase tracking-tighter text-center">{t.stats.filterAll}</span>
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
        <div className="flex items-center px-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.common.matches}
          </h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveHelp({ title: t.stats.wins, desc: t.stats.help.wins })}
            className="flex-1 card py-2.5 bg-green-500/5 border-green-500/10 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-green-500/60 leading-tight">{t.stats.wins}</span>
            <span className="text-lg font-bold text-green-500 font-barlow-condensed leading-none">{stats.wins}</span>
          </button>
          <button 
            onClick={() => setActiveHelp({ title: t.stats.losses, desc: t.stats.help.losses })}
            className="flex-1 card py-2.5 bg-red-500/5 border-red-500/10 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500/60 leading-tight">{t.stats.losses}</span>
            <span className="text-lg font-bold text-red-500 font-barlow-condensed leading-none">{stats.losses}</span>
          </button>
          <button 
            onClick={() => setActiveHelp({ title: t.stats.draws, desc: t.stats.help.draws })}
            className="flex-1 card py-2.5 bg-white/5 border-white/5 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">{t.stats.draws}</span>
            <span className="text-lg font-bold text-foreground font-barlow-condensed leading-none">{stats.draws}</span>
          </button>
        </div>
      </div>

      {/* Points Summary */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center px-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.points}
          </h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveHelp({ title: t.stats.pointsWon, desc: t.stats.help.pointsWon })}
            className="flex-1 card py-2.5 bg-white/5 border-white/5 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">{t.stats.pointsWon}</span>
            <span className="text-lg font-bold text-foreground font-barlow-condensed leading-none">{stats.pointsWon}</span>
          </button>
          <button 
            onClick={() => setActiveHelp({ title: t.stats.pointsLost, desc: t.stats.help.pointsLost })}
            className="flex-1 card py-2.5 bg-white/5 border-white/5 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-muted leading-tight">{t.stats.pointsLost}</span>
            <span className="text-lg font-bold text-foreground font-barlow-condensed leading-none">{stats.pointsLost}</span>
          </button>
          <button 
            onClick={() => setActiveHelp({ title: t.stats.pointsBalance, desc: t.stats.help.pointsBalance })}
            className="flex-1 card py-2.5 bg-secondary/5 border-secondary/10 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-secondary/60 leading-tight">{t.stats.pointsBalance}</span>
            <span className="text-lg font-bold text-secondary font-barlow-condensed leading-none">{stats.pointsBalance > 0 ? `+${stats.pointsBalance}` : stats.pointsBalance}</span>
          </button>
        </div>
      </div>

      {/* Efficiency Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center px-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.winRate}
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setActiveHelp({ title: t.stats.winRate, desc: t.stats.help.winRateMatches })}
            className="card p-4 bg-primary/5 border-primary/10 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{t.common.matches}</span>
            <span className="text-2xl font-black italic tracking-tighter text-primary font-barlow-condensed leading-none">{stats.winRate}%</span>
          </button>
          <button 
            onClick={() => setActiveHelp({ title: t.stats.sets + " (" + t.stats.winRate + ")", desc: t.stats.help.winRateSets })}
            className="card p-4 bg-secondary/5 border-secondary/10 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{t.stats.sets}</span>
            <span className="text-2xl font-black italic tracking-tighter text-secondary font-barlow-condensed leading-none">{stats.gameWinRate}%</span>
          </button>
          <button 
            onClick={() => setActiveHelp({ title: t.stats.points + " (" + t.stats.winRate + ")", desc: t.stats.help.winRatePoints })}
            className="card p-4 bg-accent/5 border-accent/10 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">{t.stats.points}</span>
            <span className="text-2xl font-black italic tracking-tighter text-accent font-barlow-condensed leading-none">{stats.pointsWinRate}%</span>
          </button>
        </div>
      </section>

      {/* Recent Trend Chart */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center px-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.performance}
          </h2>
        </div>
        <button 
          onClick={() => setActiveHelp({ title: t.stats.performance, desc: t.stats.help.recentTrend })}
          className="card p-6 bg-accent/10 border-white/5 relative overflow-hidden group text-left active:scale-[0.98] transition-transform"
        >
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
                const minY = Math.max(0, Math.floor(rawMin / 5) * 5 - 5);
                const maxY = Math.min(100, Math.ceil(rawMax / 5) * 5 + 5);
                const rangeY = maxY - minY || 1;
                const gridSteps = [minY, minY + (rangeY * 0.33), minY + (rangeY * 0.66), maxY];

                const points = data.map((d: any, i: number) => {
                  const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
                  const pointRate = Number(d.matchPointWinRate) || 0;
                  const y = 40 - ((pointRate - minY) / rangeY) * 40; 
                  return `${x},${y}`;
                });
                
                const pathData = data.length > 1 
                  ? `M ${points.join(' L ')}` 
                  : `M 0,${points[0] ? points[0].split(',')[1] : 20} L 100,${points[0] ? points[0].split(',')[1] : 20}`;
                const areaData = `${pathData} L 100,40 L 0,40 Z`;

                return (
                  <>
                    {gridSteps.map((val) => {
                      const y = 40 - ((val - minY) / rangeY) * 40;
                      return (
                        <g key={val} className="text-white/20">
                          <text x="-10" y={y} className="fill-white/30 text-[4px] font-bold" dominantBaseline="middle">{Math.round(val)}%</text>
                          <line x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.1" strokeDasharray="1,1" />
                        </g>
                      );
                    })}
                    {areaData && (
                      <motion.path
                        d={areaData} fill="url(#lineGradient)"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                    <motion.path
                      d={pathData} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    {points.map((p: string, i: number) => {
                      const [px, py] = p.split(',').map(Number);
                      return (
                        <motion.circle
                          key={i} cx={px} cy={py} r="1.2"
                          className={data[i].win ? "fill-[var(--primary)]" : "fill-[var(--secondary)]"}
                          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.1 }}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="flex justify-between mt-4 px-1 text-[10px] font-bold uppercase tracking-widest">
            <span className="text-muted">{stats.recentPerformance.length > 0 ? t.stats.older : ""}</span>
            <span className="text-primary font-black italic">{t.stats.recent}</span>
          </div>
        </button>
      </section>

      {/* VS Sparing Partners */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center px-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.vsSparingPartners}
          </h2>
        </div>
        <button 
          onClick={() => setActiveHelp({ title: t.stats.vsSparingPartners, desc: t.stats.help.vsSparingPartners })}
          className="card px-4 bg-accent/5 border-white/5 relative h-80 flex items-end justify-around pb-8 pt-10 text-left active:scale-[0.98] transition-transform"
        >
          {stats.vsOpponents.length > 0 ? (
            stats.vsOpponents.map((opp: any, i: number) => {
              const displayHeight = (opp.rate * 0.8) + 15;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="flex-1 w-full flex flex-col items-center justify-end relative px-1">
                    <motion.div 
                      initial={{ height: 0 }} animate={{ height: `${displayHeight}%` }}
                      style={{ backgroundColor: opp.rate >= 50 ? 'var(--primary)' : 'var(--secondary)' }}
                      className="w-8 sm:w-10 rounded-t-sm relative transition-all min-h-[4px]"
                    >
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[12px] font-black font-barlow-condensed text-foreground">{opp.rate}%</span>
                    </motion.div>
                  </div>
                  <div className="w-9 h-9 rounded-full border-2 border-white/10 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                    {opp.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : <span className="text-[12px] font-black">{opp.name[0]}</span>}
                  </div>
                  <span className="text-[11px] font-bold uppercase truncate max-w-[70px] text-center text-muted">{opp.name}</span>
                </div>
              );
            })
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <span className="text-muted text-[11px] font-bold uppercase tracking-widest">{t.stats.moreMatchesForPartners}</span>
            </div>
          )}
        </button>
      </section>

      {/* Point Distribution */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center px-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted uppercase">
            {t.stats.pointsDistribution}
          </h2>
        </div>
        <button 
          onClick={() => setActiveHelp({ title: t.stats.pointsDistribution, desc: t.stats.help.pointsDistribution })}
          className="card px-4 bg-white/5 border-white/5 relative h-[340px] flex flex-col pt-12 pb-6 text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex-1 flex items-end justify-around">
            {stats.scoreDistribution.some((d: any) => d.count > 0) ? (
              stats.scoreDistribution.map((bucket: any, i: number) => {
                const maxCount = Math.max(...stats.scoreDistribution.map((d: any) => d.count), 1);
                const displayHeight = (bucket.count / maxCount) * 80 + 2; 
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end relative">
                    <div className="flex-1 w-full flex flex-col items-center justify-end relative px-0.5">
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: `${displayHeight}%` }}
                        style={{ backgroundColor: bucket.count > 0 ? bucket.color : 'transparent', borderTop: bucket.count === 0 ? '1px dashed var(--border)' : 'none' }}
                        className="w-full max-w-[32px] rounded-t-sm relative"
                      >
                        {bucket.count > 0 && <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[12px] font-black">{bucket.count}</span>}
                      </motion.div>
                    </div>
                    <span className="text-[11px] font-black uppercase text-muted whitespace-nowrap">{bucket.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center pt-20">
                <span className="text-muted text-[11px] font-bold uppercase tracking-widest">{t.stats.noDistributionData}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4 px-1 text-[10px] font-bold uppercase tracking-widest">
            <span className="text-muted">{t.stats.losses}</span>
            <span className="text-primary font-black">{t.stats.wins}</span>
          </div>
        </button>
      </section>

      {/* Help Modal */}
      <AnimatePresence>
        {activeHelp && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-20 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" 
              onClick={() => setActiveHelp(null)} 
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div className="flex flex-col gap-4">
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-2" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">{activeHelp.title}</h3>
                <p className="text-muted text-sm font-medium leading-relaxed">{activeHelp.desc}</p>
                <button 
                  onClick={() => setActiveHelp(null)} 
                  className="btn-primary mt-4 w-full py-4 text-sm font-black uppercase tracking-widest active:scale-95 transition-transform"
                >
                  {t.common.understand}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
