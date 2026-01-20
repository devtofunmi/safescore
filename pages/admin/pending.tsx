import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import Link from 'next/link';
import SEO from '../../components/SEO';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuthToken } from '@/lib/stores/admin-auth-store';
import {
    IoTimeOutline,
    IoRefreshOutline,
    IoCheckmarkCircleOutline,
    IoArrowForwardOutline,
} from 'react-icons/io5';

interface PendingMatch {
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    league?: string;
    date: string;
    userId?: string;
}

const AdminPending: NextPage = () => {
    const token = useAdminAuthToken();
    const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    const fetchPendingMatches = async () => {
        try {
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
            toast.error('Failed to load pending matches');
        } finally {
            setLoading(false);
        }
    };

    const handleManualVerification = async () => {
        setVerifying(true);
        try {
            const response = await fetch('/api/history/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to verify matches');
            }

            toast.success('Matches verified successfully');
            await fetchPendingMatches();
        } catch (err: any) {
            toast.error(err.message || 'Failed to verify matches');
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPendingMatches();
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

    return (
        <AdminLayout>
            <SEO
                title="Pending Matches | SafeScore Admin"
                description="View and verify matches stuck in pending status"
            />

            <div className="space-y-8">
                {/* Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Pending Matches</h1>
                        <p className="text-neutral-400 text-sm">
                            Matches awaiting verification ({pendingMatches.length})
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleManualVerification}
                            disabled={verifying}
                            className="px-4 py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {verifying ? (
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
                        <Link
                            href="/previous-matches"
                            className="px-4 py-2 text-blue-500 hover:text-blue-400 font-bold flex items-center gap-2 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-all"
                        >
                            View All
                            <IoArrowForwardOutline />
                        </Link>
                    </div>
                </header>

                {/* Pending Matches Table */}
                <div className="bg-[#0a0a0a] rounded-lg border border-white/10 overflow-hidden">
                    {pendingMatches.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[#0a0a0a] border-b border-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Match</th>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest hidden sm:table-cell">Prediction</th>
                                            <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest hidden md:table-cell">League</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingMatches.map((match) => (
                                            <tr key={match.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 text-neutral-400 text-sm">{match.date}</td>
                                                <td className="px-6 py-4 font-bold text-white">
                                                    <div className="flex flex-col sm:block">
                                                        <span className="truncate max-w-[120px] sm:max-w-none">{match.homeTeam}</span>
                                                        <span className="text-neutral-600 text-[10px] sm:hidden">vs</span>
                                                        <span className="truncate max-w-[120px] sm:max-w-none sm:ml-2">{match.awayTeam}</span>
                                                    </div>
                                                    <div className="sm:hidden mt-1">
                                                        <span className="text-blue-500 text-[10px]">{match.prediction}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-blue-500 hidden sm:table-cell">{match.prediction}</td>
                                                <td className="px-6 py-4 text-neutral-400 hidden md:table-cell">{match.league || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IoCheckmarkCircleOutline className="text-green-500" size={32} />
                            </div>
                            <p className="text-lg font-bold text-white mb-2">All Clear!</p>
                            <p className="text-neutral-400 text-sm">No matches are currently stuck in pending status.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPending;