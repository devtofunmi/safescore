import Head from 'next/head';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <Head>
                <title>SafeScore - Data-Driven Football Predictions</title>
                <meta name="description" content="Stop guessing. Start winning with SafeScore algorithmic football predictions." />
                <link rel="icon" href="/logo.png" />
            </Head>

            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <Footer />
        </div>
    );
}