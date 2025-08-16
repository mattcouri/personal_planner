import React, { useState } from 'react';
import { 
  Menu, ChevronLeft, ChevronRight, Search, HelpCircle, 
  Settings, MoreHorizontal, Calendar as CalendarIcon,
  ChevronDown, User
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

  const [showViewDropdown, setShowViewDropdown] = useState(false);

  const viewOptions: Array<{ key: CalendarView; label: string }> = [
    { key: 'day', label: 'Day' },
    { key: '4days', label: '4 Days' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'agenda', label: 'Schedule' },
  ];

  const getCurrentViewLabel = () => {
    const view = viewOptions.find(v => v.key === currentView);
    return view?.label || 'Week';
  };

  const getDateTitle = () => {
    switch (currentView) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case '4days':
      case 'week':
        return format(currentDate, 'MMMM yyyy');
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

  const getWeekNumber = () => {
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (currentDate.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Section - Logo + Navigation */}
        <div className="flex items-center space-x-6">
          {/* Hamburger Menu */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-normal text-gray-700 dark:text-gray-300">Calendar</span>
          </div>
          
          {/* Today Button */}
          <button
            onClick={goToToday}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors duration-200"
          >
            Today
          </button>
          
          {/* Date Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          {/* Current Date/Month */}
          <h1 className="text-xl font-normal text-gray-700 dark:text-gray-300">
            {getDateTitle()}
          </h1>
          
          {/* Week Number (like Google) */}
          {(currentView === 'week' || currentView === '4days') && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Week {getWeekNumber()}
            </span>
          )}
        </div>

        {/* Right Section - View Controls + Profile */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Help */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Settings */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* View Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getCurrentViewLabel()}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {showViewDropdown && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {viewOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentView(key);
                      setShowViewDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                      currentView === key ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    } ${key === viewOptions[0].key ? 'rounded-t-lg' : ''} ${key === viewOptions[viewOptions.length - 1].key ? 'rounded-b-lg' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* More Options */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
            <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Profile Picture */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;