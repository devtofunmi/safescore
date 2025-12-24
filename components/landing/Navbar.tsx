import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed w-full z-[1000] transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-transparent'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => router.push('/')}>
                        <img src="/logos.png" alt="SafeScore" className="h-10" />
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-600 dark:text-gray-300 hover:text-blue-500 cursor-pointer font-bold transition-colors">How it works</button>
                        <Link href="/previous-matches" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 font-bold transition-colors">
                            Previous Matches
                        </Link>
                        <button
                            onClick={() => router.push('/home')}
                            className="bg-blue-400 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-500 cursor-pointer transition-all shadow-lg shadow-blue-400/30 hover:scale-105 active:scale-95"
                        >
                            Launch App
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMobileMenu} className="text-gray-600 dark:text-white p-2">
                            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu (Full Screen Overlay) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="md:hidden fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center justify-center overflow-hidden"
                    >
                        {/* Close Button Inside Menu */}
                        <button
                            onClick={toggleMobileMenu}
                            className="absolute top-6 right-6 text-gray-600 dark:text-white p-2"
                        >
                            <FaTimes size={32} />
                        </button>

                        <div className="flex flex-col items-center space-y-10">
                            <img src="/logos.png" alt="SafeScore" className="h-12 mb-10" />

                            <button
                                onClick={() => {
                                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                                    setMobileMenuOpen(false);
                                }}
                                className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 hover:text-blue-500 transition-colors"
                            >
                                How it works
                            </button>

                            <Link
                                href="/previous-matches"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 hover:text-blue-500 transition-colors"
                            >
                                Previous Matches
                            </Link>

                            <button
                                onClick={() => {
                                    router.push('/home');
                                    setMobileMenuOpen(false);
                                }}
                                className="bg-blue-400 text-white px-12 py-4 rounded-2xl text-2xl font-black hover:bg-blue-500 shadow-2xl shadow-blue-400/30 transition-transform active:scale-95"
                            >
                                Launch App
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
};

export default Navbar;
