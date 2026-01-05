import type { NextPage } from 'next';
import SEO from '../components/SEO';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/landing/Footer';
import { useAuth } from '../lib/auth';
import {
    IoStatsChartOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoTimeOutline,
    IoCalendarOutline,
    IoChevronDownOutline,
} from 'react-icons/io5';
import { toast } from 'react-toastify';


// --- Types ---
interface HistoryItem {
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    result: 'Won' | 'Lost' | 'Pending' | 'Postponed';
    score: string;
    league?: string;
    userId?: string;
}

interface DailyRecord {
    date: string;
    predictions: HistoryItem[];
}

interface HistoryProps {
    historyData: DailyRecord[];
}

const truncateText = (text: string, length: number = 10) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatBetType = (betType: string) => {
    if (betType === 'Both Teams to Score: Yes' || betType === 'BTTS: Yes') return 'Both Teams to Score: Yes';
    if (betType === 'Both Teams to Score: No' || betType === 'BTTS: No') return 'Both Teams to Score: No';
    return betType;
};

const PreviousMatches: NextPage<HistoryProps> = ({ historyData }) => {
    const { user } = useAuth(); // Add hook usage
    // Sort history by date descending
    const sortedHistory = useMemo(() => {
        // Public View: Show all completed (non-pending) records regardless of user
        return historyData
            .map(day => ({
                ...day,
                predictions: day.predictions // Show all records including Pending
            }))
            .filter(day => day.predictions.length > 0)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [historyData]);

    const [history, setHistory] = useState<DailyRecord[]>(sortedHistory);
    const [selectedDate, setSelectedDate] = useState<string>(history[0]?.date || '');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

    // Sync history with sortedHistory whenever it updates
    React.useEffect(() => {
        setHistory(sortedHistory);
        // If current selectedDate is not in the new history, or if nothing selected, select first available
        const hasDate = sortedHistory.find(d => d.date === selectedDate);
        if (!hasDate) {
            setSelectedDate(sortedHistory[0]?.date || '');
        }
    }, [sortedHistory, selectedDate]);

    // Auto-refresh logic on mount (Settle pending matches)
    React.useEffect(() => {
        const autoRefresh = async () => {
            setIsRefreshing(true);
            try {
                const res = await fetch('/api/history/verify');
                const data = await res.json();
                if (data.updatedCount > 0) {
                    window.location.reload();
                }
            } catch (err) {
                console.error('Auto-refresh failed:', err);
            } finally {
                setIsRefreshing(false);
            }
        };

        autoRefresh();
    }, []);

    const refreshResults = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/history/verify');
            const data = await res.json();
            if (data.updatedCount > 0) {
                toast.success(`Updated ${data.updatedCount} results.`);
                setTimeout(() => window.location.reload(), 1000);
            } else if (data.isPending) {
                toast.warning(data.status);
            } else {
                toast.info(data.status || 'All results are already up to date.');
            }
        } catch (err) {
            console.error('Refresh failed:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Overall stats calculation
    const stats = useMemo(() => {
        let total = 0;
        let won = 0;
        let lost = 0;
        let pending = 0;
        let postponed = 0;

        history.forEach(day => {
            day.predictions.forEach(p => {
                total++;
                if (p.result === 'Won') won++;
                else if (p.result === 'Lost') lost++;
                else if (p.result === 'Postponed') postponed++;
                else pending++;
            });
        });

        const activeCount = total - pending - postponed;
        const accuracy = activeCount > 0
            ? Math.round((won / activeCount) * 100)
            : 0;

        return { total, won, lost, pending, postponed, accuracy };
    }, [history]);

    const currentRecords = useMemo(() => {
        return history.find(d => d.date === selectedDate)?.predictions || [];
    }, [history, selectedDate]);

    return (
        <>
            <SEO
                title="Previous Matches"
                description="View historical accuracy and results for football predictions across all supported leagues."
            />

            <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 custom-scrollbar">
                <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/">
                            <img src="/logos.png" alt="SafeScore" className="h-8 cursor-pointer opacity-90 hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="flex items-center gap-4">
                            {user && (
                                <>
                                    <Link href="/dashboard" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors hidden sm:block">
                                        Dashboard
                                    </Link>
                                    <Link href="/home" className="rounded-xl cursor-pointer bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-neutral-200 inline-block font-black uppercase tracking-widest">
                                        Launch Engine
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ margin: "-50px" }}
                        className="text-center mb-16 space-y-4"
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                            Verified <span className="text-blue-500">History</span>
                        </h1>
                        <p className="text-neutral-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                            Full transparency on every prediction. Review our historical performance and see the data behind our accuracy metrics.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-16">
                        {[
                            { label: 'Accuracy', val: `${stats.accuracy}%`, icon: IoStatsChartOutline, color: 'text-blue-500' },
                            { label: 'Won', val: stats.won, icon: IoCheckmarkCircleOutline, color: 'text-green-500' },
                            { label: 'Lost', val: stats.lost, icon: IoCloseCircleOutline, color: 'text-red-500' },
                            { label: 'Postponed', val: stats.postponed, icon: IoCalendarOutline, color: 'text-orange-500' },
                            { label: 'Pending', val: stats.pending, icon: IoTimeOutline, color: 'text-neutral-500' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                                <stat.icon className={`text-2xl mb-6 ${stat.color}`} />
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-3xl font-black">{stat.val}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        <div className="border-b border-white/5 p-8 flex flex-wrap gap-6 items-center justify-between relative z-20">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Date</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                        className={`flex items-center gap-3 bg-[#0a0a0a] px-6 py-3 rounded-2xl border transition-all min-w-[200px] group ${isDateDropdownOpen ? 'border-blue-500/50 ring-2 ring-blue-500/10' : 'border-white/10 hover:border-blue-500/30'}`}
                                    >
                                        <IoCalendarOutline className="text-neutral-500 group-hover:text-blue-500 transition-colors" />
                                        <span className="flex-1 text-left text-sm font-bold text-white tracking-wide">{selectedDate || 'Select Date'}</span>
                                        <IoChevronDownOutline className={`text-neutral-500 transition-transform duration-300 ${isDateDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} size={14} />
                                    </button>

                                    <AnimatePresence>
                                        {isDateDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-3 w-full bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[320px] z-50 py-2 custom-scrollbar"
                                            >
                                                {history.map((day) => (
                                                    <button
                                                        key={day.date}
                                                        onClick={() => {
                                                            setSelectedDate(day.date);
                                                            setIsDateDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3 text-sm flex justify-between items-center transition-all group ${selectedDate === day.date
                                                            ? 'text-blue-400 bg-blue-600/10 border-l-2 border-blue-500'
                                                            : 'text-neutral-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                                                            }`}
                                                    >
                                                        <span className="font-bold tracking-wide">{day.date}</span>
                                                        {selectedDate === day.date && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                                <span>{currentRecords.length} Predictions</span>
                                {isRefreshing && (
                                    <span className="flex items-center gap-2 text-blue-500 animate-pulse">
                                        <IoTimeOutline className="animate-spin" /> Syncing...
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 sm:p-8">
                            <AnimatePresence mode="wait">
                                {currentRecords.length > 0 ? (
                                    <motion.div
                                        key={selectedDate}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="overflow-x-auto"
                                    >
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">
                                                    <th className="py-6 pl-6">Match</th>
                                                    <th className="py-6">Prediction</th>
                                                    <th className="py-6 text-center">Result</th>
                                                    <th className="py-6 text-right pr-6">Score</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {currentRecords.map((item) => (
                                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                        <td className="py-6 pl-6">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-bold text-white">
                                                                <span className="group-hover:text-blue-400 transition-colors" title={item.homeTeam}>{truncateText(item.homeTeam)}</span>
                                                                <span className="text-neutral-600 text-[10px] hidden sm:inline">VS</span>
                                                                <span className="sm:hidden text-neutral-600 text-xs">vs</span>
                                                                <span className="group-hover:text-blue-400 transition-colors" title={item.awayTeam}>{truncateText(item.awayTeam)}</span>
                                                            </div>
                                                            <div className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mt-1">{item.league || 'League Match'}</div>
                                                        </td>
                                                        <td className="py-6">
                                                            <span className="font-black text-blue-500">{formatBetType(item.prediction)}</span>
                                                        </td>
                                                        <td className="py-6 text-center">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.result === 'Won' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                item.result === 'Lost' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                    item.result === 'Postponed' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                                        'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                                                }`}>
                                                                {item.result === 'Won' && <IoCheckmarkCircleOutline size={12} />}
                                                                {item.result === 'Lost' && <IoCloseCircleOutline size={12} />}
                                                                {item.result === 'Postponed' && <IoCalendarOutline size={12} />}
                                                                {item.result === 'Pending' && <IoTimeOutline size={12} />}
                                                                {item.result}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 pr-6 text-right font-black text-neutral-300 font-mono tracking-widest">{item.score}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-600">
                                            <IoCalendarOutline size={32} />
                                        </div>
                                        <h3 className="text-white font-bold text-lg">No records found</h3>
                                        <p className="text-neutral-500 text-sm mt-2">There were no predictions generated for this date.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </main>
                <Footer />
            </div>
        </>
    );
};

export async function getServerSideProps() {
    let historyData: DailyRecord[] = [];

    try {
        // Use supabaseAdmin to bypass RLS and fetch GLOBAL history for the public page
        const { supabaseAdmin } = await import('../lib/supabase');
        const { data, error } = await supabaseAdmin
            .from('history')
            .select('*')
            .order('date', { ascending: false });

        if (!error && data) {
            historyData = data;
        }
    } catch (err) {
        console.error('Error fetching history from Supabase:', err);
    }

    return {
        props: {
            historyData,
        },
    };
}

export default PreviousMatches;