import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SEO from '../../components/SEO';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuthToken, useAdminAuthStore } from '@/lib/stores/admin-auth-store';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import {
    IoStatsChartOutline,
    IoPeopleOutline,
    IoDiamondOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoRefreshOutline,
    IoSpeedometerOutline,
    IoTrendingUpOutline,
    IoAlertCircleOutline,
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

interface LatencyData {
    latency: number;
    status: string;
}

const AdminDashboard: NextPage = () => {
    const token = useAdminAuthToken();
    const { logout } = useAdminAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [latency, setLatency] = useState<LatencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again.');
                logout();
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            // Don't show toast for stats error to avoid spamming, unless critical
        }
    };

    const fetchLatency = async () => {
        try {
            const response = await fetch('/api/admin/latency', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                // Already handled in fetchStats or distinct toast
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch latency');
            const data = await response.json();
            setLatency(data);
        } catch (err) {
            console.error('Error fetching latency:', err);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchStats(), fetchLatency()]);
        setRefreshing(false);
        toast.success('Data refreshed');
    };

    useEffect(() => {
        if (token) {
            Promise.all([fetchStats(), fetchLatency()]).finally(() => {
                setLoading(false);
            });
        }
    }, [token]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    const statCards = stats ? [
        {
            title: 'Global Accuracy',
            value: `${stats.accuracy}%`,
            icon: IoStatsChartOutline,
            gradient: 'from-blue-600 to-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-500'
        },
        {
            title: 'Total Predictions',
            value: stats.totalPredictions.toLocaleString(),
            icon: IoTrendingUpOutline,
            gradient: 'from-purple-600 to-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            text: 'text-purple-500'
        },
        {
            title: 'Active Users',
            value: stats.totalUsers.toLocaleString(),
            icon: IoPeopleOutline,
            gradient: 'from-pink-600 to-pink-400',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20',
            text: 'text-pink-500'
        },
        {
            title: 'Pro Subscribers',
            value: stats.proUsers.toLocaleString(),
            icon: IoDiamondOutline,
            gradient: 'from-amber-500 to-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            text: 'text-yellow-500'
        },
    ] : [];

    const performanceCards = stats ? [
        { title: 'Won', value: stats.won.toLocaleString(), icon: IoCheckmarkCircleOutline, color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'Lost', value: stats.lost.toLocaleString(), icon: IoCloseCircleOutline, color: 'text-red-500', bg: 'bg-red-500/10' },
        { title: 'Pending', value: stats.pending.toLocaleString(), icon: IoTimeOutline, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { title: 'Postponed', value: stats.postponed.toLocaleString(), icon: IoAlertCircleOutline, color: 'text-gray-500', bg: 'bg-gray-500/10' },
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

            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                        <p className="text-neutral-400 text-sm">
                            Platform overview & performance metrics
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-[#1a1a1a] border border-white/10 hover:bg-white/5 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2 group"
                    >
                        <IoRefreshOutline className={`text-neutral-400 group-hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                    </button>
                </header>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative overflow-hidden bg-[#0a0a0a] rounded-xl p-6 border ${stat.border}`}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                                        <stat.icon className={`w-6 h-6 ${stat.text}`} />
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bg} ${stat.text} border ${stat.border}`}>
                                        +2.5%
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-neutral-400 text-sm font-medium mb-1">{stat.title}</h3>
                                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                            {/* Decorative gradient blur */}
                            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-3xl`} />
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Breakdown */}
                    <div className="lg:col-span-2 bg-[#0a0a0a] rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <IoStatsChartOutline className="text-neutral-400" />
                            Performance Breakdown
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {performanceCards.map((stat) => (
                                <div key={stat.title} className="p-4 rounded-lg bg-black border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        <span className="text-xs font-medium text-neutral-400">{stat.title}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <div className={`h-1 w-full mt-3 rounded-full bg-white/5`}>
                                        <div
                                            className={`h-full rounded-full ${stat.color.replace('text-', 'bg-')}`}
                                            style={{ width: `${Math.min(100, (parseInt(stat.value.replace(/,/g, '')) / (stats?.totalPredictions || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <IoSpeedometerOutline className="text-neutral-400" />
                            System Health
                        </h2>

                        <div className="space-y-6">
                            {/* Latency Meter */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-neutral-400">Engine Latency</span>
                                    {latency && (
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${latency.status === 'healthy' ? 'bg-green-500/20 text-green-500' :
                                            latency.status === 'slow' ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-red-500/20 text-red-500'
                                            }`}>
                                            {latency.status}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold text-white">
                                        {latency ? latency.latency : 0}
                                    </span>
                                    <span className="text-neutral-500 font-medium mb-1">ms</span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
                                    {latency && (
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${latency.status === 'healthy' ? 'bg-green-500' :
                                                latency.status === 'slow' ? 'bg-yellow-500' : 'bg-red-600'
                                                }`}
                                            style={{ width: `${Math.min(100, (latency.latency / 1000) * 100)}%` }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Additional System Metrics can go here */}
                            <div className="pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-400">Database Status</span>
                                    <span className="text-green-500 font-medium flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;