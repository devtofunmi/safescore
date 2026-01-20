import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import SEO from '../../components/SEO';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuthToken } from '@/lib/stores/admin-auth-store';
import {
    IoPeopleOutline,
    IoSearchOutline,
    IoDiamondOutline,
    IoRefreshOutline,
    IoEyeOutline,
    IoChevronBackOutline,
    IoRocketOutline,
} from 'react-icons/io5';

interface User {
    id: string;
    email: string;
    createdAt?: string;
    created_at?: string;
    planType?: 'pro' | 'free';
    user_metadata?: {
        plan_type?: string;
        pro_expires_at?: string;
        trial_expires_at?: string;
        last_gen_date?: string;
        gen_count?: number;
        full_name?: string;
    };
}

interface UserDetail {
    user: {
        id: string;
        email: string;
        createdAt: string;
        planType: 'pro' | 'free';
        proExpiresAt?: string;
        trialExpiresAt?: string;
        lastGenDate?: string;
        genCount: number;
    };
    stats: {
        todayCount: number;
        avgConfidence: number;
        markets: number;
        activePredictions: number;
    };
    activePredictions: any[];
}

const AdminUsers: NextPage = () => {
    const token = useAdminAuthToken();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<User | null>(null);
    const [searching, setSearching] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState<'all' | 'pro' | 'free'>('all');
    const [upgrading, setUpgrading] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [generatingPredictions, setGeneratingPredictions] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        riskLevel: 'safe' as 'very safe' | 'safe' | 'medium safe',
        leagues: ['Premier League'] as string[],
        day: 'today' as 'today' | 'tomorrow' | 'weekend',
    });

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                planType: filter,
                search: searchQuery,
            });

            const response = await fetch(`/api/admin/users/list?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Error fetching users:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.warning('Please enter an email or user ID');
            return;
        }

        setSearching(true);
        try {
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
            setSearchResult(data as any);
        } catch (err: any) {
            toast.error(err.message || 'Failed to search user');
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const fetchUserDetail = async (userId: string) => {
        setUserDetailLoading(true);
        try {
            const response = await fetch(`/api/admin/users/dashboard?userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            setUserDetail(data);
        } catch (err) {
            console.error('Error fetching user detail:', err);
            toast.error('Failed to load user data');
        } finally {
            setUserDetailLoading(false);
        }
    };

    const handleUpgrade = async (userId: string, days: number = 30) => {
        setUpgrading(true);
        try {
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

            toast.success('User upgraded successfully');
            if (selectedUserId === userId) {
                await fetchUserDetail(userId);
            }
            await fetchUsers();
        } catch (err: any) {
            toast.error(err.message || 'Failed to upgrade user');
        } finally {
            setUpgrading(false);
        }
    };

    const handleResetQuota = async (userId: string) => {
        setResetting(true);
        try {
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

            toast.success('Quota reset successfully');
            if (selectedUserId === userId) {
                await fetchUserDetail(userId);
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
            const response = await fetch('/api/admin/users/generate-predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    riskLevel: generateForm.riskLevel,
                    day: generateForm.day,
                    leagues: generateForm.leagues,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate predictions');
            }

            toast.success('Predictions generated successfully');
            setShowGenerateModal(false);
            if (selectedUserId === userId) {
                await fetchUserDetail(userId);
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate predictions');
        } finally {
            setGeneratingPredictions(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUsers();
        }
    }, [token, page, filter]);

    useEffect(() => {
        if (selectedUserId) {
            fetchUserDetail(selectedUserId);
        }
    }, [selectedUserId]);

    const availableLeagues = [
        'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
        'Champions League', 'Europa League', 'MLS', 'Eredivisie', 'Primeira Liga',
        'Championship', 'Liga MX', 'J1 League', 'Super Lig'
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <SEO
                title="User Management | SafeScore Admin"
                description="Manage users, upgrade plans, and reset quotas"
            />

            <div className="space-y-8">
                {!selectedUserId ? (
                    <>
                        {/* Header */}
                        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">User Management</h1>
                                <p className="text-neutral-400 text-sm">
                                    Search, view, and manage user accounts
                                </p>
                            </div>
                        </header>

                        {/* Search */}
                        <div className="bg-[#0a0a0a] rounded-lg p-6 border border-white/10 space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <IoSearchOutline className="text-blue-500" />
                                Search User
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by email or user ID..."
                                    className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                                        className="p-6 bg-[#0a0a0a] border border-white/10 rounded-lg space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-white">{searchResult.email}</p>
                                                <p className="text-sm text-neutral-500">ID: {searchResult.id}</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase ${searchResult.planType === 'pro'
                                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                                }`}>
                                                {searchResult.planType}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                                            <button
                                                onClick={() => handleUpgrade(searchResult.id, 30)}
                                                disabled={upgrading || searchResult.planType === 'pro'}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                                                className="px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
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
                                                onClick={() => setSelectedUserId(searchResult.id)}
                                                className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/20 font-bold rounded-lg transition-all flex items-center gap-2"
                                            >
                                                <IoEyeOutline />
                                                View Details
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3">
                            {(['all', 'pro', 'free'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setFilter(f);
                                        setPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg font-bold transition-all ${filter === f
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#0a0a0a] border border-white/10 text-neutral-400 hover:text-white'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Users List */}
                        <div className="bg-[#0a0a0a] rounded-lg border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#0a0a0a] border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Email</th>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Plan</th>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest hidden md:table-cell">Created</th>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => {
                                            const planType = user.planType || user.user_metadata?.plan_type || 'free';
                                            return (
                                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-white">{user.email}</p>
                                                        <p className="text-xs text-neutral-500">{user.id}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${planType === 'pro'
                                                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                            : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                                                            }`}>
                                                            {planType}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-400 text-sm hidden md:table-cell">
                                                        {(user.createdAt || user.created_at) ? new Date(user.createdAt || user.created_at!).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => setSelectedUserId(user.id)}
                                                            className="px-3 py-1.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/20 font-bold rounded-lg transition-all flex items-center gap-2 text-sm"
                                                        >
                                                            <IoEyeOutline />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {total > 20 && (
                                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                                    <p className="text-sm text-neutral-400">
                                        Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={page * 20 >= total}
                                            className="px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* User Detail View */}
                        <header className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedUserId(null)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <IoChevronBackOutline className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold">User Details</h1>
                                <p className="text-neutral-400 text-sm">View and manage user account</p>
                            </div>
                        </header>

                        {userDetailLoading ? (
                            <div className="flex items-center justify-center min-h-[40vh]">
                                <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        ) : userDetail ? (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="bg-[#161616] rounded-lg p-6 border border-white/10">
                                    <h2 className="text-xl font-bold mb-4">User Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-neutral-400 text-sm mb-1">Email</p>
                                            <p className="font-bold">{userDetail.user?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm mb-1">Plan Type</p>
                                            <p className="font-bold">{userDetail.user?.planType || 'free'}</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm mb-1">Daily Quota</p>
                                            <p className="font-bold">{userDetail.user?.genCount || 0}/2</p>
                                        </div>
                                        <div>
                                            <p className="text-neutral-400 text-sm mb-1">Today's Predictions</p>
                                            <p className="font-bold">{userDetail.stats?.todayCount || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bg-[#161616] rounded-lg p-6 border border-white/10">
                                    <h2 className="text-xl font-bold mb-4">Actions</h2>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleUpgrade(selectedUserId, 30)}
                                            disabled={upgrading || userDetail.user?.planType === 'pro'}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
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
                                            onClick={() => handleResetQuota(selectedUserId)}
                                            disabled={resetting}
                                            className="px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
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
                                            onClick={() => setShowGenerateModal(true)}
                                            className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/20 font-bold rounded-lg transition-all flex items-center gap-2"
                                        >
                                            <IoRocketOutline />
                                            Generate Predictions
                                        </button>
                                    </div>
                                </div>

                                {/* Active Predictions */}
                                <div className="bg-[#161616] rounded-lg p-6 border border-white/10">
                                    <h2 className="text-xl font-bold mb-4">Active Predictions</h2>
                                    {userDetail.activePredictions && userDetail.activePredictions.length > 0 ? (
                                        <div className="space-y-2">
                                            {userDetail.activePredictions.slice(0, 5).map((pred: any, i: number) => (
                                                <div key={i} className="p-3 bg-[#0a0a0a] rounded-lg border border-white/5">
                                                    <p className="text-sm font-bold text-white">{pred.team1 || pred.homeTeam} vs {pred.team2 || pred.awayTeam}</p>
                                                    <p className="text-xs text-neutral-400">{pred.betType || pred.prediction} - {pred.league}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-400 text-sm">No active predictions found</p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </>
                )}

                {/* Generate Predictions Modal */}
                <AnimatePresence>
                    {showGenerateModal && selectedUserId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                            onClick={() => setShowGenerateModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full"
                            >
                                <h2 className="text-xl font-bold mb-4">Generate Predictions</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-400 mb-2">Risk Level</label>
                                        <div className="flex gap-2">
                                            {(['very safe', 'safe', 'medium safe'] as const).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setGenerateForm({ ...generateForm, riskLevel: level })}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm ${generateForm.riskLevel === level
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-[#161616] border border-white/10 text-neutral-400 hover:text-white'
                                                        }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-400 mb-2">Day</label>
                                        <div className="flex gap-2">
                                            {(['today', 'tomorrow', 'weekend'] as const).map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => setGenerateForm({ ...generateForm, day })}
                                                    className={`px-4 py-2 rounded-lg font-bold text-sm ${generateForm.day === day
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-[#161616] border border-white/10 text-neutral-400 hover:text-white'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-400 mb-2">Leagues</label>
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                            {availableLeagues.map((league) => (
                                                <button
                                                    key={league}
                                                    onClick={() => {
                                                        const leagues = generateForm.leagues.includes(league)
                                                            ? generateForm.leagues.filter(l => l !== league)
                                                            : [...generateForm.leagues, league];
                                                        setGenerateForm({ ...generateForm, leagues });
                                                    }}
                                                    className={`px-3 py-2 rounded-lg font-bold text-xs ${generateForm.leagues.includes(league)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-[#161616] border border-white/10 text-neutral-400 hover:text-white'
                                                        }`}
                                                >
                                                    {league}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10 mt-4">
                                    <button
                                        onClick={() => setShowGenerateModal(false)}
                                        className="flex-1 px-4 py-3 bg-[#161616] border border-white/10 text-white font-bold rounded-lg transition-all hover:bg-white/5"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleGeneratePredictions(selectedUserId)}
                                        disabled={generatingPredictions || generateForm.leagues.length === 0}
                                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;