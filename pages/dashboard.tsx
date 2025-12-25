import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import {
    IoStatsChartOutline,
    IoShieldCheckmarkOutline,
    IoSpeedometerOutline,
    IoFootballOutline,
    IoPulseOutline,
    IoDiamondOutline,
    IoLogOutOutline,
    IoArrowForwardOutline,
    IoChevronForwardOutline,
    IoRocketOutline,
} from 'react-icons/io5';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import type { Prediction } from '@/lib/schemas';

export default function DashboardPage() {
    const router = useRouter();
    const { user, signOut, loading: authLoading } = useAuth();
    const [realPredictions, setRealPredictions] = useState<Prediction[]>([]);
    const [stats, setStats] = useState({
        todayCount: 0,
        avgConfidence: 0,
        markets: 0,
        lastUpdate: 'Just Now'
    });
    const [loadingData, setLoadingData] = useState(true);

    const getConfidenceColor = (conf: number) => {
        if (conf >= 90) return 'text-green-500';
        if (conf >= 80) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Convert date to user-friendly label (Today, Tomorrow, Weekend)
    const getMatchDayLabel = (dateStr: string | undefined): string => {
        if (!dateStr || dateStr === 'Today') return 'Today';

        try {
            const matchDate = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchDate.setHours(0, 0, 0, 0);

            const diffTime = matchDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Tomorrow';

            // Check if it's this weekend (Saturday or Sunday)
            const dayOfWeek = matchDate.getDay();
            if (diffDays >= 0 && diffDays <= 7 && (dayOfWeek === 0 || dayOfWeek === 6)) {
                return 'Weekend';
            }

            // For other dates, show the actual date
            return dateStr;
        } catch {
            return dateStr || 'Scheduled';
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/auth/login');
            return;
        }

        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Fetch History for Stats and Active items
                const { data: history, error } = await supabase
                    .from('history')
                    .select('*')
                    .order('date', { ascending: false });

                if (error) throw error;

                // Normalize and Extract Pending Predictions from History
                const pendingFromHistory: any[] = [];
                history?.forEach(record => {
                    record.predictions?.forEach((p: any) => {
                        if (p.result === 'Pending' || !p.result) {
                            pendingFromHistory.push({
                                ...p,
                                // Normalize legacy field names to current format
                                team1: p.homeTeam,
                                team2: p.awayTeam,
                                betType: p.prediction,
                                confidence: p.confidence || 75,
                                league: p.league,
                                // Use the history record date as the primary source
                                displayDate: record.date
                            });
                        }
                    });
                });

                // Get Session Predictions (immediate context)
                const stored = sessionStorage.getItem('predictions');
                let sessionPreds: any[] = [];
                if (stored && stored !== 'undefined') {
                    sessionPreds = JSON.parse(stored).map((p: any) => ({
                        ...p,
                        displayDate: p.matchTime?.split('T')[0] || p.matchTime?.split(' ')[0] || 'Today'
                    }));
                }

                // Combine sources, prioritizing history (persisted) then session
                // Use a Map to prevent duplicates by match ID or teams
                const combinedMap = new Map();
                [...pendingFromHistory, ...sessionPreds].forEach(p => {
                    const key = `${p.team1}-${p.team2}`;
                    if (!combinedMap.has(key)) {
                        combinedMap.set(key, p);
                    }
                });

                const finalActive = Array.from(combinedMap.values());
                setRealPredictions(finalActive);

                // Process Stats
                const todayStr = new Date().toISOString().split('T')[0];
                const todayRecord = history?.find((h: any) => h.date === todayStr);
                const todayCountFromHistory = todayRecord?.predictions?.length || 0;

                const finalTodayCount = Math.max(todayCountFromHistory, sessionPreds.length);

                let avgConf = 0;
                if (finalActive.length > 0) {
                    avgConf = Math.round(finalActive.reduce((acc, p) => acc + (p.confidence || 0), 0) / finalActive.length);
                } else if (history && history.length > 0) {
                    avgConf = 75;
                }

                const leagues = new Set<string>();
                finalActive.forEach(p => leagues.add(p.league));
                history?.slice(0, 5).forEach((h: any) => {
                    h.predictions?.forEach((p: any) => leagues.add(p.league));
                });

                const lastUpdate = history && history.length > 0
                    ? new Date(history[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Just Now';

                setStats({
                    todayCount: finalTodayCount,
                    avgConfidence: avgConf,
                    markets: leagues.size || 5,
                    lastUpdate: lastUpdate
                });

            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [user, authLoading]);

    if (authLoading || loadingData) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
    );

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Jay';

    const statCards = [
        { title: "Predictions Today", value: stats.todayCount > 0 ? stats.todayCount.toString() : "0", icon: IoFootballOutline },
        { title: "Avg Confidence", value: stats.avgConfidence > 0 ? `${stats.avgConfidence}%` : "---", icon: IoPulseOutline },
        { title: "Markets Covered", value: `${stats.markets} Leagues`, icon: IoStatsChartOutline },
        { title: "Last Engine Update", value: stats.lastUpdate, icon: IoSpeedometerOutline }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <Head>
                <title>Dashboard | SafeScore - Prediction Intelligence</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>

            {/* Sidebar */}
            <aside className="hidden md:flex w-64 bg-[#0a0a0a] border-r border-white/5 flex-col p-6 space-y-8 shrink-0">
                <div className="flex items-center gap-3">
                    <img src="/logos.png" alt="SafeScore" className="h-8" />
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-500 rounded-xl font-bold transition-all border border-blue-500/20">
                        <IoStatsChartOutline size={20} />
                        Overview
                    </Link>
                    <Link href="/home" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all group">
                        <IoFootballOutline size={20} className="group-hover:text-blue-500 transition-colors" />
                        Predictions
                    </Link>
                    <Link href="/previous-matches" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-all group">
                        <IoPulseOutline size={20} className="group-hover:text-blue-500 transition-colors" />
                        Previous Matches
                    </Link>
                </nav>

                <div className="pt-6 border-t border-white/5 space-y-3">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 w-full text-neutral-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl font-medium transition-all group"
                    >
                        <IoLogOutOutline size={20} className="group-hover:translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Nav Top */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <img src="/logos.png" alt="SafeScore" className="h-6" />
                <button onClick={() => signOut()} className="text-neutral-400 hover:text-red-400 transition-colors">
                    <IoLogOutOutline size={24} />
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-6 md:p-12 pb-24 md:pb-12">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Header */}
                    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl md:text-5xl font-extrabold tracking-tight"
                            >
                                Welcome back, <span className="text-blue-500">{userName}</span>
                            </motion.h1>
                            <p className="max-w-xl text-neutral-500 text-lg mt-4 font-medium leading-relaxed">
                                Your centralized hub for football predictions, confidence tiers, and performance insights.
                                <span className="block mt-2 text-sm opacity-80 italic">
                                    All predictions are generated using SafeScore’s proprietary engine and updated continuously based on live data signals.
                                </span>
                            </p>
                        </div>
                        <div className="flex ">
                            <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2 backdrop-blur-md">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] md:text-xs font-bold text-green-500 uppercase tracking-widest">Engine Online</span>
                            </div>

                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                                <stat.icon className="text-neutral-600 group-hover:text-blue-500 transition-colors mb-6" size={28} />
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{stat.title}</p>
                                <p className="text-3xl font-black">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Predictions Feed & Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Predictions Feed */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    <IoFootballOutline className="text-blue-500" />
                                    Active Predictions
                                </h3>
                                <Link href="/home" className="text-blue-500 cursor-pointer hover:text-blue-400 font-bold text-sm underline underline-offset-8 transition-all flex items-center gap-1 group">
                                    View All
                                    <IoChevronForwardOutline className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                            {realPredictions.length > 0 ? (
                                <div className="space-y-4">
                                    {realPredictions.slice(0, 5).map((p, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                            className="p-6 bg-[#0c0c0c] border border-white/5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:bg-white/[0.03] transition-all relative overflow-hidden"
                                        >
                                            <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="space-y-1 relative z-10">
                                                <p className="font-bold text-xl group-hover:text-blue-400 transition-colors tracking-tight">{p.team1} vs {p.team2}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{p.league || 'General'}</span>
                                                    <span className="w-1.5 h-1.5 bg-blue-500/20 rounded-full" />
                                                    <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">
                                                        {getMatchDayLabel((p as any).displayDate)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-6 items-center relative z-10">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Pick</p>
                                                    <p className="font-black text-lg text-white leading-none">{p.betType}</p>
                                                </div>
                                                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                                                <div className="text-left sm:text-right">
                                                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Confidence</p>
                                                    <p className={`font-black uppercase text-xs tracking-widest ${getConfidenceColor(p.confidence)}`}>{p.confidence}%</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-12 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] text-center space-y-6"
                                >
                                    <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                                        <IoRocketOutline className="text-blue-500 text-3xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold">No Active Predictions</h4>
                                        <p className="text-neutral-500 mt-2">Generate your first high-probability picks to see them here.</p>
                                    </div>
                                    <Link href="/home">
                                        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all flex items-center gap-3 mx-auto cursor-pointer">
                                            Launch Engine
                                            <IoArrowForwardOutline />
                                        </button>
                                    </Link>
                                </motion.div>
                            )}
                        </div>

                        {/* Tiers & Info */}
                        <div className="space-y-6">
                            {/* Confidence Tiers */}
                            <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] space-y-6 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                                <h4 className="text-xl font-bold flex items-center gap-3 relative z-10">
                                    <IoShieldCheckmarkOutline className="text-blue-500" />
                                    Confidence Tiers
                                </h4>
                                <div className="space-y-5 relative z-10">
                                    <div className="flex gap-4 items-start group">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        <div>
                                            <p className="font-bold text-green-500 uppercase tracking-widest text-[10px]">High Confidence (90%+)</p>
                                            <p className="text-neutral-500 text-sm mt-1 leading-relaxed">Strong alignment across multiple performance indicators and historical patterns.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start group">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                        <div>
                                            <p className="font-bold text-yellow-500 uppercase tracking-widest text-[10px]">Medium Confidence (80-89%)</p>
                                            <p className="text-neutral-500 text-sm mt-1 leading-relaxed">Solid probability supported by key metrics, with limited variance signals.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start group">
                                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <div>
                                            <p className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Experimental (&lt; 80%)</p>
                                            <p className="text-neutral-500 text-sm mt-1 leading-relaxed">Emerging patterns or highly volatile match conditions under evaluation.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-white/5 relative z-10">
                                    <p className="text-[10px] text-neutral-600 font-medium leading-relaxed italic">
                                        Confidence tiers are generated by SafeScore’s proprietary engine using real-time performance signals and historical data. They represent probability, not certainty.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Transparency Section */}
                    <footer className="pt-12 pb-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex gap-12">
                            <div>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Engine Core</p>
                                <p className="text-sm font-bold tracking-tight">SafeScore Architecture v1.4</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Global Status</p>
                                <p className="text-sm font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Operational
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.2em]">
                            &copy; 2025 Intelligence Systems
                        </p>
                    </footer>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 flex justify-around p-4 z-50">
                <Link href="/dashboard" className="text-blue-500 flex flex-col items-center gap-1">
                    <IoStatsChartOutline size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dash</span>
                </Link>
                <Link href="/home" className="text-neutral-500 flex flex-col items-center gap-1">
                    <IoFootballOutline size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Picks</span>
                </Link>
                <Link href="/previous-matches" className="text-neutral-500 flex flex-col items-center gap-1">
                    <IoPulseOutline size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Logs</span>
                </Link>
            </div>
        </div>
    );
}