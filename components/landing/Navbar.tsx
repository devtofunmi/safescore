import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/logos.png" alt="SafeScore" className="h-10" />
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-600 dark:text-gray-300 hover:text-blue-500 cursor-pointer font-medium">How it works</button>
                        <button
                            onClick={() => router.push('/home')}
                            className="bg-blue-400 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-500 cursor-pointer transition-colors shadow-lg shadow-blue-400/30"
                        >
                            Launch App
                        </button>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;