import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SEO from '../../components/SEO';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuthToken } from '@/lib/stores/admin-auth-store';
import {
    IoStatsChartOutline,
    IoPeopleOutline,
    IoDiamondOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoRefreshOutline,
    IoSpeedometerOutline,
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
        { title: 'Global Accuracy', value: `${stats.accuracy}%`, icon: IoStatsChartOutline, color: 'bg-blue-600', textColor: 'text-blue-500' },
        { title: 'Total Predictions', value: stats.totalPredictions.toLocaleString(), icon: IoCheckmarkCircleOutline, color: 'bg-green-600', textColor: 'text-green-500' },
        { title: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: IoPeopleOutline, color: 'bg-purple-600', textColor: 'text-purple-500' },
        { title: 'Pro Users', value: stats.proUsers.toLocaleString(), icon: IoDiamondOutline, color: 'bg-yellow-600', textColor: 'text-yellow-500' },
        { title: 'Free Users', value: stats.freeUsers.toLocaleString(), icon: IoPeopleOutline, color: 'bg-neutral-600', textColor: 'text-neutral-400' },
        { title: 'Won', value: stats.won.toLocaleString(), icon: IoCheckmarkCircleOutline, color: 'bg-green-600', textColor: 'text-green-500' },
        { title: 'Lost', value: stats.lost.toLocaleString(), icon: IoCloseCircleOutline, color: 'bg-red-600', textColor: 'text-red-500' },
        { title: 'Pending', value: stats.pending.toLocaleString(), icon: IoTimeOutline, color: 'bg-orange-600', textColor: 'text-orange-500' },
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
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        <IoRefreshOutline className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#161616] rounded-lg p-6 border border-white/10 hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-neutral-400 text-sm mb-2">{stat.title}</h3>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Latency Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#161616] rounded-lg p-6 border border-white/10"
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
                            <p className="text-4xl font-bold mb-2">{latency.latency}ms</p>
                            <p className="text-neutral-400 text-sm">Prediction engine response time</p>
                        </div>
                    ) : (
                        <p className="text-neutral-400 text-sm">Loading...</p>
                    )}
                </motion.div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
