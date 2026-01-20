import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';
import {
    IoStatsChartOutline,
    IoFootballOutline,
    IoPulseOutline,
    IoLogOutOutline,
    IoHelpCircleOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const isActive = (path: string) => router.pathname === path;
    const isAdmin = user?.user_metadata?.is_admin === true;

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 bg-[#0a0a0a] border-r border-white/5 flex-col p-6 space-y-8 shrink-0">
                <div className="flex items-center gap-3">
                    <img src="/logos.png" alt="SafeScore" className="h-8" />
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border ${isActive('/dashboard') ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' : 'text-neutral-400 hover:text-white hover:bg-white/5 border-transparent'}`}>
                        <IoStatsChartOutline size={20} className={isActive('/dashboard') ? '' : 'group-hover:text-blue-500 transition-colors'} />
                        Overview
                    </Link>
                    <Link href="/home" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/home') ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                        <IoFootballOutline size={20} className={isActive('/home') ? '' : 'group-hover:text-blue-500 transition-colors'} />
                        Predictions
                    </Link>
                    {isAdmin && (
                        <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${isActive('/admin') ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <IoShieldCheckmarkOutline size={20} className={isActive('/admin') ? '' : 'group-hover:text-blue-500 transition-colors'} />
                            Admin
                        </Link>
                    )}
                    <a
                        href="mailto:safescorepro@gmail.com"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent transition-all group"
                    >
                        <IoHelpCircleOutline size={20} className="group-hover:text-blue-500 transition-colors" />
                        Support
                    </a>
                </nav>

                <div className="pt-6 border-t border-white/5 space-y-3">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-4 py-3 w-full text-neutral-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl font-medium transition-all group"
                    >
                        <IoLogOutOutline size={20} className="group-hover:translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Nav Top */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <img src="/logos.png" alt="SafeScore" className="h-6" />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-6 md:p-12 pb-24 md:pb-12">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 flex justify-around p-4 z-50 safe-area-bottom">
                <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${isActive('/dashboard') ? 'text-blue-500' : 'text-neutral-500'}`}>
                    <IoStatsChartOutline size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Dash</span>
                </Link>
                <Link href="/home" className={`flex flex-col items-center gap-1 ${isActive('/home') ? 'text-blue-500' : 'text-neutral-500'}`}>
                    <IoFootballOutline size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Picks</span>
                </Link>
                <button
                    onClick={() => signOut()}
                    className="flex flex-col items-center gap-1 text-neutral-500 hover:text-red-400 transition-colors"
                >
                    <IoLogOutOutline size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
                </button>
            </div>
        </div>
    );
}
