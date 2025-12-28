import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/lib/auth';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, signOut } = useAuth();
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

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed w-full z-[1000] transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50' : 'bg-transparent'}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => router.push('/')}>
                            <img src="/logos.png" alt="SafeScore" className="h-10" />
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-10">
                            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-400 hover:text-white cursor-pointer font-bold transition-all text-sm tracking-tight">How it works</button>
                            <Link href="/previous-matches" className="text-gray-400 hover:text-white font-bold transition-all text-sm tracking-tight cursor-pointer">
                                Previous Matches
                            </Link>

                            {user ? (
                                <div className="flex items-center gap-6">
                                    <Link href="/dashboard" className="text-gray-400 hover:text-white font-bold transition-all text-sm tracking-tight cursor-pointer">
                                        Dashboard
                                    </Link>
                                    <div className="h-4 w-[1px] bg-white/10 italic"></div>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 text-red-500/80 hover:text-red-500 font-bold transition-all text-sm cursor-pointer"
                                    >
                                        <FaSignOutAlt className="text-xs" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <Link href="/auth/login" className="text-gray-400 hover:text-white font-bold transition-all text-sm tracking-tight cursor-pointer">
                                        Login
                                    </Link>
                                    <button
                                        onClick={() => router.push('/auth/signup')}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-500 cursor-pointer transition-all shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 text-sm"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button onClick={toggleMobileMenu} className="text-gray-600 dark:text-white p-2">
                                {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu (Full Screen Overlay) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="md:hidden fixed inset-0 z-[1001] bg-white dark:bg-black flex flex-col items-center justify-center overflow-hidden h-[100dvh]"
                    >
                        {/* Close Button Inside Menu */}
                        <button
                            onClick={toggleMobileMenu}
                            className="absolute top-6 right-6 text-gray-600 dark:text-white p-2"
                        >
                            <FaTimes size={32} />
                        </button>

                        <div className="flex flex-col items-center space-y-10 w-full px-6">
                            <img src="/logos.png" alt="SafeScore" className="h-12 mb-10" />

                            <button
                                onClick={() => {
                                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                                    setMobileMenuOpen(false);
                                }}
                                className="text-xl font-extrabold text-gray-800 dark:text-gray-100 hover:text-blue-500 transition-colors"
                            >
                                How it works
                            </button>

                            <Link
                                href="/previous-matches"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-xl font-extrabold text-gray-800 dark:text-gray-100 hover:text-blue-500 transition-colors"
                            >
                                Previous Matches
                            </Link>

                            <div className="w-full h-[1px] bg-gray-200 dark:bg-white/10 my-2"></div>

                            {user ? (
                                <>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-xl font-extrabold text-blue-500 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-xl font-extrabold text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                                    >
                                        <FaSignOutAlt />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-xl font-extrabold text-gray-800 dark:text-gray-100 hover:text-blue-500 transition-colors"
                                    >
                                        Login
                                    </Link>
                                    <button
                                        onClick={() => {
                                            router.push('/auth/signup');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-xl font-black hover:bg-blue-500 shadow-2xl shadow-blue-600/30 transition-transform active:scale-95 w-full"
                                    >
                                        Join Now
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
