
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
  );
};

export default LeagueSelector;
