import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { IoArrowForwardOutline, IoShieldCheckmarkOutline, IoKeyOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if the user is authenticated via the reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Session expired or invalid link. Please request a new reset link.');
                router.push('/auth/reset-password');
            }
        };
        checkSession();
    }, [router]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) throw error;

            toast.success('Password updated successfully! You can now log in.');
            router.push('/auth/login');
        } catch (error: any) {
            toast.error(error.message || 'Error updating password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <Head>
                <title>Update Password | SafeScore</title>
            </Head>

            {/* Left Side - Visual Sidebar (50% Width) */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden md:flex md:w-1/2 flex-col justify-between p-16 bg-[#050505] relative overflow-hidden border-r border-white/5"
            >
                {/* Subtle Brand Gradient Overlay */}
                <div className="absolute top-0 left-0 w-full h-full opacity-40">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-600/20 blur-[130px] rounded-full"
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
                            <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
                                Secure Your <span className="text-blue-500">Access.</span>
                            </h2>
                            <p className="text-neutral-400 text-xl leading-relaxed">
                                Final step to regain full access to your premium analytics. Choose a strong, memorable password.
                            </p>
                        </motion.div>

                        <div className="space-y-8 pt-16">
                            {[
                                { icon: IoShieldCheckmarkOutline, title: "Link Verified", desc: "Your password reset link is valid and secure." },
                                { icon: IoKeyOutline, title: "Set New Password", desc: "Choose a new password to regain access to your account." }
                            ].map((item, i) => (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    key={i}
                                    className="flex gap-6 items-start group"
                                >
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-blue-500 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all shadow-xl">
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

                <div className="relative z-10 mt-5 pt-2 border-t border-white/5 text-neutral-600 text-sm font-semibold tracking-widest uppercase">
                    SafeScore Security Protocol
                </div>
            </motion.div>

            {/* Right Side - Form (50% Width) */}
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
                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">New Password</h1>
                        <p className="text-neutral-500 text-lg font-medium leading-relaxed">Enter your new password below. Ensure it's strong and unique.</p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-neutral-400 ml-1 uppercase tracking-[0.15em]">New Password</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-xl py-4 pl-5 pr-12 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium text-base"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-blue-500 transition-colors"
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
                            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span className="text-lg">Update Password</span>
                                    <IoArrowForwardOutline className="group-hover:translate-x-1.5 transition-transform text-xl" />
                                </>
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}