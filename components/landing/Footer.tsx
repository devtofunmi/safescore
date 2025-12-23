import React from 'react';
import { FiCoffee } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';
import { FaXTwitter } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import Link from 'next/link';


const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-black ">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-50px" }}
                transition={{ duration: 0.8 }}
                className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
            >
                <div className="flex border-t border-gray-200 dark:border-zinc-800 flex-col md:flex-row justify-between items-start gap-6 pt-10">
                    <div className="text-left">
                        <img src="/logos.png" alt="SafeScore" className="h-10" />
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            Algorithmic football predictions. We analyze stats so you don&apos;t have to.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-8 text-sm font-medium">
                        <Link href="/" className="text-gray-500 hover:text-blue-400 transition-colors">Home</Link>
                        <Link href="/history" className="text-gray-500 hover:text-blue-400 transition-colors">History</Link>
                        <Link href="/changelog" className="text-gray-500 hover:text-blue-400 transition-colors">Changelog</Link>
                        <Link href="/contribute" className="text-gray-500 hover:text-blue-400 transition-colors tracking-tight">Contribute</Link>
                    </div>
                </div>
                <div className="mt-12 flex justify-center ">
                    <a
                        href="https://twitter.com/intent/tweet?text=Check%20out%20SafeScore%20for%20data-driven%20football%20predictions!&url=https://www.safescore.pro&hashtags=SafeScore,FootballPredictions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-zinc-700 bg-white dark:bg-black px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                        <FaXTwitter className="text-blue-400" />
                        Share SafeScore on X
                    </a>
                </div>

                <div className="mt-8 border-t border-gray-200 dark:border-zinc-800 pt-8 flex flex-col items-center">

                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-4">
                        <span>Made with</span>
                        <FiCoffee className="" />
                        <span>and</span>
                        <AiOutlineHeart className="text-red-600" />
                        <span>by</span>
                        <a
                            href="https://twitter.com/codebreak_er"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
                        >
                            <FaXTwitter className="" />
                            <span>codebreak_er</span>
                        </a>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        &copy; 2025 SafeScore. All rights reserved.
                    </p>

                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg w-full max-w-3xl">
                        <p className="text-xs text-yellow-800 dark:text-yellow-600 text-center">
                            <strong>Responsible Gambling Warning:</strong> Betting involves risk. The predictions provided by SafeScore are for informational purposes only. We do not guarantee wins. Please bet responsibly and only with money you can afford to lose. If you or someone you know has a gambling problem, seek help from local authorities.
                        </p>
                    </div>
                </div>
            </motion.div>
        </footer>
    );
};

export default Footer;