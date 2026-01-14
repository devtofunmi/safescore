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
    IoEyeOutline,
    IoListOutline,
    IoGridOutline,
    IoRocketOutline,
    IoChevronForwardOutline,
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
    const [viewMode, setViewMode] = useState<'overview' | 'users'>('overview');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userList, setUserList] = useState<any[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);
    const [userListPage, setUserListPage] = useState(1);
    const [userListTotal, setUserListTotal] = useState(0);
    const [userListFilter, setUserListFilter] = useState<'all' | 'pro' | 'free'>('all');
    const [userListSearch, setUserListSearch] = useState('');
    const [userDetailData, setUserDetailData] = useState<any>(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);

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
            if (selectedUserId === userId) {
                await fetchUserDetail(userId); // Refresh user detail
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset quota');
        } finally {
            setResetting(false);
        }
    };

    const fetchUserList = async (page: number = 1, filter: string = 'all', search: string = '') => {
        setUserListLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) return;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (filter !== 'all') {
                params.append('planType', filter);
            }
            if (search) {
                params.append('search', search);
            }

            const response = await fetch(`/api/admin/users/list?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUserList(data.users || []);
            setUserListTotal(data.total || 0);
            setUserListPage(page);
        } catch (err) {
            console.error('Error fetching user list:', err);
            toast.error('Failed to load users');
        } finally {
            setUserListLoading(false);
        }
    };

    const fetchUserDetail = async (userId: string) => {
        setUserDetailLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) return;

            const [dashboardRes, predictionsRes, historyRes] = await Promise.all([
                fetch(`/api/admin/users/dashboard?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`/api/admin/users/predictions?userId=${userId}&limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`/api/admin/users/history?userId=${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ]);

            if (!dashboardRes.ok || !predictionsRes.ok || !historyRes.ok) {
                throw new Error('Failed to fetch user data');
            }

            const [dashboard, predictions, history] = await Promise.all([
                dashboardRes.json(),
                predictionsRes.json(),
                historyRes.json(),
            ]);

            setUserDetailData({
                dashboard,
                predictions,
                history,
            });
        } catch (err) {
            console.error('Error fetching user detail:', err);
            toast.error('Failed to load user data');
        } finally {
            setUserDetailLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'users' && !selectedUserId) {
            fetchUserList(userListPage, userListFilter, userListSearch);
        }
    }, [viewMode, userListPage, userListFilter, userListSearch]);

    useEffect(() => {
        if (selectedUserId) {
            fetchUserDetail(selectedUserId);
        }
    }, [selectedUserId]);

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

                {/* View Mode Tabs */}
                <div className="flex gap-4 border-b border-white/5">
                    <button
                        onClick={() => {
                            setViewMode('overview');
                            setSelectedUserId(null);
                        }}
                        className={`px-6 py-3 font-bold transition-all border-b-2 ${
                            viewMode === 'overview'
                                ? 'text-blue-500 border-blue-500'
                                : 'text-neutral-500 border-transparent hover:text-white'
                        }`}
                    >
                        <IoStatsChartOutline className="inline mr-2" />
                        Overview
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('users');
                            setSelectedUserId(null);
                        }}
                        className={`px-6 py-3 font-bold transition-all border-b-2 ${
                            viewMode === 'users'
                                ? 'text-blue-500 border-blue-500'
                                : 'text-neutral-500 border-transparent hover:text-white'
                        }`}
                    >
                        <IoPeopleOutline className="inline mr-2" />
                        Users
                    </button>
                </div>

                {/* Conditional Rendering Based on View Mode */}
                {viewMode === 'overview' && (
                    <>
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
                    </>
                )}

                {/* Users View */}
                {viewMode === 'users' && !selectedUserId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* User List Filters */}
                        <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                                    <input
                                        type="text"
                                        value={userListSearch}
                                        onChange={(e) => {
                                            setUserListSearch(e.target.value);
                                            setUserListPage(1);
                                        }}
                                        placeholder="Search users by email..."
                                        className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {(['all', 'pro', 'free'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setUserListFilter(filter);
                                                setUserListPage(1);
                                            }}
                                            className={`px-4 py-3 rounded-xl font-bold transition-all ${
                                                userListFilter === filter
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-[#0a0a0a] border border-white/10 text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* User List */}
                        <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">
                                    All Users ({userListTotal})
                                </h3>
                                {userListLoading && (
                                    <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                )}
                            </div>

                            {userListLoading && userList.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-neutral-500">Loading users...</p>
                                </div>
                            ) : userList.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-neutral-500">No users found</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        {userList.map((user) => (
                                            <motion.div
                                                key={user.id}
                                                whileHover={{ scale: 1.01 }}
                                                className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer"
                                                onClick={() => setSelectedUserId(user.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white">{user.email}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                                                            <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                                                            <span>Quota: {user.genCount}/2</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                            user.planType === 'pro'
                                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                                : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                                        }`}>
                                                            {user.planType}
                                                        </span>
                                                        <IoChevronForwardOutline className="text-neutral-500" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {userListTotal > 20 && (
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => setUserListPage(p => Math.max(1, p - 1))}
                                                disabled={userListPage === 1}
                                                className="px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-neutral-500">
                                                Page {userListPage} of {Math.ceil(userListTotal / 20)}
                                            </span>
                                            <button
                                                onClick={() => setUserListPage(p => p + 1)}
                                                disabled={userListPage >= Math.ceil(userListTotal / 20)}
                                                className="px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* User Detail View */}
                {viewMode === 'users' && selectedUserId && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <button
                            onClick={() => setSelectedUserId(null)}
                            className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors"
                        >
                            <IoChevronBackOutline />
                            Back to Users
                        </button>

                        {userDetailLoading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-neutral-500">Loading user data...</p>
                            </div>
                        ) : userDetailData ? (
                            <>
                                {/* User Info Card */}
                                <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-bold">{userDetailData.dashboard.user.email}</h3>
                                            <p className="text-neutral-500 text-sm">ID: {userDetailData.dashboard.user.id}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${
                                            userDetailData.dashboard.user.planType === 'pro'
                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                        }`}>
                                            {userDetailData.dashboard.user.planType}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-neutral-500 text-sm mb-1">Today's Predictions</p>
                                            <p className="text-2xl font-black">{userDetailData.dashboard.stats.todayCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500 text-sm mb-1">Avg Confidence</p>
                                            <p className="text-2xl font-black">{userDetailData.dashboard.stats.avgConfidence}%</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500 text-sm mb-1">Markets</p>
                                            <p className="text-2xl font-black">{userDetailData.dashboard.stats.markets}</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500 text-sm mb-1">Active Predictions</p>
                                            <p className="text-2xl font-black">{userDetailData.dashboard.stats.activePredictions}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
                                        <button
                                            onClick={() => handleUpgrade(userDetailData.dashboard.user.id, 30)}
                                            disabled={upgrading || userDetailData.dashboard.user.planType === 'pro'}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <IoDiamondOutline />
                                            Upgrade to Pro
                                        </button>
                                        <button
                                            onClick={() => handleResetQuota(userDetailData.dashboard.user.id)}
                                            disabled={resetting}
                                            className="px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <IoRefreshOutline />
                                            Reset Quota
                                        </button>
                                    </div>
                                </div>

                                {/* Active Predictions */}
                                {userDetailData.dashboard.activePredictions.length > 0 && (
                                    <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem]">
                                        <h4 className="text-xl font-bold mb-4">Active Predictions</h4>
                                        <div className="space-y-2">
                                            {userDetailData.dashboard.activePredictions.map((p: any, i: number) => (
                                                <div key={i} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                                    <p className="font-bold">{p.team1} vs {p.team2}</p>
                                                    <p className="text-sm text-blue-500">{p.betType}</p>
                                                    <p className="text-xs text-neutral-500 mt-1">{p.league} • {p.displayDate}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* History Stats */}
                                {userDetailData.history && (
                                    <div className="p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem]">
                                        <h4 className="text-xl font-bold mb-4">Match History</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                            <div>
                                                <p className="text-neutral-500 text-sm mb-1">Accuracy</p>
                                                <p className="text-2xl font-black text-blue-500">{userDetailData.history.stats.accuracy}%</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-sm mb-1">Won</p>
                                                <p className="text-2xl font-black text-green-500">{userDetailData.history.stats.won}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-sm mb-1">Lost</p>
                                                <p className="text-2xl font-black text-red-500">{userDetailData.history.stats.lost}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-sm mb-1">Pending</p>
                                                <p className="text-2xl font-black text-orange-500">{userDetailData.history.stats.pending}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-sm mb-1">Total</p>
                                                <p className="text-2xl font-black">{userDetailData.history.stats.total}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-neutral-500">Failed to load user data</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
