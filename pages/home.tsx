import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

import RiskLevelSelector from '../components/home/RiskLevelSelector';
import LeagueSelector from '../components/home/LeagueSelector';
import DaySelector from '../components/home/DaySelector';
import Summary from '../components/home/Summary';
import Footer from '../components/landing/Footer';
import Link from 'next/link';

const Home: NextPage = () => {
  const router = useRouter();
  const [oddsType, setOddsType] = useState('safe');
  const [day, setDay] = useState('today');
  const [loading, setLoading] = useState(false);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>(['Premier League', 'Championship', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'Champions League']);

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
      <Head>
        <title>SafeScore - Data-Driven Football Predictions</title>
        <meta
          name="description"
          content="Algorithmic football predictions for safe bets."
        />
        <link rel="icon" href="/logo.png" />
      </Head>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-100">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-400"></div>
          <p className="text-white text-xl mt-4">safescore is predicting games...</p>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b-2 py-3 dark:border-[#18181b] border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 dark:bg-black/50">
        <div className="mx-auto max-w-7xl">
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
        <div className="space-y-12">
          <RiskLevelSelector oddsType={oddsType} setOddsType={setOddsType} />
          <LeagueSelector
            selectedLeagues={selectedLeagues}
            handleLeagueChange={handleLeagueChange}
            handleSelectAllLeagues={handleSelectAllLeagues}
          />
          <DaySelector day={day} setDay={setDay} />
          <Summary
            oddsType={oddsType}
            selectedLeagues={selectedLeagues}
            day={day}
            loading={loading}
            handleGeneratePredictions={handleGeneratePredictions}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
