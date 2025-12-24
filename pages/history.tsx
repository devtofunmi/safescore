import type { NextPage } from 'next';
import SEO from '../components/SEO';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/landing/Footer';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, FaChartLine, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-toastify';

import fs from 'fs';
import path from 'path';

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

const History: NextPage<HistoryProps> = ({ historyData }) => {
    // Sort history by date descending just in case
    const sortedHistory = useMemo(() => {
        return [...historyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [historyData]);

    const [history, setHistory] = useState<DailyRecord[]>(sortedHistory);
    const [selectedDate, setSelectedDate] = useState<string>(history[0]?.date || '');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

    // Auto-refresh logic on mount
    React.useEffect(() => {
        const autoRefresh = async () => {
            setIsRefreshing(true);
            try {
                const res = await fetch('/api/history/verify');
                const data = await res.json();
                if (data.updatedCount > 0) {
                    // Update state instead of reloading if possible, 
                    // or just reload to get fresh getServerSideProps data
                    window.location.reload();
                } else {
                    console.info('Auto-refresh checked: No new results to update.');
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
        // Kept as a helper
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

    // Calculate overall stats
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

    // Filter for currently selected date
    const currentRecords = useMemo(() => {
        return history.find(d => d.date === selectedDate)?.predictions || [];
    }, [history, selectedDate]);

    return (
        <>
            <SEO
                title="Performance History"
                description="Our transparent track record. View historical accuracy and results for football predictions across all supported leagues."
            />

            <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">

                {/* Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/">
                            <img src="/logos.png" alt="SafeScore" className="h-8 cursor-pointer opacity-90 hover:opacity-100 transition-opacity" />
                        </Link>
                        <Link href="/" className="rounded-full cursor-pointer bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-gray-200 inline-block">
                            Back to App
                        </Link>
                    </div>
                </nav>

                <main className="mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">

                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ margin: "-50px" }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Transparent <span className="text-blue-400">Performance</span> Tracking
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            We believe in full transparency. Review our past predictions and accuracy metrics to see exactly how our algorithms are performing.
                        </p>
                    </motion.div>

                    {/* Overall Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                        {[
                            { label: 'Accuracy (Win Rate)', val: `${stats.accuracy}%`, icon: FaChartLine, color: 'text-blue-400' },
                            { label: 'Winning Tips', val: stats.won, icon: FaCheckCircle, color: 'text-green-500' },
                            { label: 'Lost Tips', val: stats.lost, icon: FaTimesCircle, color: 'text-red-500' },
                            { label: 'Pending Results', val: stats.pending, icon: FaClock, color: 'text-gray-400' },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ margin: "-50px" }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="bg-[#18181b] border border-white/5 rounded-2xl p-6 text-center shadow-lg hover:shadow-blue-500/5 transition-all"
                            >
                                <div className={`${stat.color} mb-2 flex justify-center`}><stat.icon className="text-2xl" /></div>
                                <div className="text-3xl font-bold mb-1">{stat.val}</div>
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Daily Breakdown */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ margin: "-50px" }}
                        transition={{ delay: 0.5 }}
                        className="bg-[#101012] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Date Selector */}
                        <div className="border-b border-white/5 p-6 flex flex-wrap gap-4 items-center justify-between relative z-20">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <FaCalendarAlt className="text-blue-400" />
                                    <span className="font-bold text-sm uppercase tracking-wide">Select Date:</span>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                        className="flex items-center gap-3 bg-[#18181b] hover:bg-white/5 transition-all px-5 py-2.5 rounded-xl border border-white/10 text-white font-bold min-w-[180px] hover:border-blue-500/30 group"
                                    >
                                        <span className="flex-1 text-left">{selectedDate || 'Choose Date'}</span>
                                        <FaChevronDown className={`text-gray-500 group-hover:text-blue-400 transition-transform duration-300 ${isDateDropdownOpen ? 'rotate-180' : ''}`} size={12} />
                                    </button>

                                    <AnimatePresence>
                                        {isDateDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto custom-scrollbar backdrop-blur-xl"
                                            >
                                                {history.length > 0 ? history.map((day) => (
                                                    <button
                                                        key={day.date}
                                                        onClick={() => {
                                                            setSelectedDate(day.date);
                                                            setIsDateDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-5 py-3 text-sm font-medium hover:bg-white/5 transition-colors flex justify-between items-center ${selectedDate === day.date ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400 hover:text-white'
                                                            }`}
                                                    >
                                                        {day.date}
                                                        {selectedDate === day.date && <FaCheckCircle className="text-blue-400" size={12} />}
                                                    </button>
                                                )) : (
                                                    <div className="px-5 py-4 text-sm text-gray-500 text-center">No dates found</div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Stats Summary for selected date */}
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                                <span>Showing {currentRecords.length} Predictions</span>
                                {isRefreshing && (
                                    <span className="flex items-center gap-2 text-blue-400 text-xs animate-pulse bg-blue-400/10 px-3 py-1 rounded-full">
                                        <FaClock className="animate-spin text-[10px]" />
                                        Syncing live scores...
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Results List */}
                        <div className="p-6">
                            <AnimatePresence mode="wait">
                                {currentRecords.length > 0 ? (
                                    <motion.div
                                        key={selectedDate}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="overflow-x-auto"
                                    >
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-xs text-gray-500 border-b border-white/5">
                                                    <th className="py-4 font-bold uppercase tracking-wider pl-4">Match</th>
                                                    <th className="py-4 font-bold uppercase tracking-wider">Prediction</th>
                                                    <th className="py-4 font-bold uppercase tracking-wider text-center">Result</th>
                                                    <th className="py-4 font-bold uppercase tracking-wider text-right pr-4">Score</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {currentRecords.map((item, i) => (
                                                    <React.Fragment key={item.id}>
                                                        <tr
                                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                        >
                                                            <td className="py-4 pl-4 font-medium text-white">
                                                                <span title={item.homeTeam}>{truncateText(item.homeTeam)}</span>
                                                                <span className="text-gray-500 px-2">vs</span>
                                                                <span title={item.awayTeam}>{truncateText(item.awayTeam)}</span>
                                                            </td>
                                                            <td className="py-4 font-bold text-blue-400 text-sm sm:text-base">
                                                                {item.prediction}
                                                            </td>
                                                            <td className="py-4 text-center">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${item.result === 'Won' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                    item.result === 'Lost' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                                    }`}>
                                                                    {item.result === 'Won' && <FaCheckCircle />}
                                                                    {item.result === 'Lost' && <FaTimesCircle />}
                                                                    {item.result === 'Pending' && <FaClock />}
                                                                    {item.result}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 pr-4 text-right font-mono text-gray-300">
                                                                {item.score}
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-gray-500"
                                    >
                                        No records found for this date.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                </main>

                <Footer />
            </div >
        </>
    );
};

export async function getServerSideProps() {
    const filePath = path.join(process.cwd(), 'data', 'history.json');
    let historyData: DailyRecord[] = [];

    try {
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf8');
            historyData = JSON.parse(rawData);
        }
    } catch (err) {
        console.error('Error reading history data:', err);
    }

    return {
        props: {
            historyData,
        },
    };
}

export default History;