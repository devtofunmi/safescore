import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';
import {
    IoStatsChartOutline,
    IoPeopleOutline,
    IoTimeOutline,
    IoShieldCheckmarkOutline,
    IoLogOutOutline,
    IoMenuOutline,
    IoCloseOutline,
    IoChevronDownOutline,
    IoChevronForwardOutline,
} from 'react-icons/io5';

interface AdminLayoutProps {
    children: ReactNode;
}

interface NavGroup {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    items: NavItem[];
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        icon: IoStatsChartOutline,
        items: [
            { href: '/admin/dashboard', label: 'Dashboard', icon: IoStatsChartOutline },
            { href: '/admin/pending', label: 'Pending Matches', icon: IoTimeOutline },
        ],
    },
    {
        label: 'User Management',
        icon: IoPeopleOutline,
        items: [
            { href: '/admin/users', label: 'All Users', icon: IoPeopleOutline },
        ],
    },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading, logout } = useAdminAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [openGroups, setOpenGroups] = useState<Set<string>>(
        new Set(navGroups.map((group) => group.label))
    );
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, isLoading, router]);

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
    };

    const toggleGroup = (groupLabel: string) => {
        const newOpenGroups = new Set(openGroups);
        if (newOpenGroups.has(groupLabel)) {
            newOpenGroups.delete(groupLabel);
        } else {
            newOpenGroups.add(groupLabel);
        }
        setOpenGroups(newOpenGroups);
    };

    const isActive = (path: string) => router.pathname === path;

    // Don't show layout on login page
    if (router.pathname === '/admin/login') {
        return <>{children}</>;
    }

    // Show loader while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    // Don't show layout if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Mobile Header */}
            <div className="md:hidden border-b border-white/10 bg-black px-4 py-4 flex items-center justify-between sticky top-0 z-50">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    {sidebarOpen ? (
                        <IoCloseOutline className="w-6 h-6" />
                    ) : (
                        <IoMenuOutline className="w-6 h-6" />
                    )}
                </button>
                <div className="flex items-center gap-2">
                    <IoShieldCheckmarkOutline className="w-5 h-5 text-red-500" />
                    <h1 className="text-lg font-bold">Admin</h1>
                </div>
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-500 transition-colors flex items-center gap-2"
                >
                    <IoLogOutOutline className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>

            <div className="flex min-h-screen flex-col md:flex-row">
                {/* Sidebar */}
                <aside
                    className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } md:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-white/10 transition-transform duration-300 md:transition-none`}
                >
                    <div className="h-full flex flex-col">
                        {/* Desktop Header */}
                        <div className="hidden md:flex items-center gap-3 px-6 py-8 border-b border-white/10">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                <IoShieldCheckmarkOutline className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Admin</h1>
                                <p className="text-xs text-neutral-400">SafeScore</p>
                            </div>
                        </div>

                        {/* Mobile Header in Sidebar */}
                        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <IoShieldCheckmarkOutline className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white">Admin</h1>
                                    <p className="text-xs text-neutral-400">SafeScore</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <IoCloseOutline className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-4 py-6 overflow-y-auto">
                            <ul className="flex flex-col gap-1">
                                {navGroups.map((group) => {
                                    const GroupIcon = group.icon;
                                    const isOpen = openGroups.has(group.label);
                                    const hasActiveItem = group.items.some(
                                        (item) => isActive(item.href)
                                    );

                                    return (
                                        <li key={group.label}>
                                            {/* Group Header */}
                                            <button
                                                onClick={() => toggleGroup(group.label)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${hasActiveItem
                                                        ? 'text-white bg-white/5'
                                                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GroupIcon className="w-4 h-4" />
                                                    <span>{group.label}</span>
                                                </div>
                                                {isOpen ? (
                                                    <IoChevronDownOutline className="w-4 h-4" />
                                                ) : (
                                                    <IoChevronForwardOutline className="w-4 h-4" />
                                                )}
                                            </button>

                                            {/* Group Items */}
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.ul
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4 overflow-hidden"
                                                    >
                                                        {group.items.map((item) => {
                                                            const isActiveItem = isActive(item.href);
                                                            const ItemIcon = item.icon;
                                                            return (
                                                                <li key={item.href}>
                                                                    <Link
                                                                        href={item.href}
                                                                        onClick={() => setSidebarOpen(false)}
                                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${isActiveItem
                                                                                ? 'font-bold text-white bg-white/5 border border-white/10'
                                                                                : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        <ItemIcon className="w-4 h-4" />
                                                                        <span>{item.label}</span>
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </motion.ul>
                                                )}
                                            </AnimatePresence>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        {/* Desktop Logout */}
                        <div className="hidden md:block px-4 py-4 border-t border-white/10">
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <IoLogOutOutline className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Mobile Logout */}
                        <div className="md:hidden px-4 py-4 border-t border-white/10">
                            <button
                                onClick={() => {
                                    setShowLogoutConfirm(true);
                                    setSidebarOpen(false);
                                }}
                                className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <IoLogOutOutline className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Overlay */}
                    {sidebarOpen && (
                        <div
                            className="md:hidden fixed inset-0 bg-black/50 z-30"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto md:ml-64">
                    {children}
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 max-w-md w-full"
                        >
                            <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
                            <p className="text-neutral-400 mb-6">
                                Are you sure you want to logout? You'll need to login again to access the admin panel.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
