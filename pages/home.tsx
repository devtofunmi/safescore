import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import { IoStatsChartOutline } from 'react-icons/io5';

import RiskLevelSelector from '../components/home/RiskLevelSelector';
import LeagueSelector from '../components/home/LeagueSelector';
import DaySelector from '../components/home/DaySelector';
import Summary from '../components/home/Summary';
import Footer from '../components/landing/Footer';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '../components/DashboardLayout';


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
    <p className="text-white text-xl mt-4 font-extrabold animate-pulse tracking-tight">
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
    <DashboardLayout>
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

      {/* Main Content */}
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-12"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
              Prediction <span className="text-blue-500">Engine</span>
            </h1>
            <p className="mt-4 text-neutral-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto">Configure your filters to generate high-confidence predictions powered by SafeScore's proprietary analysis engine.</p>
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
      </div>

      
    </DashboardLayout>
  );
};

export default Home;