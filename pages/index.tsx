import React from 'react';
import SEO from '../components/SEO';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Testimonials from '../components/landing/Testimonials';
import HowItWorks from '../components/landing/HowItWorks';
import Footer from '../components/landing/Footer';

import PWAInstallPrompt from '../components/landing/PWAInstallPrompt';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#050505]">
            <SEO />

            <Navbar />
            <Hero />
            <Features />
            <Testimonials />
            <HowItWorks />
            <Footer />
            <PWAInstallPrompt />
        </div>
    );
}