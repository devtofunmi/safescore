import React from 'react';
import { useRouter } from 'next/router';
import { FaArrowRight, FaChartLine, FaShieldHalved, FaBolt } from 'react-icons/fa6';
import { motion } from 'framer-motion';

const PredictionCard = ({ teamA, teamB, prob, delay }: { teamA: string, teamB: string, prob: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.8 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 w-full max-w-[280px]"
    >
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1 flex items-center gap-1">
                <FaBolt className="text-[8px]" /> High Probability
            </span>
            <span className="text-sm font-semibold text-white">{teamA} vs {teamB}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-xl font-bold text-blue-400">{prob}%</span>
            <span className="text-[10px] text-gray-400 uppercase">Confidence</span>
        </div>
    </motion.div>
);

const Hero: React.FC = () => {
    const router = useRouter();

    return (
        <div className="relative min-h-[90vh] lg:min-h-screen overflow-hidden bg-[#050505] pt-32 pb-16 sm:pb-24 flex items-center">
            {/* Background elements */}
            <div className="absolute inset-0 z-0">

                <div className="absolute inset-0 bg-[#050505]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] brightness-100 contrast-100"></div>

            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    {/* Left content */}
                    <div className="text-left max-w-2xl mx-auto lg:mx-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false }}
                            className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 mb-8 tracking-widest uppercase"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></span>
                            Predictive Intelligence v1.2.0
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-5xl font-black tracking-tight text-white sm:text-7xl mb-8 leading-[1.1]"
                        >
                            Predict smarter, <br />
                            <span className="text-blue-500">
                                not harder.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-lg text-gray-400 mb-10 leading-relaxed font-medium max-w-xl"
                        >
                            SafeScore analyzes match stats and form across 14+ leagues to generate high-probability football predictions. Stop guessing. Filter by risk and make more informed picks.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <button
                                onClick={() => router.push('/home')}
                                className="group relative overflow-hidden flex justify-center items-center rounded-full bg-blue-600 px-8 py-5 text-base font-bold text-white shadow-xl hover:bg-blue-500 transition-all duration-300 cursor-pointer"
                            >
                                <span className="relative flex items-center">
                                    Start Predicting Now
                                    <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    const element = document.getElementById('features');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-8 py-5 text-base font-bold text-white hover:bg-white/10 transition-all duration-300 cursor-pointer"
                            >
                                Explore Features
                            </button>
                        </motion.div>


                    </div>

                    {/* Right content - Abstract Product Mockup */}
                    <div className="relative hidden lg:block">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: [0, -15, 0]
                            }}
                            transition={{
                                opacity: { duration: 1 },
                                scale: { duration: 1 },
                                y: {
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                            className="relative z-10 aspect-square max-w-[500px] ml-auto"
                        >
                            {/* Main "Dashboard" Frame */}
                            <div className="absolute inset-0 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-2xl overflow-hidden flex">
                                {/* Mockup Sidebar */}
                                <div className="w-16 sm:w-20 border-r border-white/5 bg-white/5 p-4 flex flex-col items-center gap-4 hidden sm:flex">
                                    <div className="flex gap-1 mb-6">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-400/30"></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-400/30"></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-400/30"></div>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 mb-6"></div>
                                    <div className="space-y-4">
                                        <div className="w-8 h-2 bg-white/10 rounded-full"></div>
                                        <div className="w-8 h-2 bg-white/5 rounded-full"></div>
                                        <div className="w-8 h-2 bg-white/5 rounded-full"></div>
                                        <div className="w-8 h-2 bg-white/5 rounded-full"></div>
                                    </div>
                                </div>

                                <div className="flex-1 p-8">
                                    <div className="flex items-center justify-between mb-8 opacity-50">
                                        <div className="h-2 w-32 bg-white/10 rounded-full"></div>
                                        <div className="h-6 w-6 rounded-full bg-white/10"></div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-24 bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col justify-end">
                                                <div className="h-1 w-1/2 bg-blue-400/50 rounded-full mb-2"></div>
                                                <div className="h-3 w-3/4 bg-white/20 rounded-full"></div>
                                            </div>
                                            <div className="h-24 bg-blue-500/10 rounded-2xl border border-blue-500/20 p-4 flex flex-col justify-end">
                                                <div className="h-1 w-1/2 bg-teal-400/50 rounded-full mb-2"></div>
                                                <div className="h-3 w-3/4 bg-white/40 rounded-full"></div>
                                            </div>
                                        </div>

                                        <div className="h-40 bg-white/5 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                                            <div className="flex justify-between items-center mb-4 relative z-10">
                                                <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                                                <div className="h-2 w-10 bg-white/10 rounded-full"></div>
                                            </div>
                                            <div className="flex items-end gap-2 h-20 relative z-10">
                                                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        transition={{ delay: 1 + (i * 0.1), duration: 1 }}
                                                        className="flex-1 bg-blue-500/80 rounded-t-sm"
                                                    />
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 bg-blue-500/5"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Prediction Cards */}
                            <div className="absolute -right-8 top-12 z-20">
                                <PredictionCard teamA="Man City" teamB="Arsenal" prob="89" delay={1.2} />
                            </div>
                            <div className="absolute -left-12 bottom-20 z-20">
                                <PredictionCard teamA="Real Madrid" teamB="Barca" prob="76" delay={1.4} />
                            </div>

                            {/* Feature Pills */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.6 }}
                                className="absolute right-12 bottom-8 z-20 flex gap-2"
                            >
                                <div className="bg-green-500/20 border border-green-500/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <FaShieldHalved className="text-green-400 text-xs" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Safe Mode</span>
                                </div>
                                <div className="bg-blue-500/20 border border-blue-500/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <FaChartLine className="text-blue-400 text-xs" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Analysis</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;