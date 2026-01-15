import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import { useAdminAuthToken } from '@/lib/stores/admin-auth-store';
import AdminLayout from '../components/admin/AdminLayout';
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
    const { adminUser, isAuthenticated, isLoading: authLoading, logout: adminSignOut } = useAdminAuth();
    const token = useAdminAuthToken();
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
    const [generatingPredictions, setGeneratingPredictions] = useState(false);
    const [verifyingMatches, setVerifyingMatches] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        oddsType: 'safe' as 'very safe' | 'safe' | 'medium safe',
        leagues: ['Premier League'] as string[],
        day: 'today' as 'today' | 'tomorrow' | 'weekend',
    });

    // Check if user is admin
    useEffect(() => {
        if (authLoading) return;
        
        if (!isAuthenticated || !adminUser) {
            router.push('/admin/login');
            return;
        }

        // Fetch initial data
        fetchStats();
        fetchLatency();
        fetchPendingMatches();
        setLoading(false);
    }, [adminUser, isAuthenticated, authLoading, router]);

    const getAuthToken = (): string | null => {
        // Get admin session token from Zustand store
        return token;
    };

    const fetchStats = async () => {
        try {
            const token = getAuthToken();
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
            const token = getAuthToken();
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
            const token = getAuthToken();
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
            const token = getAuthToken();
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
            const token = getAuthToken();
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
            if (selectedUserId === userId) {
                await fetchUserDetail(userId); // Refresh user detail
            }
            // Refresh user list if in users view
            if (viewMode === 'users' && !selectedUserId) {
                await fetchUserList(userListPage, userListFilter, userListSearch);
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
            const token = getAuthToken();
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
            // Refresh user list if in users view
            if (viewMode === 'users' && !selectedUserId) {
                await fetchUserList(userListPage, userListFilter, userListSearch);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to reset quota');
        } finally {
            setResetting(false);
        }
    };

    const handleGeneratePredictions = async (userId: string) => {
        setGeneratingPredictions(true);
        try {
            const token = getAuthToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await fetch('/api/admin/users/generate-predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    ...generateForm,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate predictions');
            }

            const data = await response.json();
            toast.success(`Generated ${data.predictions.length} predictions for user`);
            setShowGenerateModal(false);
            
            // Refresh user detail
            if (selectedUserId === userId) {
                await fetchUserDetail(userId);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate predictions');
        } finally {
            setGeneratingPredictions(false);
        }
    };

    const handleManualVerification = async () => {
        setVerifyingMatches(true);
        try {
            const response = await fetch('/api/history/verify');
            const data = await response.json();
            
            if (data.updatedCount > 0) {
                toast.success(`Updated ${data.updatedCount} match results`);
                await fetchPendingMatches();
                await fetchStats();
            } else {
                toast.info(data.status || 'All matches are up to date');
            }
        } catch (err: any) {
            toast.error('Failed to verify matches');
        } finally {
            setVerifyingMatches(false);
        }
    };

    const fetchUserList = async (page: number = 1, filter: string = 'all', search: string = '') => {
        setUserListLoading(true);
        try {
            const token = getAuthToken();
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
            const token = getAuthToken();
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

    // Debounced search for user list
    useEffect(() => {
        if (viewMode === 'users' && !selectedUserId) {
            const timeoutId = setTimeout(() => {
                fetchUserList(userListPage, userListFilter, userListSearch);
            }, 500); // 500ms debounce

            return () => clearTimeout(timeoutId);
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
        <AdminLayout>
            <SEO
                title="Admin Dashboard | SafeScore"
                description="Admin dashboard for managing SafeScore platform"
            />

            <div className="space-y-8">
                {/* Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
                        <p className="text-neutral-400 text-sm">
                            Overview of platform statistics and key metrics
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            fetchStats();
                            fetchLatency();
                            fetchPendingMatches();
                            if (viewMode === 'users' && !selectedUserId) {
                                fetchUserList(userListPage, userListFilter, userListSearch);
                            }
                            if (selectedUserId) {
                                fetchUserDetail(selectedUserId);
                            }
                            toast.info('Data refreshed');
                        }}
                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <IoRefreshOutline />
                        Refresh
                    </button>
                </header>

                {/* View Mode Tabs */}
                <div className="flex gap-2 md:gap-4 border-b border-white/5 overflow-x-auto">
                    <button
                        onClick={() => {
                            setViewMode('overview');
                            setSelectedUserId(null);
                        }}
                        className={`px-4 md:px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap text-sm md:text-base ${
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
                        className={`px-4 md:px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap text-sm md:text-base ${
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
                        className="p-6 md:p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 md:gap-3">
                                <IoSpeedometerOutline className="text-blue-500 shrink-0" />
                                Engine Latency
                            </h3>
                            {latency && (
                                <span className={`text-xs md:text-sm font-bold uppercase tracking-widest ${getLatencyColor(latency.status)}`}>
                                    {latency.status}
                                </span>
                            )}
                        </div>
                        {latency ? (
                            <div>
                                <p className="text-3xl md:text-4xl font-black mb-2">{latency.latency}ms</p>
                                <p className="text-neutral-500 text-xs md:text-sm">Prediction engine response time</p>
                            </div>
                        ) : (
                            <p className="text-neutral-500 text-sm">Loading...</p>
                        )}
                    </motion.div>

                    {/* Pending Matches */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-6 md:p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] relative overflow-hidden"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-lg md:text-xl font-bold flex items-center gap-3">
                                <IoTimeOutline className="text-orange-500" />
                                Pending Matches
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleManualVerification}
                                    disabled={verifyingMatches}
                                    className="px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    {verifyingMatches ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <IoRefreshOutline />
                                            Verify Now
                                        </>
                                    )}
                                </button>
                                <Link href="/previous-matches" className="px-4 py-2 text-blue-500 hover:text-blue-400 text-sm font-bold flex items-center gap-1 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-all">
                                    View All
                                    <IoArrowForwardOutline />
                                </Link>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black mb-2">{pendingMatches.length}</p>
                        <p className="text-neutral-500 text-xs md:text-sm">Matches awaiting verification</p>
                    </motion.div>
                </div>

                {/* User Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 md:p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-4 md:space-y-6"
                >
                    <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                        <IoSearchOutline className="text-blue-500 shrink-0" />
                        <span className="truncate">User Management</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by email or user ID..."
                            className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-all text-sm md:text-base"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm md:text-base"
                        >
                            {searching ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span className="hidden sm:inline">Searching...</span>
                                </>
                            ) : (
                                <>
                                    <IoSearchOutline />
                                    <span className="hidden sm:inline">Search</span>
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

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => handleUpgrade(searchResult.id, 30)}
                                        disabled={upgrading || searchResult.planType === 'pro'}
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
                                        className="px-4 py-3 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
                                    <button
                                        onClick={() => {
                                            setSelectedUserId(searchResult.id);
                                            setViewMode('users');
                                        }}
                                        className="px-4 py-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <IoEyeOutline />
                                        View Details
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
                    className="p-4 md:p-8 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-4 md:space-y-6"
                >
                    <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3 flex-wrap">
                        <IoTimeOutline className="text-orange-500 shrink-0" />
                        <span>Stuck in Pending <span className="text-orange-500">({pendingMatches.length})</span></span>
                    </h3>

                    {pendingMatches.length > 0 ? (
                        <>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">
                                                <th className="py-3 md:py-4 pl-2 md:pl-4 text-left">Date</th>
                                                <th className="py-3 md:py-4 text-left">Match</th>
                                                <th className="py-3 md:py-4 text-left hidden sm:table-cell">Prediction</th>
                                                <th className="py-3 md:py-4 text-left hidden md:table-cell">League</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs md:text-sm">
                                            {pendingMatches.slice(0, 10).map((match) => (
                                                <tr key={match.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-3 md:py-4 pl-2 md:pl-4 text-neutral-400">{match.date}</td>
                                                    <td className="py-3 md:py-4 font-bold text-white">
                                                        <div className="flex flex-col sm:block">
                                                            <span className="truncate max-w-[120px] sm:max-w-none">{match.homeTeam}</span>
                                                            <span className="text-neutral-600 text-[10px] sm:hidden">vs</span>
                                                            <span className="truncate max-w-[120px] sm:max-w-none sm:ml-2">{match.awayTeam}</span>
                                                        </div>
                                                        <div className="sm:hidden mt-1">
                                                            <span className="text-blue-500 text-[10px]">{match.prediction}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 md:py-4 text-blue-500 hidden sm:table-cell">{match.prediction}</td>
                                                    <td className="py-3 md:py-4 text-neutral-400 hidden md:table-cell">{match.league || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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
                        <div className="p-4 md:p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <IoSearchOutline className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                                    <input
                                        type="text"
                                        value={userListSearch}
                                        onChange={(e) => {
                                            setUserListSearch(e.target.value);
                                            setUserListPage(1);
                                        }}
                                        placeholder="Search users by email..."
                                        className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-[#0a0a0a] border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-all text-sm md:text-base"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                                    {(['all', 'pro', 'free'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setUserListFilter(filter);
                                                setUserListPage(1);
                                            }}
                                            className={`px-3 md:px-4 py-2 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
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
                        <div className="p-4 md:p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-lg md:text-xl font-bold truncate">
                                    All Users <span className="text-blue-500">({userListTotal})</span>
                                </h3>
                                {userListLoading && (
                                    <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shrink-0" />
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
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-white truncate">{user.email}</p>
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-neutral-500">
                                                            <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                                                            <span>Quota: {user.genCount}/2</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase ${
                                                            user.planType === 'pro'
                                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                                : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                                        }`}>
                                                            {user.planType}
                                                        </span>
                                                        <IoChevronForwardOutline className="text-neutral-500 hidden sm:block" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {userListTotal > 20 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => setUserListPage(p => Math.max(1, p - 1))}
                                                disabled={userListPage === 1}
                                                className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all text-sm"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-neutral-500 text-sm">
                                                Page {userListPage} of {Math.ceil(userListTotal / 20)}
                                            </span>
                                            <button
                                                onClick={() => setUserListPage(p => p + 1)}
                                                disabled={userListPage >= Math.ceil(userListTotal / 20)}
                                                className="w-full sm:w-auto px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-all text-sm"
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
                            className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-sm md:text-base"
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
                                <div className="p-4 md:p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem]">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl md:text-2xl font-bold truncate">{userDetailData.dashboard.user.email}</h3>
                                            <p className="text-neutral-500 text-xs md:text-sm truncate">ID: {userDetailData.dashboard.user.id}</p>
                                        </div>
                                        <span className={`px-3 md:px-4 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase shrink-0 ${
                                            userDetailData.dashboard.user.planType === 'pro'
                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                        }`}>
                                            {userDetailData.dashboard.user.planType}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                        <div>
                                            <p className="text-neutral-500 text-xs md:text-sm mb-1">Today's Predictions</p>
                                            <p className="text-xl md:text-2xl font-black">{userDetailData.dashboard.stats.todayCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500 text-xs md:text-sm mb-1">Avg Confidence</p>
                                            <p className="text-xl md:text-2xl font-black">{userDetailData.dashboard.stats.avgConfidence}%</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500 text-xs md:text-sm mb-1">Markets</p>
                                            <p className="text-xl md:text-2xl font-black">{userDetailData.dashboard.stats.markets}</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-500 text-xs md:text-sm mb-1">Active Predictions</p>
                                            <p className="text-xl md:text-2xl font-black">{userDetailData.dashboard.stats.activePredictions}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-white/5">
                                        <button
                                            onClick={() => handleUpgrade(userDetailData.dashboard.user.id, 30)}
                                            disabled={upgrading || userDetailData.dashboard.user.planType === 'pro'}
                                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                        >
                                            <IoDiamondOutline />
                                            Upgrade to Pro
                                        </button>
                                        <button
                                            onClick={() => handleResetQuota(userDetailData.dashboard.user.id)}
                                            disabled={resetting}
                                            className="flex-1 px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                        >
                                            <IoRefreshOutline />
                                            Reset Quota
                                        </button>
                                        <button
                                            onClick={() => setShowGenerateModal(true)}
                                            className="flex-1 px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <IoRocketOutline />
                                            Generate Predictions
                                        </button>
                                    </div>
                                </div>

                                {/* Active Predictions */}
                                {userDetailData.dashboard.activePredictions.length > 0 && (
                                    <div className="p-4 md:p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem]">
                                        <h4 className="text-lg md:text-xl font-bold mb-4">Active Predictions</h4>
                                        <div className="space-y-2">
                                            {userDetailData.dashboard.activePredictions.map((p: any, i: number) => (
                                                <div key={i} className="p-3 md:p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                                                    <p className="font-bold text-sm md:text-base truncate">{p.team1} vs {p.team2}</p>
                                                    <p className="text-xs md:text-sm text-blue-500 truncate">{p.betType}</p>
                                                    <p className="text-[10px] md:text-xs text-neutral-500 mt-1 truncate">{p.league} • {p.displayDate}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* History Stats */}
                                {userDetailData.history && (
                                    <div className="p-4 md:p-6 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem]">
                                        <h4 className="text-lg md:text-xl font-bold mb-4">Match History</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-4">
                                            <div>
                                                <p className="text-neutral-500 text-xs md:text-sm mb-1">Accuracy</p>
                                                <p className="text-xl md:text-2xl font-black text-blue-500">{userDetailData.history.stats.accuracy}%</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-xs md:text-sm mb-1">Won</p>
                                                <p className="text-xl md:text-2xl font-black text-green-500">{userDetailData.history.stats.won}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-xs md:text-sm mb-1">Lost</p>
                                                <p className="text-xl md:text-2xl font-black text-red-500">{userDetailData.history.stats.lost}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-xs md:text-sm mb-1">Pending</p>
                                                <p className="text-xl md:text-2xl font-black text-orange-500">{userDetailData.history.stats.pending}</p>
                                            </div>
                                            <div>
                                                <p className="text-neutral-500 text-xs md:text-sm mb-1">Total</p>
                                                <p className="text-xl md:text-2xl font-black">{userDetailData.history.stats.total}</p>
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

                {/* Generate Predictions Modal */}
                <AnimatePresence>
                    {showGenerateModal && selectedUserId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowGenerateModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-[#0c0c0c] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/5 p-6 md:p-8 shadow-2xl custom-scrollbar"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-extrabold text-white tracking-tight">Generate Predictions</h3>
                                        <p className="text-neutral-500 text-sm mt-1">Generate predictions on behalf of this user</p>
                                    </div>
                                    <button
                                        onClick={() => setShowGenerateModal(false)}
                                        className="cursor-pointer text-neutral-500 hover:text-white p-2 text-2xl font-bold transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Risk Level */}
                                    <div>
                                        <label className="text-sm font-bold text-neutral-400 mb-2 block uppercase tracking-widest">Risk Level</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['very safe', 'safe', 'medium safe'] as const).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setGenerateForm({ ...generateForm, oddsType: level })}
                                                    className={`px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                                                        generateForm.oddsType === level
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-[#0a0a0a] border border-white/10 text-neutral-400 hover:text-white'
                                                    }`}
                                                >
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Day Selection */}
                                    <div>
                                        <label className="text-sm font-bold text-neutral-400 mb-2 block uppercase tracking-widest">Match Day</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['today', 'tomorrow', 'weekend'] as const).map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => setGenerateForm({ ...generateForm, day })}
                                                    className={`px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                                                        generateForm.day === day
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-[#0a0a0a] border border-white/10 text-neutral-400 hover:text-white'
                                                    }`}
                                                >
                                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Leagues Selection */}
                                    <div>
                                        <label className="text-sm font-bold text-neutral-400 mb-2 block uppercase tracking-widest">Leagues</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-[#0a0a0a] rounded-xl border border-white/10">
                                            {['Premier League', 'Championship', 'La Liga', 'Bundesliga', 'Serie A', 'Serie B', 'Ligue 1', 'Eredivisie', 'Primeira Liga', 'Super Lig', 'Greek Super League', 'Allsvenskan', 'Champions League', 'Europa League'].map((league) => (
                                                <button
                                                    key={league}
                                                    onClick={() => {
                                                        setGenerateForm({
                                                            ...generateForm,
                                                            leagues: generateForm.leagues.includes(league)
                                                                ? generateForm.leagues.filter(l => l !== league)
                                                                : [...generateForm.leagues, league]
                                                        });
                                                    }}
                                                    className={`px-3 py-2 rounded-lg font-bold transition-all text-xs ${
                                                        generateForm.leagues.includes(league)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'
                                                    }`}
                                                >
                                                    {league}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-white/10">
                                        <button
                                            onClick={() => setShowGenerateModal(false)}
                                            className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-white/10 text-white font-bold rounded-xl transition-all hover:bg-white/5"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleGeneratePredictions(selectedUserId)}
                                            disabled={generatingPredictions || generateForm.leagues.length === 0}
                                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {generatingPredictions ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <IoRocketOutline />
                                                    Generate
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
