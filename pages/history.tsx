import type { NextPage } from 'next';
import Head from 'next/head';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/landing/Footer';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { toast } from 'react-toastify';

import fs from 'fs';
import path from 'path';

// --- Types ---
interface HistoryItem {
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    odds: number;
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

const History: NextPage<HistoryProps> = ({ historyData }) => {
    const [history, setHistory] = useState<DailyRecord[]>(historyData);
    const [selectedDate, setSelectedDate] = useState<string>(history[0]?.date || '');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshResults = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/history/verify');
            const data = await res.json();
            if (data.updatedCount > 0) {
                toast.success(`Success! Updated ${data.updatedCount} match results.`);
                // Small delay before reload to let toast show
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.info(data.message || 'All results are up to date!');
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
            <Head>
                <title>Performance History - SafeScore</title>
                <meta name="description" content="Track our historical betting accuracy and performance." />
            </Head>

            <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">

                {/* Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                        <Link href="/">
                            <img src="/logos.png" alt="SafeScore" className="h-8 cursor-pointer opacity-90 hover:opacity-100 transition-opacity" />
                        </Link>
                        <Link href="/home">
                            <button className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-gray-200">
                                Back to App
                            </button>
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
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed mb-8">
                            We believe in full transparency. Review our past predictions and accuracy metrics to see exactly how our algorithms are performing.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={refreshResults}
                            disabled={isRefreshing}
                            className={`inline-flex cursor-pointer items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isRefreshing
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-400 text-white hover:bg-blue-500 shadow-xl shadow-blue-400/20'
                                }`}
                        >
                            <FaClock className={isRefreshing ? 'animate-spin' : ''} />
                            {isRefreshing ? 'Verifying Results...' : 'Refresh Latest Results'}
                        </motion.button>
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
                        <div className="border-b border-white/5 p-6 flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-2 text-gray-400 mr-4">
                                <FaCalendarAlt />
                                <span className="font-bold text-sm uppercase">Select Date:</span>
                            </div>
                            {history.map((day) => (
                                <motion.button
                                    key={day.date}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(day.date)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${selectedDate === day.date
                                        ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/20'
                                        : 'bg-[#18181b] text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {day.date}
                                </motion.button>
                            ))}
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
                                                    <th className="py-4 font-bold uppercase tracking-wider">Est. Odds</th>
                                                    <th className="py-4 font-bold uppercase tracking-wider text-center">Result</th>
                                                    <th className="py-4 font-bold uppercase tracking-wider text-right pr-4">Score</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {currentRecords.map((item, i) => (
                                                    <motion.tr
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        key={item.id}
                                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                                    >
                                                        <td className="py-4 pl-4 font-medium text-white">
                                                            {item.homeTeam} <span className="text-gray-500 px-2">vs</span> {item.awayTeam}
                                                        </td>
                                                        <td className="py-4 font-bold text-blue-400">
                                                            {item.prediction}
                                                        </td>
                                                        <td className="py-4 text-gray-400">
                                                            {item.odds}
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${item.result === 'Won' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
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
                                                    </motion.tr>
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

