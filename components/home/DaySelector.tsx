import React from 'react';
import { MdCalendarToday, MdDateRange, MdEmojiEvents } from 'react-icons/md';

interface DaySelectorProps {
  day: string;
  setDay: (day: string) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ day, setDay }) => {
  return (
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
              className={`border-2 p-6 cursor-pointer rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${day === option.id
                ? 'border-blue-400 bg-blue-400 text-white shadow-lg shadow-blue-400/20'
                : 'border-[#18181b] bg-black text-gray-300 hover:border-blue-400/50 hover:bg-[#18181b]'
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
  );
};

export default DaySelector;