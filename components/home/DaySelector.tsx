import React from 'react';
import { MdCalendarToday, MdDateRange, MdEmojiEvents } from 'react-icons/md';

interface DaySelectorProps {
  day: string;
  setDay: (day: string) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ day, setDay }) => {
  return (
    <section className="p-8 bg-[#0c0c0c] border border-white/5 rounded-3xl">
      <h2 className="mb-6 text-2xl font-extrabold tracking-tight">3. Select Match Day</h2>
      <p className="mb-6 font-medium text-neutral-500 leading-relaxed">Choose when to search matches</p>
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
              className={`border p-6 cursor-pointer rounded-2xl font-bold text-lg transition-all transform hover:scale-105 ${day === option.id
                ? 'border-blue-500/20 bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'border-white/5 bg-[#0a0a0a] text-neutral-300 hover:border-blue-500/30 hover:bg-white/[0.03]'
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