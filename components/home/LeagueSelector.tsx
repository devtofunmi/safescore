import React from 'react';

interface LeagueSelectorProps {
  selectedLeagues: string[];
  handleLeagueChange: (league: string) => void;
  handleSelectAllLeagues: () => void;
}

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

const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  selectedLeagues,
  handleLeagueChange,
  handleSelectAllLeagues,
}) => {
  return (
    <section className="p-5 md:p-8 bg-[#0c0c0c] border border-white/5 rounded-3xl">
      <h2 className="mb-6 text-2xl font-extrabold tracking-tight">
        2. Select Leagues
      </h2>
      <p className="mb-6 font-medium text-neutral-500 leading-relaxed">
        Choose one or more leagues
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label
          key="select-all"
          className={`flex cursor-pointer items-center space-x-3 rounded-full border px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-bold transition-all ${selectedLeagues.length === leagues.length
            ? 'border-blue-500/20 bg-blue-500 text-white shadow-md shadow-blue-500/20'
            : 'border-white/5 bg-[#0a0a0a] text-neutral-300 hover:border-blue-500/30 hover:bg-white/[0.03]'
            }`}
        >
          <input
            type="checkbox"
            className="appearance-none h-5 w-5 cursor-pointer rounded-full border-2 border-neutral-500 bg-transparent checked:border-blue-500 checked:bg-blue-500 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')] bg-center bg-no-repeat transition-all"
            checked={selectedLeagues.length === leagues.length}
            onChange={handleSelectAllLeagues}
          />
          <span>Select All</span>
        </label>
        {leagues.map((league) => (
          <label
            key={league}
            className={`flex cursor-pointer items-center space-x-3 rounded-full border px-3 py-2 md:px-4 md:py-3 text-sm md:text-base font-bold transition-all ${selectedLeagues.includes(league)
              ? 'border-blue-500/20 bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'border-white/5 bg-[#0a0a0a] text-neutral-300 hover:border-blue-500/30 hover:bg-white/[0.03]'
              }`}
          >
            <input
              type="checkbox"
              className="appearance-none h-5 w-5 cursor-pointer rounded-full border-2 border-neutral-500 bg-transparent checked:border-blue-500 checked:bg-blue-500 checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')] bg-center bg-no-repeat transition-all"
              checked={selectedLeagues.includes(league)}
              onChange={() => handleLeagueChange(league)}
            />
            <span>{league}</span>
          </label>
        ))}
      </div>
      {selectedLeagues.length > 0 && (
        <p className="mt-4 font-medium text-neutral-500">
          Selected: {selectedLeagues.length} league{selectedLeagues.length !== 1 ? 's' : ''}
        </p>
      )}
    </section>
  );
};

export default LeagueSelector;