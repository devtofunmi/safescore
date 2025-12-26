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
    IoArrowForwardOutline,
    IoChevronForwardOutline,
    IoRocketOutline,
    IoDiamondOutline,
} from 'react-icons/io5';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import type { Prediction } from '@/lib/schemas';
import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
    const router = useRouter();
    const { user, signOut, loading: authLoading, isPro, isTrialActive, daysRemaining } = useAuth();
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [stats, setStats] = useState({
        todayCount: 0,
        avgConfidence: 0,
        markets: 0,
        lastUpdate: 'Just Now'
    });
    const [loadingData, setLoadingData] = useState(true);

    const getConfidenceColor = (conf: number) => {
        if (conf >= 85) return 'text-green-500';
        if (conf >= 70) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Convert date to user-friendly label (Today, Tomorrow, Weekend)
    const getMatchDayLabel = (dateStr: string | undefined): string => {
        if (!dateStr) return 'Today';

        // Handle pre-formatted strings or session labels
        const lowerStr = dateStr.toLowerCase();
        if (lowerStr.includes('today')) return 'Today';
        if (lowerStr.includes('tomorrow')) return 'Tomorrow';
        if (lowerStr.includes('weekend')) return 'Weekend';

        try {
            // Normalize input to YYYY-MM-DD
            const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];

            // Parse as local components to avoid UTC shifts
            const parts = cleanDateStr.split('-');
            if (parts.length < 3) return dateStr;

            const [y, m, d] = parts.map(Number);
            if (!y || !m || !d) return dateStr;

            const matchDate = new Date(y, m - 1, d); // Months are 0-indexed
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const diffTime = matchDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Tomorrow';

            // Check if it's this upcoming weekend (Saturday or Sunday within next 6 days)
            const dayOfWeek = matchDate.getDay();
            if (diffDays >= 0 && diffDays <= 6 && (dayOfWeek === 0 || dayOfWeek === 6)) {
                return 'Weekend';
            }

            // Fallback: Format as "Oct 27"
            return matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
                // Use local date metrics to avoid UTC alignment issues
                const now = new Date();
                const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const todayMidnight = new Date(todayLocalStr).getTime();

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
                        // STRICT USER FILTERING: Only show items belonging to this specific user.id
                        if ((p.result === 'Pending' || !p.result) && p.userId === user.id) {
                            pendingFromHistory.push({
                                ...p,
                                // Normalize legacy field names to current format
                                team1: p.homeTeam,
                                team2: p.awayTeam,
                                betType: p.prediction,
                                confidence: p.confidence || 75,
                                league: p.league,
                                displayDate: record.date
                            });
                        }
                    });
                });

                // Get Session Predictions (immediate context)
                const stored = sessionStorage.getItem('predictions');
                let sessionPreds: any[] = [];
                if (stored && stored !== 'undefined') {
                    sessionPreds = JSON.parse(stored).map((p: any) => {
                        let mDate = todayLocalStr;
                        if (p.matchTime && p.matchTime.includes('-')) {
                            const datePart = p.matchTime.split('T')[0].split(' ')[0];
                            if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
                                mDate = datePart;
                            }
                        }
                        return {
                            ...p,
                            displayDate: mDate
                        };
                    });
                }

                // Combine and prioritized list
                const combinedMap = new Map();

                // Merge sources: Session (latest) takes priority over History records for today/same teams
                [...sessionPreds, ...pendingFromHistory].forEach(p => {
                    const key = `${p.team1}-${p.team2}`;
                    if (!combinedMap.has(key)) {
                        combinedMap.set(key, p);
                    }
                });

                // Map all items with priority scores
                const allActiveItems = Array.from(combinedMap.values()).map(p => {
                    const targetDate = p.displayDate === 'Today' ? todayLocalStr : p.displayDate;
                    const timestamp = new Date(targetDate).getTime();

                    // Priority: 0 (Today), 1 (Future), 2 (Past Pending)
                    let pScore = 1;
                    if (targetDate === todayLocalStr) pScore = 0;
                    else if (timestamp < todayMidnight) pScore = 2;

                    return { ...p, targetDate, timestamp, pScore };
                });

                // Sort: Today first, then soonest future, then latest past
                let sorted = allActiveItems.sort((a, b) => {
                    if (a.pScore !== b.pScore) return a.pScore - b.pScore;
                    if (a.pScore === 1) return a.timestamp - b.timestamp; // Future: chronological
                    return b.timestamp - a.timestamp; // Today or Past: latest first
                });

                setPredictions(sorted.slice(0, 5)); // Final slice (limit 5)

                // Process Stats - Strictly for current user
                const todayCount = sorted.filter(p => p.targetDate === todayLocalStr).length;

                let avgConf = 0;
                if (allActiveItems.length > 0) {
                    avgConf = Math.round(allActiveItems.reduce((acc, p) => acc + (p.confidence || 0), 0) / allActiveItems.length);
                } else if (history && history.length > 0) {
                    avgConf = 75;
                }

                const leagues = new Set<string>();
                allActiveItems.forEach(p => leagues.add(p.league));

                const lastUpdate = history && history.length > 0
                    ? new Date(history[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Just Now';

                setStats({
                    todayCount: todayCount,
                    avgConfidence: avgConf,
                    markets: leagues.size,
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
        <DashboardLayout>
            <Head>
                <title>Dashboard | SafeScore - Prediction Intelligence</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>
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

                {!isPro && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm relative overflow-hidden group shadow-2xl shadow-blue-600/5"
                    >
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black mb-3 flex items-center gap-3 text-white">
                                <span className="bg-blue-500/20 p-2 rounded-xl text-blue-500">
                                    <IoDiamondOutline size={28} className="animate-pulse" />
                                </span>
                                Upgrade to SafeScore Pro
                            </h2>
                            <p className="text-neutral-400 font-medium max-w-xl text-lg">
                                Unlock unlimited daily predictions, full AI analysis for every match, and exclusive high-confidence signals.
                            </p>
                        </div>
                        <Link
                            href="/pricing"
                            className="relative z-10 bg-white hover:bg-zinc-200 transition-all hover:scale-105 text-black px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 group/btn whitespace-nowrap"
                        >
                            Get Unlimited Access
                            <IoChevronForwardOutline className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>

                        {/* Background Accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    </motion.div>
                )}

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
                        {predictions.length > 0 ? (
                            <div className="space-y-4">
                                {predictions.slice(0, 5).map((p, i) => (
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
                                        <p className="font-bold text-green-500 uppercase tracking-widest text-[10px]">Very Safe (85%+)</p>
                                        <p className="text-neutral-500 text-sm mt-1 leading-relaxed">High alignment across multiple performance indicators and historical patterns. Requires near-perfect data and a clear score advantage.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                    <div>
                                        <p className="font-bold text-yellow-500 uppercase tracking-widest text-[10px]">Safe (70-84%)</p>
                                        <p className="text-neutral-500 text-sm mt-1 leading-relaxed">Solid probability supported by key metrics, with minor variance factors. Matches are generally favorable but not guaranteed.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start group">
                                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                    <div>
                                        <p className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Medium Safe (50-69%)</p>
                                        <p className="text-neutral-500 text-sm mt-1 leading-relaxed">Emerging patterns, closer match-ups, or volatile conditions under evaluation. Higher uncertainty compared to other tiers.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/5 relative z-10">
                                <p className="text-[10px] text-neutral-600 font-medium leading-relaxed italic">
                                    Confidence tiers are generated by SafeScore’s proprietary engine using real-time match performance signals. Thresholds are designed to reflect statistical backing and risk alignment rather than exact numerical percentages.
                                </p>
                            </div>
                        </div>
                        {/* Match History CTA */}
                        <div className="p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-600/5 transition-colors" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <IoStatsChartOutline className="text-blue-500" />
                                    Performance Log
                                </h3>
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        <p>Engine processed {stats.markets} leagues</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <p>Last Update: {stats.lastUpdate}</p>
                                    </div>
                                </div>
                                <Link href="/previous-matches" className="w-full py-4 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group border border-white/5 hover:border-white/10">
                                    View Previous Matches
                                    <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform opacity-50 group-hover:opacity-100" />
                                </Link>
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
        </DashboardLayout>
    );
}