import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IoMailUnreadOutline, IoArrowBackOutline } from 'react-icons/io5';

export default function VerifyRequestPage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row h-screen overflow-hidden">
            <Head>
                <title>Verify Email | SafeScore</title>
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
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-[10%] -right-[10%] w-[80%] h-[80%] bg-blue-600/10 blur-[130px] rounded-full"
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
                                One Last <span className="text-blue-500">Step.</span>
                            </h2>
                            <p className="text-neutral-400 text-xl leading-relaxed">
                                Confirm your identity to unlock precision analytics and proprietary prediction models.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="relative z-10 pt-10 border-t border-white/5 text-neutral-600 text-sm font-semibold tracking-widest uppercase">
                    SafeScore Verification Protocol
                </div>
            </motion.div>

            {/* Right Side - Message (50% Width) */}
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
                    className="w-full max-w-[440px] text-center"
                >
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-500/20">
                        <IoMailUnreadOutline className="text-6xl text-blue-500" />
                    </div>

                    <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Check Your Inbox</h1>
                    <p className="text-neutral-500 text-lg font-medium leading-relaxed mb-10">
                        We&apos;ve sent a verification link to your email address. Please click the link to confirm your account and start winning.
                    </p>

                    <Link
                        href="/auth/login"
                        className="inline-flex items-center gap-2 text-white hover:text-blue-500 font-extrabold transition-colors uppercase tracking-widest text-sm underline underline-offset-8 decoration-blue-500/30"
                    >
                        Back to Sign In
                    </Link>

                    <div className="mt-20 pt-10 border-t border-white/5">
                        <p className="text-sm text-neutral-600 font-medium">
                            Didn&apos;t receive the email? Check your spam folder or wait a few minutes.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}