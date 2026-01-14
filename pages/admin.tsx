import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { useAdminAuth } from '@/lib/admin-auth';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import {
    IoStatsChartOutline,
    IoPeopleOutline,
    IoDiamondOutline,
    IoTimeOutline,
    IoSearchOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoRefreshOutline,
    IoArrowForwardOutline,
    IoCalendarOutline,
    IoSpeedometerOutline,
    IoShieldCheckmarkOutline,
    IoChevronBackOutline,
    IoLogOutOutline,
} from 'react-icons/io5';

interface AdminStats {
    accuracy: number;
    totalPredictions: number;
    totalUsers: number;
    proUsers: number;
    freeUsers: number;
    won: number;
    lost: number;
    pending: number;
    postponed: number;
}

interface PendingMatch {
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    league?: string;
    date: string;
    userId?: string;
}

interface UserSearchResult {
    id: string;
    email: string;
    createdAt: string;
    planType: 'pro' | 'free';
    proExpiresAt?: string;
    trialExpiresAt?: string;
    lastGenDate?: string;
    genCount: number;
}

const AdminDashboard: NextPage = () => {
    const router = useRouter();
    const { adminUser, loading: authLoading, isAdminUser, signOut: adminSignOut } = useAdminAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [latency, setLatency] = useState<{ latency: number; status: string } | null>(null);
    const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
    const [searching, setSearching] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (authLoading) return;
        
        if (!isAdminUser || !adminUser) {
            router.push('/admin/login');
            return;
        }

        // Fetch initial data
        fetchStats();
        fetchLatency();
        fetchPendingMatches();
        setLoading(false);
    }, [adminUser, isAdminUser, authLoading, router]);

    const getAuthToken = async (): Promise<string | null> => {
        // Get admin session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        
        // Verify it's still an admin session
        const adminSessionFlag = sessionStorage.getItem('admin_session');
        if (!adminSessionFlag) return null;
        
        return session.access_token || null;
    };

    const fetchStats = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            toast.error('Failed to load statistics');
        }
    };

    const fetchLatency = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch('/api/admin/latency', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch latency');
            const data = await response.json();
            setLatency(data);
        } catch (err) {
            console.error('Error fetching latency:', err);
        }
    };

    const fetchPendingMatches = async () => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch('/api/admin/pending-matches', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch pending matches');
            const data = await response.json();
            setPendingMatches(data.matches || []);
        } catch (err) {
            console.error('Error fetching pending matches:', err);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.warning('Please enter an email or user ID');
            return;
        }

        setSearching(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'User not found');
            }

            const data = await response.json();
            setSearchResult(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to search user');
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleUpgrade = async (userId: string, days: number = 30) => {
        setUpgrading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await fetch('/api/admin/users/upgrade', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, days }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upgrade user');
            }

            const data = await response.json();
            toast.success(data.message || 'User upgraded successfully');
            if (searchResult?.id === userId) {
                await handleSearch(); // Refresh search result
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to upgrade user');
        } finally {
            setUpgrading(false);
        }
    };

    const handleResetQuota = async (userId: string) => {
        setResetting(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await fetch('/api/admin/users/reset-quota', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reset quota');
            }

            toast.success('User quota reset successfully');
            if (searchResult?.id === userId) {
                await handleSearch(); // Refresh search result
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset quota');
        } finally {
            setResetting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    const statCards = stats ? [
        { title: 'Global Accuracy', value: `${stats.accuracy}%`, icon: IoStatsChartOutline, color: 'text-blue-500' },
        { title: 'Total Predictions', value: stats.totalPredictions.toLocaleString(), icon: IoCheckmarkCircleOutline, color: 'text-green-500' },
        { title: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: IoPeopleOutline, color: 'text-purple-500' },
        { title: 'Pro Users', value: stats.proUsers.toLocaleString(), icon: IoDiamondOutline, color: 'text-yellow-500' },
        { title: 'Free Users', value: stats.freeUsers.toLocaleString(), icon: IoPeopleOutline, color: 'text-neutral-400' },
        { title: 'Won', value: stats.won.toLocaleString(), icon: IoCheckmarkCircleOutline, color: 'text-green-500' },
        { title: 'Lost', value: stats.lost.toLocaleString(), icon: IoCloseCircleOutline, color: 'text-red-500' },
        { title: 'Pending', value: stats.pending.toLocaleString(), icon: IoTimeOutline, color: 'text-orange-500' },
    ] : [];

    const getLatencyColor = (status: string) => {
        if (status === 'healthy') return 'text-green-500';
        if (status === 'slow') return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <DashboardLayout>
            <SEO
                title="Admin Dashboard | SafeScore"
                description="Admin dashboard for managing SafeScore platform"
            />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3"
                        >
                            <IoShieldCheckmarkOutline className="text-blue-500" />
                            Admin <span className="text-blue-500">Dashboard</span>
                        </motion.h1>
                        <p className="max-w-xl text-neutral-500 text-lg mt-4 font-medium leading-relaxed">
                            Manage users, monitor system performance, and track prediction accuracy.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                fetchStats();
                                fetchLatency();
                                fetchPendingMatches();
                                toast.info('Data refreshed');
                            }}
                            className="px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 font-bold hover:bg-blue-600/20 transition-all flex items-center gap-2"
                        >
                            <IoRefreshOutline />
                            Refresh
                        </button>
                        <button
                            onClick={async () => {
                                await adminSignOut();
                                router.push('/admin/login');
                            }}
                            className="px-6 py-3 bg-red-600/10 border border-red-500/20 rounded-2xl text-red-500 font-bold hover:bg-red-600/20 transition-all flex items-center gap-2"
                        >
                            <IoLogOutOutline />
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-[#0a0a0a] border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                            <stat.icon className={`${stat.color} mb-6 group-hover:scale-110 transition-transform`} size={28} />
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">{stat.title}</p>
                            <p className="text-3xl font-black">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Latency & Pending Matches */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Engine Latency */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <IoSpeedometerOutline className="text-blue-500" />
                                Engine Latency
                            </h3>
                            {latency && (
                                <span className={`text-sm font-bold uppercase tracking-widest ${getLatencyColor(latency.status)}`}>
                                    {latency.status}
                                </span>
                            )}
                        </div>
                        {latency ? (
                            <div>
                                <p className="text-4xl font-black mb-2">{latency.latency}ms</p>
                                <p className="text-neutral-500 text-sm">Prediction engine response time</p>
                            </div>
                        ) : (
                            <p className="text-neutral-500">Loading...</p>
                        )}
                    </motion.div>

                    {/* Pending Matches */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <IoTimeOutline className="text-orange-500" />
                                Pending Matches
                            </h3>
                            <Link href="/previous-matches" className="text-blue-500 hover:text-blue-400 text-sm font-bold flex items-center gap-1">
                                View All
                                <IoArrowForwardOutline />
                            </Link>
                        </div>
                        <p className="text-4xl font-black mb-2">{pendingMatches.length}</p>
                        <p className="text-neutral-500 text-sm">Matches awaiting verification</p>
                    </motion.div>
                </div>

                {/* User Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-6"
                >
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <IoSearchOutline className="text-blue-500" />
                        User Management
                    </h3>

                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by email or user ID..."
                            className="flex-1 px-6 py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {searching ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <IoSearchOutline />
                                    Search
                                </>
                            )}
                        </button>
                    </div>

                    {/* Search Results */}
                    <AnimatePresence>
                        {searchResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-6 bg-[#0a0a0a] border border-white/10 rounded-2xl space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-bold text-white">{searchResult.email}</p>
                                        <p className="text-sm text-neutral-500">ID: {searchResult.id}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                                        searchResult.planType === 'pro'
                                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                    }`}>
                                        {searchResult.planType}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-neutral-500 mb-1">Created</p>
                                        <p className="font-bold">{new Date(searchResult.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500 mb-1">Daily Quota</p>
                                        <p className="font-bold">{searchResult.genCount}/2</p>
                                    </div>
                                    {searchResult.proExpiresAt && (
                                        <div>
                                            <p className="text-neutral-500 mb-1">Pro Expires</p>
                                            <p className="font-bold">{new Date(searchResult.proExpiresAt).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    {searchResult.lastGenDate && (
                                        <div>
                                            <p className="text-neutral-500 mb-1">Last Generation</p>
                                            <p className="font-bold">{searchResult.lastGenDate}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => handleUpgrade(searchResult.id, 30)}
                                        disabled={upgrading || searchResult.planType === 'pro'}
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {upgrading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Upgrading...
                                            </>
                                        ) : (
                                            <>
                                                <IoDiamondOutline />
                                                Upgrade to Pro
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleResetQuota(searchResult.id)}
                                        disabled={resetting}
                                        className="px-4 py-3 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {resetting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                                                Resetting...
                                            </>
                                        ) : (
                                            <>
                                                <IoRefreshOutline />
                                                Reset Quota
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Pending Matches Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-6"
                >
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                        <IoTimeOutline className="text-orange-500" />
                        Stuck in Pending ({pendingMatches.length})
                    </h3>

                    {pendingMatches.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">
                                            <th className="py-4 pl-4">Date</th>
                                            <th className="py-4">Match</th>
                                            <th className="py-4">Prediction</th>
                                            <th className="py-4">League</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {pendingMatches.slice(0, 10).map((match) => (
                                            <tr key={match.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 pl-4 text-neutral-400">{match.date}</td>
                                                <td className="py-4 font-bold text-white">
                                                    {match.homeTeam} vs {match.awayTeam}
                                                </td>
                                                <td className="py-4 text-blue-500">{match.prediction}</td>
                                                <td className="py-4 text-neutral-400">{match.league || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pendingMatches.length > 10 && (
                                <p className="text-center text-neutral-500 text-sm">
                                    Showing 10 of {pendingMatches.length} pending matches
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IoCheckmarkCircleOutline className="text-green-500" size={32} />
                            </div>
                            <p className="text-lg font-bold text-white mb-2">All Clear!</p>
                            <p className="text-neutral-500 text-sm">No matches are currently stuck in pending status.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
