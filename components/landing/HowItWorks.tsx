import React from 'react';
import { motion } from 'framer-motion';

const steps = [
    {
        id: 1,
        title: 'Select Leagues',
        description: 'Choose which competitions you want to bet on. Mix and match across 14+ global leagues.',
    },
    {
        id: 2,
        title: 'Choose Risk Level',
        description: 'Select "Very Safe" for high-probability low-yield, or "Safe" for high-yield moonshots.',
    },
    {
        id: 3,
        title: 'Get Predictions',
        description: 'Our system generates match predictions instantly. Use them to build your own slip on your preferred bookie.',
    },
];

const HowItWorks = () => {
    return (
        <div id="how-it-works" className="py-32 bg-[#050505] overflow-hidden lg:py-40 relative">


            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
                <div className="relative lg:grid lg:grid-cols-2 lg:gap-24 lg:items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-6"
                        >
                            The Workflow
                        </motion.span>
                        <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-8">
                            A Simple Path to <br />
                            <span className="text-blue-600">Smarter Picks.</span>
                        </h2>
                        <p className="mt-4 text-lg text-gray-400 font-medium leading-relaxed">
                            We've boiled down complex statistical modeling into an interface that gives you answers in seconds. No fluff, just data.
                        </p>

                        <dl className="mt-12 space-y-12">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: false, margin: "-50px" }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                    className="relative flex gap-6"
                                >
                                    <div className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white font-black text-2xl shadow-xl shadow-blue-500/20">
                                        {step.id}
                                    </div>
                                    <div className="flex flex-col">
                                        <dt className="text-xl font-bold text-white mb-2">{step.title}</dt>
                                        <dd className="text-base text-gray-400 font-medium leading-relaxed">{step.description}</dd>
                                    </div>
                                </motion.div>
                            ))}
                        </dl>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: false, margin: "-100px" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="mt-16 lg:mt-0 relative"
                    >
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative transform bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex max-w-lg mx-auto"
                        >
                            {/* Mockup Sidebar Area */}
                            <div className="w-16 border-r border-white/5 bg-white/5 p-4 flex flex-col items-center gap-4 hidden sm:flex">
                                <div className="flex gap-1 mb-4">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-400/30"></div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-yellow-400/30"></div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400/30"></div>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 mb-4"></div>
                                <div className="w-6 h-1.5 bg-white/10 rounded-full"></div>
                                <div className="w-6 h-1.5 bg-white/5 rounded-full"></div>
                                <div className="w-6 h-1.5 bg-white/5 rounded-full"></div>
                            </div>

                            <div className="flex-1 p-8">
                                {/* Mockup Top Nav placeholder */}
                                <div className="flex items-center justify-between mb-8 opacity-50">
                                    <div className="h-1.5 w-16 bg-white/10 rounded-full"></div>
                                    <div className="h-4 w-4 rounded-full bg-white/10"></div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-white transform hover:scale-[1.02] transition-transform">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-sm tracking-tight text-blue-400">Match 1284.A</span>
                                            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">88% Match</span>
                                        </div>
                                        <div className="font-black text-lg mb-1">Man City vs Liverpool</div>
                                        <div className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">Prediction: Over 2.5 Goals</div>
                                    </div>

                                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-white opacity-80 transform hover:scale-[1.02] transition-transform">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-sm tracking-tight text-teal-400">Match 4921.D</span>
                                            <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-widest">65% Match</span>
                                        </div>
                                        <div className="font-black text-lg mb-1">Real Madrid vs Barca</div>
                                        <div className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">Prediction: Home Win</div>
                                    </div>


                                </div>
                            </div>
                        </motion.div>

                        {/* Floating elements */}


                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;