import type { NextPage } from 'next';
import SEO from '../components/SEO';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGithub, FiHeart, FiCode, FiMessageSquare } from 'react-icons/fi';
import Footer from '../components/landing/Footer';

const Contribute: NextPage = () => {
    return (
        <>
            <SEO
                title="Contribute | SafeScore"
                description="Join the community and help us build the most accurate football prediction platform."
            />
            <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md px-4 py-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Home</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <img src="/logos.png" alt="SafeScore" className="h-8" />
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                            Join the Mission
                        </h1>

                        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                            SafeScore is built in public, with an open-source frontend and platform layer.
                            While the core prediction engine is private by design, contributors can help improve
                            the UI, data presentation, performance tracking, and overall user experience.
                            Whether you’re a developer, designer, data enthusiast, or football fan,
                            there’s meaningful work you can contribute.
                        </p>

                        <p className="text-zinc-500 text-sm mt-4 max-w-2xl">
                            The prediction logic itself is proprietary, but contributors can shape how predictions
                            are evaluated, visualized, verified, and communicated to users.
                        </p>

                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FiCode className="text-blue-500 text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Code Contributions</h3>
                            <p className="text-zinc-400 mb-6 font-medium">
                                Help us improve the frontend, optimize our data fetching, or add new leagues. We love clean code and innovative features.
                            </p>
                            <a href="https://github.com/devtofunmi/safescore" className="inline-flex items-center gap-2 text-white font-bold hover:gap-3 transition-all">
                                Browse Repository <FiGithub />
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 hover:border-amber-500/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FiHeart className="text-amber-500 text-2xl" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Support & Feedback</h3>
                            <p className="text-zinc-400 mb-6 font-medium">
                                Not a dev? No problem. Reporting bugs, suggesting improvements, or sharing SafeScore with your friends helps just as much.
                            </p>
                            <Link href="/history" className="inline-flex items-center gap-2 text-white font-bold hover:gap-3 transition-all">
                                See History Stats <FiArrowLeft className="rotate-180" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 hover:border-green-500/50 transition-all group md:col-span-2"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-8">
                                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FiMessageSquare className="text-green-500 text-3xl" />
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-bold mb-3">Community Hub</h3>
                                    <p className="text-zinc-400 font-medium">
                                        Join our discussions on GitHub. Share your prediction strategies, discuss match outcomes, and connect with other users.
                                    </p>
                                </div>
                                <a href="https://github.com/devtofunmi/safescore/discussions" className="flex-shrink-0 inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all whitespace-nowrap w-full md:w-auto">
                                    Join Discussion
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-extrabold mb-4">Ready to start?</h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto font-medium">
                                Read our contribution guidelines to learn more about our development process and how to propose changes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="https://github.com/devtofunmi/safescore/blob/main/CONTRIBUTING.md"
                                    className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                                >
                                    Contribution Guide
                                </a>
                                <a
                                    href="https://github.com/devtofunmi/safescore"
                                    className="px-8 py-4 bg-zinc-800 text-white rounded-2xl font-bold hover:bg-zinc-700 transition-all hover:scale-105 active:scale-95 border border-zinc-700"
                                >
                                    Fork on GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default Contribute;