import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Grid3X3,
  List,
  Eye,
  BarChart3,
  Clock
} from 'lucide-react';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarView } from '../../types/calendar';
import { format } from 'date-fns';

const CalendarHeader: React.FC = () => {
  const {
    currentView,
    currentDate,
    setCurrentView,
    navigateDate,
    goToToday
  } = useCalendarStore();

  const viewOptions: Array<{ key: CalendarView; icon: any; label: string }> = [
    { key: 'day', icon: Eye, label: 'Day' },
    { key: '4days', icon: Clock, label: '4 Days' },
    { key: 'week', icon: List, label: 'Week' },
    { key: 'month', icon: Grid3X3, label: 'Month' },
    { key: 'year', icon: BarChart3, label: 'Year' },
    { key: 'agenda', icon: CalendarIcon, label: 'Agenda' },
  ];

  const getDateTitle = () => {
    switch (currentView) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case '4days':
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + (currentView === '4days' ? 3 : 6));
        return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'year':
        return format(currentDate, 'yyyy');
      case 'agenda':
        return format(currentDate, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Date Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigateDate('prev')}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="text-center min-w-[250px]">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getDateTitle()}
          </h2>
        </div>

        <button
          onClick={() => navigateDate('next')}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-200"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
        >
          Today
        </button>
      </div>

      {/* View Switcher */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {viewOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setCurrentView(key)}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
              currentView === key 
                ? 'bg-primary-500 text-white shadow-lg' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={label}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarHeader;