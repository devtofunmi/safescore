import type { NextPage } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { MdShield, MdCheckCircle, MdThunderstorm, MdCalendarToday, MdDateRange, MdEmojiEvents } from 'react-icons/md';
import { FiCoffee } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';
import { FaXTwitter } from 'react-icons/fa6';
import React from 'react';

const Home: NextPage = () => {
  const router = useRouter();
  const [oddsType, setOddsType] = useState('safe');
  const [day, setDay] = useState('today');
  const [loading, setLoading] = useState(false);
  

  

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

  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);

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
      alert('Please select at least one league');
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
      alert('Error generating predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <Head>
        <title>SafeScore - AI Football Predictions</title>
        <meta
          name="description"
          content="AI-powered football predictions for safe bets."
        />
        <link rel="icon" href="/logo.png" />
      </Head>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-100">
            <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-white text-xl mt-4">safescore is predicting games...</p>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b-2 py-3 dark:border-[#18181b] border-gray-200 bg-white/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 dark:bg-black/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <img src="/logos.png" alt="SafeScore Logo" className="h-12" />
            </div>
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
          {/* Risk Level Selection */}
          <section className="card">
            <h2 className="mb-6 text-2xl font-extrabold">
              1. Select Risk Level
            </h2>
            <p className="mb-6 font-bold text-gray-300">
              Choose your preferred betting risk profile
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { id: 'verysafe', label: 'Very Safe', icon: MdShield },
                { id: 'safe', label: 'Safe', icon: MdCheckCircle },
                { id: 'mediumsafe', label: 'Medium-Safe', icon: MdThunderstorm },
              ].map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setOddsType(option.id)}
                    className={`border-2 p-6 cursor-pointer rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      oddsType === option.id
                        ? 'border-[#18181b] bg-[#18181b] text-gray-100'
                        : 'border-[#18181b] bg-black hover:bg-[#18181b]'
                    }`}
                  >
                    <div className="text-3xl mb-2 flex justify-center">
                      <IconComponent />
                    </div>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* League Selection */}
          <section className="card">
            <h2 className="mb-6 text-2xl font-extrabold">
              2. Select Leagues
            </h2>
            <p className="mb-6 font-bold text-gray-300">
              Choose one or more leagues
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label
                key="select-all"
                className={`flex cursor-pointer  items-center space-x-3 rounded-full border-2 px-4 py-3 font-bold transition-all ${
                  selectedLeagues.length === leagues.length
                    ? 'border-gray-[#18181b] bg-[#18181b] text-gray-100'
                    : 'border-gray-[#18181b] bg-black text-white hover:border-[#18181b]'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 cursor-pointer rounded accent-white"
                  checked={selectedLeagues.length === leagues.length}
                  onChange={handleSelectAllLeagues}
                />
                <span>Select All</span>
              </label>
              {leagues.map((league) => (
                <label
                  key={league}
                  className={`flex cursor-pointer items-center space-x-3 rounded-full border-2 px-4 py-3 font-bold transition-all ${
                    selectedLeagues.includes(league)
                      ? 'border-[#18181b] bg-[#18181b] text-white border-gray-[#18181b] bg-[#18181b]text-gray-100'
                      : '  border-[#18181b] bg-black text-white hover:border-[#18181b]'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 cursor-pointer rounded accent-white"
                    checked={selectedLeagues.includes(league)}
                    onChange={() => handleLeagueChange(league)}
                  />
                  <span>{league}</span>
                </label>
              ))}
            </div>
            {selectedLeagues.length > 0 && (
              <p className="mt-4 font-boldtext-gray-300">
                Selected: {selectedLeagues.length} league{selectedLeagues.length !== 1 ? 's' : ''}
              </p>
            )}
          </section>

          {/* Match Day Selection */}
          <section className="card">
            <h2 className="mb-6 text-2xl font-extrabold">3. Select Match Day</h2>
            <p className="mb-6 font-bold text-gray-300">Choose when to search matches</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { id: 'today', label: 'Today', icon: MdCalendarToday },
                { id: 'tomorrow', label: 'Tomorrow', icon: MdDateRange },
                { id: 'weekend', label: 'Weekend', icon: MdEmojiEvents },
              ].map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setDay(option.id)}
                    className={`border-2 p-6 cursor-pointer rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      day === option.id
                        ? 'border-[#18181b] border-gray-[[#18181b] bg-[#18181b] text-gray-100'
                        : 'border-[#18181b] bg-black text-white  hover:bg-[#18181b]'
                    }`}
                  >
                    <div className="text-3xl mb-2 flex justify-center">
                      <IconComponent />
                    </div>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Summary and Generate Button */}
          <section className="bg-[#18181b] text-gray-100 border-gray-700 p-5 rounded-xl">
            <h3 className="mb-4 text-xl font-extrabold">Your Selection</h3>
            <div className="mb-6 space-y-2 font-bold">
              <p>Risk Level: <span className="font-extrabold">{oddsType.toUpperCase()}</span></p>
              <p>Leagues: <span className="font-extrabold">{selectedLeagues.length} selected</span></p>
              <p>Match Day: <span className="font-extrabold">{day.charAt(0).toUpperCase() + day.slice(1)}</span></p>
            </div>
            <button
              onClick={handleGeneratePredictions}
              disabled={loading}
              className="w-full rounded-xl cursor-pointer border-2 border-gray-200 bg-gray-200 px-8 py-4 text-xl font-extrabold text-black transition-all hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Predictions...' : 'Generate Predictions'}
            </button>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#18181b]  px-4 py-8 sm:px-6 lg:px-8 bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            
            <div className="mt-4 flex items-center justify-center space-x-2 font-bold text-gray-600">
              <span>Made with</span>
              <FiCoffee className="text-lg" />
              <span>and</span>
              <AiOutlineHeart className="text-lg text-red-600" />
              <span>by</span>
              <a
                href="https://twitter.com/codebreak_er"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <FaXTwitter className="text-lg" />
                <span>codebreak_er</span>
              </a>
            </div>
            
          <p className="font-bold mt-5 text-gray-600">© 2025 SafeScore - AI-Powered Football Predictions</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;