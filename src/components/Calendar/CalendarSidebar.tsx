import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Search, Calendar, CheckSquare, Users, Coffee } from 'lucide-react';
import { useCalendarStore } from '../../stores/calendarStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

const CalendarSidebar: React.FC = () => {
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showMyCalendars, setShowMyCalendars] = useState(true);
  const [showOtherCalendars, setShowOtherCalendars] = useState(false);
  const { currentDate, selectedDate, setSelectedDate } = useCalendarStore();

  const mockCalendars = [
    { id: 'personal', name: 'Matthew Couri', color: '#4285f4', checked: true },
    { id: 'birthdays', name: 'Birthdays', color: '#0d7377', checked: true },
    { id: 'tasks', name: 'Tasks', color: '#d50000', checked: true },
    { id: 'work', name: 'Work', color: '#f4511e', checked: false },
  ];

  // Mini calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad with previous/next month days to fill grid
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Create Button */}
      <div className="p-4">
        <div className="relative">
          <button
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="flex items-center space-x-3 w-full px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:shadow-md transition-all duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create</span>
          </button>
          
          {/* Create Dropdown */}
          {showCreateDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Event</span>
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                <CheckSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Task</span>
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                <Coffee className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Out of office</span>
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200 rounded-b-lg">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Appointment schedule</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mini Calendar */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex space-x-1">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronDown className="w-3 h-3 text-gray-500 rotate-90" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronDown className="w-3 h-3 text-gray-500 -rotate-90" />
            </button>
          </div>
        </div>
        
        {/* Mini calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center text-gray-500 dark:text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {allDays.map(day => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  w-6 h-6 text-xs rounded-full flex items-center justify-center transition-colors duration-200
                  ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                  ${isDayToday ? 'bg-blue-500 text-white font-medium' : ''}
                  ${isSelected && !isDayToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
                  ${!isDayToday && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for people"
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
          />
        </div>
      </div>

      {/* My Calendars */}
      <div className="px-4 flex-1 overflow-y-auto">
        <div className="mb-4">
          <button
            onClick={() => setShowMyCalendars(!showMyCalendars)}
            className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors duration-200"
          >
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">My calendars</h3>
            {showMyCalendars ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          {showMyCalendars && (
            <div className="space-y-2">
              {mockCalendars.map((calendar) => (
                <label key={calendar.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={calendar.checked}
                    className="rounded text-blue-500 focus:ring-blue-500 w-4 h-4"
                    style={{ accentColor: calendar.color }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {calendar.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Other calendars */}
        <div>
          <button
            onClick={() => setShowOtherCalendars(!showOtherCalendars)}
            className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors duration-200"
          >
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Other calendars</h3>
            <Plus className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          
          {showOtherCalendars && (
            <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
              No other calendars
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSidebar;