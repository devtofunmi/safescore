import type { NextPage } from 'next';
import SEO from '../components/SEO';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/landing/Footer';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, FaChartLine, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';

// --- Types ---
interface HistoryItem {
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    result: 'Won' | 'Lost' | 'Pending';
    score: string;
    league?: string;
}

interface DailyRecord {
    date: string;
    predictions: HistoryItem[];
}

interface HistoryProps {
    historyData: DailyRecord[];
}

const truncateText = (text: string, length: number = 15) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const PreviousMatches: NextPage<HistoryProps> = ({ historyData }) => {
    // Sort history by date descending
    const sortedHistory = useMemo(() => {
        return [...historyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [historyData]);

    const [history, setHistory] = useState<DailyRecord[]>(sortedHistory);
    const [selectedDate, setSelectedDate] = useState<string>(history[0]?.date || '');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

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

        history.forEach(day => {
            day.predictions.forEach(p => {
                total++;
                if (p.result === 'Won') won++;
                else if (p.result === 'Lost') lost++;
                else pending++;
            });
        });

        const accuracy = total - pending > 0
            ? Math.round((won / (total - pending)) * 100)
            : 0;

        return { total, won, lost, pending, accuracy };
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

            <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
                <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/">
                            <img src="/logos.png" alt="SafeScore" className="h-8 cursor-pointer opacity-90 hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors hidden sm:block">
                                Dashboard
                            </Link>
                            <Link href="/home" className="rounded-full cursor-pointer bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-gray-200 inline-block font-black uppercase tracking-widest">
                                Launch Engine
                            </Link>
                        </div>
                    </div>
                </nav>

                <main className="mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ margin: "-50px" }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Verified <span className="text-blue-400">Previous Matches</span>
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            Full transparency on every prediction. Review our historical performance and see the data behind our accuracy metrics.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                        {[
                            { label: 'Accuracy', val: `${stats.accuracy}%`, icon: FaChartLine, color: 'text-blue-400' },
                            { label: 'Won', val: stats.won, icon: FaCheckCircle, color: 'text-green-500' },
                            { label: 'Lost', val: stats.lost, icon: FaTimesCircle, color: 'text-red-500' },
                            { label: 'Pending', val: stats.pending, icon: FaClock, color: 'text-gray-400' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-[#18181b] border border-white/5 rounded-2xl p-6 text-center shadow-lg"
                            >
                                <div className={`${stat.color} mb-2 flex justify-center`}><stat.icon className="text-2xl" /></div>
                                <div className="text-3xl font-bold mb-1">{stat.val}</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="bg-[#101012] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <div className="border-b border-white/5 p-6 flex flex-wrap gap-4 items-center justify-between relative z-20">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-sm uppercase text-gray-400">Date:</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                        className="flex items-center gap-3 bg-[#18181b] px-5 py-2.5 rounded-xl border border-white/10 text-white font-bold min-w-[180px]"
                                    >
                                        <span className="flex-1 text-left">{selectedDate || 'Choose Date'}</span>
                                        <FaChevronDown className={`text-gray-500 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} size={12} />
                                    </button>

                                    <AnimatePresence>
                                        {isDateDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 mt-2 w-full bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-y-auto max-h-[300px] z-50"
                                            >
                                                {history.map((day) => (
                                                    <button
                                                        key={day.date}
                                                        onClick={() => {
                                                            setSelectedDate(day.date);
                                                            setIsDateDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3 text-sm flex justify-between items-center ${selectedDate === day.date ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`}
                                                    >
                                                        {day.date}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                                <span>{currentRecords.length} Predictions</span>
                                {isRefreshing && (
                                    <span className="flex items-center gap-2 text-blue-400 text-xs animate-pulse">
                                        <FaClock className="animate-spin text-[10px]" /> Syncing...
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
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
                                                <tr className="text-xs text-gray-500 border-b border-white/5">
                                                    <th className="py-4 font-bold uppercase pl-4">Match</th>
                                                    <th className="py-4 font-bold uppercase">Prediction</th>
                                                    <th className="py-4 font-bold uppercase text-center">Result</th>
                                                    <th className="py-4 font-bold uppercase text-right pr-4">Score</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {currentRecords.map((item) => (
                                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="py-4 pl-4 font-medium">
                                                            <span>{truncateText(item.homeTeam)}</span>
                                                            <span className="text-gray-500 px-2">vs</span>
                                                            <span>{truncateText(item.awayTeam)}</span>
                                                        </td>
                                                        <td className="py-4 font-bold text-blue-400">{item.prediction}</td>
                                                        <td className="py-4 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${item.result === 'Won' ? 'bg-green-500/10 text-green-500' : item.result === 'Lost' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                                                {item.result}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 pr-4 text-right font-mono text-gray-300">{item.score}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </motion.div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">No records found.</div>
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
        const { data, error } = await supabase
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