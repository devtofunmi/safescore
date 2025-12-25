import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion  } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { IoArrowForwardOutline, IoArrowBackOutline, IoCheckmarkCircleOutline, IoKeyOutline, IoHelpCircleOutline, IoLockOpenOutline } from 'react-icons/io5';

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success('Password reset email sent!');
        } catch (error: any) {
            toast.error(error.message || 'Error sending reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <Head>
                <title>Reset Password | SafeScore</title>
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
                                Account <span className="text-blue-500">Security.</span>
                            </h2>
                            <p className="text-neutral-400 text-xl leading-relaxed">
                                Regain access to your dashboard securely in just a few simple steps.
                            </p>
                        </motion.div>

                        <div className="space-y-8 pt-16">
                            {[
                                { icon: IoKeyOutline, title: "Secure Recovery", desc: "Password reset links are time-limited and securely generated to protect your account." },
                                { icon: IoLockOpenOutline, title: "Fast Access", desc: "Reset your password and regain access to your dashboard in minutes." }
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
                    SafeScore Recovery System
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

                <Link href="/auth/login" className="absolute top-10 right-10 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors font-extrabold text-xs uppercase tracking-widest">
                    <IoArrowBackOutline className="text-sm" />
                    Back to Sign In
                </Link>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-[440px]"
                >
                    {!submitted ? (
                        <>
                            <div className="mb-12">
                                <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Forgot Password?</h1>
                                <p className="text-neutral-500 text-lg font-medium leading-relaxed">Enter your email and we'll send you a secure link to reset your password.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-neutral-400 ml-1 uppercase tracking-[0.15em]">Email Address</label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#111] border border-white/5 hover:border-white/10 rounded-xl py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-medium text-base"
                                            placeholder="e.g. jay@example.com"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01, y: -2 }}
                                    whileTap={{ scale: 0.99 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full cursor-pointer bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-lg">Send Reset Link</span>
                                            <IoArrowForwardOutline className="group-hover:translate-x-1.5 transition-transform text-xl" />
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center p-10 bg-white/5 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl">
                            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-500/20">
                                <IoCheckmarkCircleOutline className="text-6xl text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black mb-4 tracking-tight">Check Your Inbox</h2>
                            <p className="text-neutral-400 mb-10 leading-relaxed font-medium">
                                We've sent a recovery link to <br /><span className="text-white font-bold">{email}</span>.
                            </p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-blue-500 cursor-pointer font-black hover:text-blue-400 transition-colors text-sm uppercase tracking-widest underline underline-offset-8 decoration-blue-500/30"
                            >
                                Try different email
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}