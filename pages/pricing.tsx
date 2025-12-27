import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoDiamondOutline,
    IoStatsChartOutline,
    IoArrowForwardOutline,
    IoChevronBackOutline
} from 'react-icons/io5';
import { useAuth } from '@/lib/auth';

export default function PricingPage() {
    const { user, isPro, isTrialActive, days_remaining: daysRemaining } = useAuth() as any;

    const proPrice = "$3.45";
    const freePrice = "$0";

    const plans = [
        {
            name: "Free",
            description: "Essential insights for casual tracking.",
            price: freePrice,
            duration: "forever",
            features: [
                { text: "2 Daily prediction generations", available: true },
                { text: "Top 5 Full Analysis (Bankers included)", available: true },
                { text: "Today's basic matches", available: true },
                { text: "80%+ Lock (Matches 6+)", available: false },
                { text: "Revealed Bet Types (Matches 6+)", available: false },
                { text: "Unlimited daily predictions", available: false },
                { text: "Tomorrow & Weekend insights", available: false },
            ],
            cta: "Current Plan",
            action: "/dashboard",
            highlight: false
        },
        {
            name: "Pro",
            description: "Deep intelligence for serious performance.",
            price: proPrice,
            duration: "per month",
            features: [
                { text: "Unlimited daily predictions", available: true },
                { text: "Unlimited AI Analysis access", available: true },
                { text: "Full High-Confidence access", available: true },
                { text: "Revealed Bet Types & Scores", available: true },
                { text: "Tomorrow & Weekend insights", available: true },
                { text: "Priority engine signals", available: true },
                { text: "Direct Upgrade Support", available: true },
            ],
            cta: isPro ? "Active Plan" : "Upgrade to Pro",
            // Dynamically construct Coinbase Checkout URL
            action: isPro
                ? "/dashboard"
                : user
                    ? `/api/checkout/coinbase?userId=${user.id}`
                    : "/auth/signup",
            highlight: true
        }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
            <Head>
                <title>Pricing | SafeScore - Invest in Accuracy</title>
                <meta name="description" content="Unlock high-confidence football predictions and advanced AI analytics with SafeScore Pro." />
            </Head>

            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/dashboard" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                        <IoChevronBackOutline className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
                    </Link>
                    <Link href="/">
                        <img src="/logos.png" alt="SafeScore" className="h-8" />
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-5xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
                    >
                        <IoDiamondOutline className="text-blue-500" />
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Premium Intelligence</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-black mb-6 tracking-tight"
                    >
                        Simple, <span className="text-blue-500 text-glow-blue">Performance-Driven</span> Pricing
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-neutral-500 text-lg md:text-xl max-w-2xl mx-auto font-medium"
                    >
                        Stop guessing. Access proprietary models and high-confidence alerts built for data-driven users.
                    </motion.p>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className={`p-6 md:p-10 rounded-[2.5rem] border transition-all relative overflow-hidden group flex flex-col ${plan.highlight
                                ? 'bg-[#0c0c0c] border-blue-500/30 shadow-2xl shadow-blue-500/10'
                                : 'bg-[#0a0a0a] border-white/5 hover:border-white/10'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-6 py-1.5 rotate-45 translate-x-10 translate-y-4 uppercase tracking-[0.2em] shadow-xl">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                <p className="text-neutral-500 text-sm font-medium mb-8 leading-relaxed">
                                    {plan.description}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                    <span className="text-neutral-500 font-bold uppercase text-xs tracking-widest">{plan.duration}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-10 flex-1">
                                {plan.features.map((feature, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        {feature.available ? (
                                            <IoCheckmarkCircleOutline className="text-blue-500 flex-shrink-0" size={20} />
                                        ) : (
                                            <IoCloseCircleOutline className="text-neutral-700 flex-shrink-0" size={20} />
                                        )}
                                        <span className={`text-sm font-medium ${feature.available ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {plan.name === 'Free' ? (
                                <div
                                    className="w-full py-4 rounded-2xl font-black text-center bg-white/5 text-neutral-500 border border-white/10 cursor-default select-none transition-all flex items-center justify-center gap-2"
                                >
                                    {plan.cta}
                                </div>
                            ) : (
                                <Link
                                    href={plan.action}
                                    className={`w-full py-4 rounded-2xl font-black text-center transition-all flex items-center justify-center gap-2 group/btn ${plan.highlight
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20'
                                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                        }`}
                                >
                                    {plan.cta}
                                    <IoArrowForwardOutline className="group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            )}

                            {/* Background Accents */}
                            <div className={`absolute -bottom-20 -right-20 w-64 h-64 blur-[100px] rounded-full transition-opacity ${plan.highlight ? 'bg-blue-600/10 group-hover:opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'
                                }`} />
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: IoStatsChartOutline, title: "Deep Analytics", text: "Go beyond the surface. See the 'Why' behind every pick with qualitative AI reasoning." },
                            { icon: IoDiamondOutline, title: "Verified Signal", text: "Our High-Confidence tier average 85%+ success rate based on historical data." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 bg-[#0a0a0a] border border-white/5 rounded-3xl hover:border-blue-500/20 transition-all group"
                            >
                                <item.icon className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                                <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                                <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                                    {item.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="mt-24 text-center">
                    <p className="text-neutral-600 text-sm font-bold uppercase tracking-[0.3em] mb-4">Secured by SafeScore Protocol</p>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex justify-center gap-8 opacity-30 grayscale items-center">
                            <span className="font-black text-xl italic uppercase font-serif">Coinbase</span>
                            <span className="font-black text-xl italic uppercase font-serif">Crypto</span>
                        </div>
                        <p className="text-neutral-500 text-xs font-medium">
                            Need help? Contact <a href="mailto:safescorepro@gmail.com" className="text-blue-500 hover:underline">safescorepro@gmail.com</a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
