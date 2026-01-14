import React, { useState, useEffect } from 'react';
import SEO from '../../components/SEO';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';
import { toast } from 'react-toastify';
import { 
    IoArrowForwardOutline, 
    IoShieldCheckmarkOutline, 
    IoLockClosedOutline,
    IoEyeOutline, 
    IoEyeOffOutline,
    IoAlertCircleOutline
} from 'react-icons/io5';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if already logged in as admin
        const checkAdminSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const adminStatus = await isAdmin(session.user.id);
                if (adminStatus) {
                    // Store admin session
                    sessionStorage.setItem('admin_session', 'true');
                    router.push('/admin');
                }
            }
        };
        checkAdminSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // First, authenticate with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Authentication failed');
            }

            // Verify admin status
            const adminStatus = await isAdmin(authData.user.id);
            if (!adminStatus) {
                // Sign out if not admin
                await supabase.auth.signOut();
                throw new Error('Access denied. Admin privileges required.');
            }

            // Store admin session indicator
            sessionStorage.setItem('admin_session', 'true');
            sessionStorage.setItem('admin_user_id', authData.user.id);

            toast.success('Admin access granted');
            router.push('/admin');
        } catch (error: any) {
            toast.error(error.message || 'Error logging in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <SEO
                title="Admin Login | SafeScore"
                description="Admin authentication portal for SafeScore platform management."
            />

            {/* Left Side - Visual Sidebar */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden md:flex md:w-1/2 flex-col justify-between p-16 bg-[#050505] relative overflow-hidden border-r border-white/5"
            >
                {/* Security-themed gradient overlay */}
                <div className="absolute top-0 left-0 w-full h-full opacity-40">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-red-600/20 blur-[130px] rounded-full"
                    />
                </div>

                <div className="relative z-10">
                    <Link href="/">
                        <img src="/logos.png" alt="SafeScore" className="h-12 mb-5" />
                    </Link>

                    <div className="max-w-md">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                                    <IoShieldCheckmarkOutline className="text-red-500" size={32} />
                                </div>
                                <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
                                    Admin <span className="text-red-500">Portal</span>
                                </h2>
                            </div>
                            <p className="text-neutral-400 text-xl leading-relaxed">
                                Secure access to platform management and analytics
                            </p>
                        </motion.div>

                        <div className="space-y-8 pt-10">
                            {[
                                {
                                    icon: IoShieldCheckmarkOutline,
                                    title: "Secure Access",
                                    desc: "Multi-layer authentication with admin privilege verification."
                                },
                                {
                                    icon: IoLockClosedOutline,
                                    title: "Platform Control",
                                    desc: "Full access to user management, system monitoring, and analytics."
                                }
                            ].map((item, i) => (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    key={i}
                                    className="flex gap-6 items-start group"
                                >
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-red-500 group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-all shadow-xl">
                                        <item.icon size={28} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white mb-1">{item.title}</h4>
                                        <p className="text-neutral-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mt-5 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-red-500/60 text-sm font-semibold tracking-widest uppercase">
                        <IoAlertCircleOutline size={16} />
                        Restricted Access Only
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <div className="flex-1 md:w-1/2 flex flex-col justify-center items-center px-10 py-12 bg-[#0a0a0a] relative">
                {/* Mobile Logo */}
                <div className="md:hidden absolute top-10 left-10">
                    <Link href="/">
                        <img src="/logos.png" alt="SafeScore" className="h-8" />
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-[440px]"
                >
                    <div className="mb-12 mt-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                <IoShieldCheckmarkOutline className="text-red-500" size={24} />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight">Admin Access</h1>
                        </div>
                        <p className="text-neutral-500 text-lg font-medium">
                            Enter your admin credentials to access the management dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-neutral-400 ml-1 uppercase tracking-[0.15em]">
                                Admin Email
                            </label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium text-base"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-neutral-400 ml-1 uppercase tracking-[0.15em]">
                                Password
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-xl py-4 pl-5 pr-12 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all font-medium text-base"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-red-500 transition-colors"
                                >
                                    {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01, y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-2xl shadow-red-600/20 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IoShieldCheckmarkOutline size={20} />
                                    <span className="text-lg">Authenticate</span>
                                    <IoArrowForwardOutline className="group-hover:translate-x-1.5 transition-transform text-xl" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-16 text-center">
                        <Link 
                            href="/auth/login" 
                            className="text-neutral-500 hover:text-white font-medium transition-colors text-sm"
                        >
                            ← Back to regular login
                        </Link>
                    </div>

                    <div className="mt-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                            <IoAlertCircleOutline className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                            <p className="text-xs text-neutral-400 leading-relaxed">
                                This portal is restricted to authorized administrators only. Unauthorized access attempts are logged and monitored.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
