import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  setHours,
  setMinutes,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Grid3X3,
  List,
  Eye,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

// Placeholder – swap for OAuth button + integration
function GoogleCalendarConnect() {
  return (
    <div className="p-4 border rounded bg-white dark:bg-gray-800 mt-6">
      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Google Calendar Sync
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Connect to sync your events.
      </p>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Connect Google Calendar
      </button>
    </div>
  );
}

type CalendarView = 'month' | 'week' | 'day' | 'year';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const { state, dispatch } = useData();

  const getEventsForDay = (day: Date) => {
    return state.events.filter((event) => isSameDay(event.start, day));
  };

  const handleDoubleClick = (event: any) => {
    const updatedTitle = prompt('Edit Event Title', event.title);
    if (updatedTitle) {
      dispatch({
        type: 'UPDATE_EVENT',
        payload: { ...event, title: updatedTitle },
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (view) {
        case 'year':
          newDate.setFullYear(prev.getFullYear() + (direction === 'next' ? 1 : -1));
          break;
        case 'month':
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          return direction === 'next' ? addDays(prev, 7) : addDays(prev, -7);
        case 'day':
          return direction === 'next' ? addDays(prev, 1) : addDays(prev, -1);
      }
      return newDate;
    });
  };

  const getViewTitle = () => {
    switch (view) {
      case 'year':
        return format(currentDate, 'yyyy');
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const events = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[120px] p-2 border cursor-pointer transition ${
                isCurrentMonth ? '' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'
              } ${isSelected ? 'ring-2 ring-primary-500' : ''} ${
                isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}
            >
              <div className="text-sm font-medium mb-2">{format(day, 'd')}</div>
              <div className="space-y-1">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onDoubleClick={() => handleDoubleClick(event)}
                    className="text-xs p-1 rounded bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 truncate border cursor-pointer"
                    title={`${event.title} – ${format(event.start, 'HH:mm')} to ${format(event.end, 'HH:mm')}`}
                  >
                    {format(event.start, 'HH:mm')} {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDay(currentDate);

    return (
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((event) => event.start.getHours() === hour);
          return (
            <div key={hour} className="flex border-b min-h-[60px]">
              <div className="w-20 p-3 text-sm text-gray-500 border-r">{format(setHours(setMinutes(new Date(), 0), hour), 'HH:mm')}</div>
              <div className="flex-1 p-3 space-y-2">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    onDoubleClick={() => handleDoubleClick(event)}
                    className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20 border text-sm"
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs">
                      {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center space-x-2">
            <CalendarIcon className="w-8 h-8 text-primary-500" />
            <span>Calendar</span>
          </h1>

          <div className="flex items-center space-x-2">
            <button onClick={() => navigateDate('prev')} className="p-2 border rounded hover:shadow">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold min-w-[250px] text-center">{getViewTitle()}</h2>
            <button onClick={() => navigateDate('next')} className="p-2 border rounded hover:shadow">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* View switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'year', icon: Grid3X3 },
              { key: 'month', icon: CalendarIcon },
              { key: 'week', icon: List },
              { key: 'day', icon: Eye },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key as CalendarView)}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium ${
                  view === key ? 'bg-primary-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <button className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:scale-105">
            <Plus className="w-4 h-4 mr-1" />
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border overflow-hidden">
        {view === 'month' && renderMonthView()}
        {view === 'day' && renderDayView()}
        {/* Week and Year views to be implemented */}
      </div>

      {/* Google Calendar Integration */}
      <GoogleCalendarConnect />
    </div>
  );
}
