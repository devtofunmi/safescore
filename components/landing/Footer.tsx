import React from 'react';
import { FiCoffee } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';
import { FaXTwitter } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';


const Footer: React.FC = () => {
    const { user } = useAuth();

    return (
        <footer className="bg-[#050505] border-t border-white/5 relative overflow-hidden">


            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ duration: 0.8 }}
                className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative z-10"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 lg:col-span-2">
                        <img src="/logos.png" alt="SafeScore" className="h-10 mb-6" />
                        <p className="text-lg text-gray-400 max-w-sm font-medium leading-relaxed">
                            Algorithmic football predictions engineered for precision. We analyze the variables so you can focus on the play.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-tight">Platform</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm font-bold cursor-pointer">Home</Link>
                            <Link href="/changelog" className="text-gray-500 hover:text-white transition-colors text-sm font-bold cursor-pointer">Changelog</Link>
                            <Link href="/contribute" className="text-gray-500 hover:text-white transition-colors text-sm font-bold cursor-pointer">Contribute</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 tracking-tight">Account</h4>
                        <div className="flex flex-col gap-4">
                            {!user ? (
                                <>
                                    <Link href="/auth/login" className="text-gray-500 hover:text-white transition-colors text-sm font-bold cursor-pointer">Login</Link>
                                    <Link href="/auth/signup" className="text-gray-500 hover:text-white transition-colors text-sm font-bold cursor-pointer">Create Account</Link>
                                </>
                            ) : (
                                <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors text-sm font-bold cursor-pointer">Dashboard</Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center space-x-2 text-gray-500 text-sm font-medium">
                        <span>Built with</span>
                        <FiCoffee className="text-blue-400" />
                        <span>and</span>
                        <AiOutlineHeart className="text-red-500" />
                        <span>by</span>
                        <a
                            href="https://twitter.com/codebreak_er"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-blue-400 transition-colors font-bold cursor-pointer"
                        >
                            @codebreak_er
                        </a>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://twitter.com/intent/tweet?text=Check%20out%20SafeScore%20for%20data-driven%20football%20predictions!&url=https://www.safescore.pro&hashtags=SafeScore,FootballPredictions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 cursor-pointer shadow-xl"
                        >
                            <FaXTwitter className="text-blue-400" />
                            Share on X
                        </a>
                    </div>
                </div>

                <div className="mt-16 flex flex-col items-center">
                    <p className="text-xs text-gray-600 mb-8">
                        &copy; 2025 SafeScore Architecture. All rights reserved.
                    </p>

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl w-full max-w-4xl backdrop-blur-sm">
                        <p className="text-[10px] text-gray-500 text-center leading-relaxed uppercase tracking-widest font-bold">
                            <strong>Responsible Gambling:</strong> SafeScore provides statistical analysis, not financial advice. Betting involves significant risk. Please play responsibly and within your means.
                        </p>
                    </div>
                </div>
            </motion.div>
        </footer>
    );
};

export default Footer;