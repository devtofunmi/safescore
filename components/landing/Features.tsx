import React from 'react';
import { FaChartLine, FaShieldHalved, FaEarthAmericas, FaBolt } from 'react-icons/fa6';
import { motion } from 'framer-motion';

const features = [
    {
        name: 'Smart Risk Filtering',
        description:
            'Choose between Safe, Very Safe, or Medium Safe. The system adjusts confidence thresholds based on your selected risk level. Matches are filtered strictly to ensure only the highest probability outcomes make the cut.',
        icon: FaShieldHalved,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Risk Setting</span>
                        <span className="bg-green-500 text-xs px-2 py-1 rounded">SAFE MODE</span>
                    </div>
                    <div className="text-sm opacity-80">Threshold: &gt; 85% Probability</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Arsenal vs Chelsea</span>
                        <span className="bg-green-500 text-xs px-2 py-1 rounded">PASSED</span>
                    </div>
                    <div className="text-sm opacity-80">Confidence: 89% (Safe)</div>
                </div>
            </div>
        )
    },
    {
        name: 'Global League Coverage',
        description:
            'Coverage across 14+ major leagues, from the Premier League to the Eredivisie. We analyze lesser-known leagues where value bets are often hidden, using consistent statistical analysis across the board.',
        icon: FaEarthAmericas,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Premier League</span>
                        <span className="bg-blue-600 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-sm opacity-80">6 Matches Analyzed</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-90">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">La Liga</span>
                        <span className="bg-blue-600 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-sm opacity-80">4 Matches Analyzed</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Eredivisie</span>
                        <span className="bg-blue-600 text-xs px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="text-sm opacity-80">3 Matches Analyzed</div>
                </div>
            </div>
        )
    },
    {
        name: 'Data-Driven Insights',
        description:
            'Predictions are generated using match stats, team form, and historical data — not gut feeling. We accept that no system is perfect, but data beats guessing every time in the long run.',
        icon: FaChartLine,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Team Form</span>
                        <span className="bg-purple-500 text-xs px-2 py-1 rounded">High</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2 mt-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <div className="text-xs mt-1 opacity-70">Last 5: W W D W W</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-90">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">H2H Record</span>
                        <span className="bg-purple-500 text-xs px-2 py-1 rounded">Advantage</span>
                    </div>
                    <div className="text-sm opacity-80">Home team won 4 of last 5</div>
                </div>
            </div>
        )
    },
    {
        name: 'Instant & Free',
        description:
            'No signup required. No paywalls. Access predictions instantly while the platform is in active testing. We believe in transparency and providing value first.',
        icon: FaBolt,
        visual: (
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Subscription</span>
                        <span className="bg-yellow-500 text-xs px-2 py-1 rounded text-black font-bold">FREE</span>
                    </div>
                    <div className="text-sm opacity-80">$0.00 / Month</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white opacity-80">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Access</span>
                        <span className="bg-green-500 text-xs px-2 py-1 rounded">Granted</span>
                    </div>
                    <div className="text-sm opacity-80">Instant Analysis Unlocked</div>
                </div>
            </div>
        )
    },
];

const Features: React.FC = () => {
    return (
        <div id="features" className="py-32 bg-[#050505] overflow-hidden relative">

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-32"
                >
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-[0.2em] mb-6"
                    >
                        Features
                    </motion.span>
                    <h2 className="text-4xl font-black tracking-tight text-white sm:text-6xl mb-6">
                        Why Bettors  <br />
                        <span className="text-blue-600">Trust SafeScore</span>
                    </h2>
                    <p className="mt-4 max-w-2xl text-lg text-gray-400 mx-auto leading-relaxed font-medium">
                        We don't promise <span className="text-blue-600">"guaranteed"</span>  wins. We provide
                        statistical insights designed to help you make smarter decisions over time.
                    </p>
                </motion.div>

                <div className="space-y-40">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className={`flex flex-col lg:flex-row gap-16 lg:gap-24 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                        >
                            {/* Text Section */}
                            <div className="flex-1 text-left">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 p-4 shadow-xl shadow-blue-500/20 mb-8"
                                >
                                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </motion.div>
                                <h3 className="text-3xl font-bold tracking-tight text-white mb-6">
                                    {feature.name}
                                </h3>
                                <p className="text-lg text-gray-400 leading-relaxed font-medium mb-8">
                                    {feature.description}
                                </p>
                                <button
                                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-300 transition-colors gap-2 group cursor-pointer"
                                >
                                    Learn more
                                    <FaBolt className="text-[10px] group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            {/* Visual Card Section */}
                            <div className="flex-1 w-full relative">
                                <motion.div
                                    whileInView={{ rotate: index % 2 === 0 ? 1 : -1 }}
                                    className="relative transform bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex"
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
                                            <div className="h-1.5 w-20 bg-white/10 rounded-full"></div>
                                            <div className="h-4 w-4 rounded-full bg-white/10"></div>
                                        </div>

                                        {/* Abstract background blobs for cards */}
                                        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl`}></div>
                                        <div className={`absolute -bottom-20 -left-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl`}></div>

                                        {/* Card Content */}
                                        <div className="relative z-10 min-h-[180px] flex items-center justify-center">
                                            <div className="w-full">
                                                {feature.visual}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Features;