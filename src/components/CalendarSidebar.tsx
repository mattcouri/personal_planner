// components/CalendarSidebar.tsx
import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onQuickAdd: () => void;
}

export default function CalendarSidebar({
  currentDate,
  onDateChange,
  onQuickAdd,
}: CalendarSidebarProps) {
  const startWeek = startOfWeek(currentDate, { weekStartsOn: 0 });

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary-500" />
          Weekly View
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Click a day to navigate
        </p>
      </div>

      <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 7 }, (_, i) => {
          const date = addDays(startWeek, i);
          const isToday = isSameDay(date, new Date());
          const isSelected = isSameDay(date, currentDate);

          return (
            <button
              key={i}
              onClick={() => onDateChange(date)}
              className={`w-full text-left p-4 flex items-center justify-between transition-all duration-200 ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div>
                <p className="text-sm font-semibold">
                  {format(date, 'EEEE')}
                </p>
                <p className="text-xs">{format(date, 'MMM d')}</p>
              </div>
              {isToday && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onQuickAdd}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:scale-105 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add</span>
        </button>
      </div>
    </div>
  );
}
