import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

import RiskLevelSelector from '../components/home/RiskLevelSelector';
import LeagueSelector from '../components/home/LeagueSelector';
import DaySelector from '../components/home/DaySelector';
import Summary from '../components/home/Summary';
import Footer from '../components/landing/Footer';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useAuth } from '@/lib/auth';


const LoadingText = () => {
  const [text, setText] = useState('Initializing prediction engine...');

  useEffect(() => {
    const messages = [
      'Scanning daily fixture list...',
      'Analyzing team form and recent performance...',
      'Comparing head-to-head statistics...',
      'Calculating goal probabilities...',
      'Applying statistical models...',
      'Finalizing high-confidence predictions...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < messages.length - 1) {
        i++;
        setText(messages[i]);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-white text-xl mt-4 font-bold animate-pulse">
      {text}
    </p>
  );
};


const Home: NextPage = () => {
  const router = useRouter();
  const [oddsType, setOddsType] = useState('safe');
  const [day, setDay] = useState('today');
  const [loading, setLoading] = useState(false);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['Premier League', 'Championship', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League']);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [loading]);

  const leagues = [
    'Premier League',
    'Championship',
    'La Liga',
    'Bundesliga',
    'Serie A',
    'Serie B',
    'Ligue 1',
    'Eredivisie',
    'Primeira Liga',
    'Super Lig',
    'Greek Super League',
    'Allsvenskan',
    'Champions League',
    'Europa League',
  ];

  const handleLeagueChange = (league: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(league)
        ? prev.filter((l) => l !== league)
        : [...prev, league]
    );
  };

  const handleSelectAllLeagues = () => {
    if (selectedLeagues.length === leagues.length) {
      setSelectedLeagues([]);
    } else {
      setSelectedLeagues(leagues);
    }
  };

  const handleGeneratePredictions = async () => {
    if (selectedLeagues.length === 0) {
      toast.warning('Please select at least one league to get started!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oddsType,
          leagues: selectedLeagues,
          day,
        }),
      });

      const data = await response.json();

      // Log the raw API response for debugging in the browser console
      try {
        console.debug('API /api/predictions response status:', response.status, 'body:', data);
      } catch (e) {
        console.debug('Failed to log API response', e);
      }

      // Store predictions in session and navigate to results
      sessionStorage.setItem('predictions', JSON.stringify(data.predictions));

      // Track prediction generation event
      track('generate_predictions', {
        risk_level: oddsType,
        leagues_count: selectedLeagues.length,
        day: day
      });

      sessionStorage.setItem('filters', JSON.stringify({
        oddsType,
        leagues: selectedLeagues,
        day,
      }));

      router.push('/results');
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast.error('Prediction generation failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <SEO
        title="Dashboard"
        description="Filter high-probability match outcomes by risk level and league."
      />

      {loading && (
        <div className="fixed inset-0 bg-black flex flex-col justify-center items-center z-[100]">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-400"></div>
          <LoadingText />
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b-2 py-3 dark:border-[#18181b] border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 dark:bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex-shrink-0 flex items-center cursor-pointer" >
                <img src="/logos.png" alt="SafeScore" className="h-10" />
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right ">
                <p className="text-sm font-bold text-gray-300">
                  Low-Risk Betting Intelligence
                </p>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Prediction <span className="text-blue-400">Dashboard</span>
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">Configure your filters to get the most accurate predictions.</p>
          </div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <RiskLevelSelector oddsType={oddsType} setOddsType={setOddsType} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <LeagueSelector
              selectedLeagues={selectedLeagues}
              handleLeagueChange={handleLeagueChange}
              handleSelectAllLeagues={handleSelectAllLeagues}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <DaySelector day={day} setDay={setDay} />
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Summary
              oddsType={oddsType}
              selectedLeagues={selectedLeagues}
              day={day}
              loading={loading}
              handleGeneratePredictions={handleGeneratePredictions}
            />
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;