import React, { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday, addMinutes } from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { googleCalendarApi } from '../../services/googleCalendarApi';

const WeekView: React.FC = () => {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    events,
    tasks,
    outOfOfficeEvents,
    currentView
  } = useCalendarStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const weekStart = startOfWeek(currentDate);
  const daysToShow = currentView === '4days' ? 4 : 7;
  const weekDays = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get timezone offset
  const getTimezoneOffset = () => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `GMT${sign}${hours.toString().padStart(2, '0')}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}`;
  };

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    const dayEvents = events.filter(event => {
      if (event.start.dateTime) {
        const eventDate = new Date(event.start.dateTime);
        return isSameDay(eventDate, day) && eventDate.getHours() === hour;
      }
      return false;
    });

    const dayOutOfOffice = outOfOfficeEvents.filter(event => {
      if (event.start.dateTime) {
        const eventDate = new Date(event.start.dateTime);
        return isSameDay(eventDate, day) && eventDate.getHours() === hour;
      }
      return false;
    });

    return { events: dayEvents, outOfOffice: dayOutOfOffice };
  };

  const handleTimeSlotClick = async (day: Date, hour: number) => {
    const startTime = new Date(day);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    const eventTitle = prompt('Enter event title:');
    if (!eventTitle) return;
    
    try {
      console.log('🚀 Creating event:', eventTitle, 'at', startTime);
      const event = {
        summary: eventTitle,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      await googleCalendarApi.createEvent('primary', event);
      console.log('✅ Event created successfully!');
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const renderEvent = (event: any, type: 'event' | 'outOfOffice') => {
    const duration = event.end?.dateTime && event.start?.dateTime
      ? (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / (1000 * 60)
      : 60;
    
    const height = Math.max((duration / 60) * 48, 20);
    const startMinute = event.start?.dateTime ? new Date(event.start.dateTime).getMinutes() : 0;
    const topOffset = (startMinute / 60) * 48;

    const colorClass = type === 'outOfOffice'
      ? 'bg-orange-400 text-white border-orange-500'
      : 'bg-blue-400 text-white border-blue-500';

    return (
      <div
        key={event.id}
        className={`absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer hover:shadow-md transition-all duration-200 z-10 border-l-4 ${colorClass}`}
        style={{ 
          height: `${height}px`, 
          minHeight: '20px',
          top: `${topOffset}px`
        }}
        title={event.summary || event.title}
      >
        <div className="font-medium truncate">{event.summary || event.title}</div>
        {event.start?.dateTime && (
          <div className="opacity-90 truncate text-xs">
            {format(new Date(event.start.dateTime), 'HH:mm')}
            {event.end?.dateTime && ` - ${format(new Date(event.end.dateTime), 'HH:mm')}`}
          </div>
        )}
        {event.location && (
          <div className="opacity-75 truncate text-xs">{event.location}</div>
        )}
      </div>
    );
  };

  // Calculate current time line position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return (hours * 48) + (minutes / 60 * 48);
  };

  const isCurrentTimeVisible = () => {
    const now = new Date();
    return weekDays.some(day => isSameDay(day, now));
  };

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header with days */}
      <div className="grid border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-30" 
           style={{ gridTemplateColumns: '60px repeat(' + daysToShow + ', 1fr)' }}>
        {/* GMT offset */}
        <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex items-end justify-end pb-4">
          {getTimezoneOffset()}
        </div>
        
        {/* Day headers */}
        {weekDays.map(day => (
          <div 
            key={day.toString()} 
            className="text-center py-4 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
            onClick={() => setSelectedDate(day)}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
              {format(day, 'EEE')}
            </div>
            <div className={`text-2xl font-normal mt-1 ${
              isToday(day) 
                ? 'bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="relative overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="grid border-b border-gray-100 dark:border-gray-700/50" 
                 style={{ gridTemplateColumns: '60px repeat(' + daysToShow + ', 1fr)', minHeight: '48px' }}>
              {/* Time label */}
              <div className="text-xs text-gray-500 dark:text-gray-400 p-2 border-r border-gray-200 dark:border-gray-700 text-right pr-3">
                {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'HH:mm')}
              </div>
              
              {/* Day columns */}
              {weekDays.map(day => {
                const hourData = getEventsForDayAndHour(day, hour);
                return (
                  <div
                    key={`${day.toString()}-${hour}`}
                    className="relative border-r border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors duration-200"
                    onClick={() => handleTimeSlotClick(day, hour)}
                  >
                    {/* Events */}
                    {hourData.events.map(event => renderEvent(event, 'event'))}
                    {hourData.outOfOffice.map(event => renderEvent(event, 'outOfOffice'))}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Current time indicator */}
          {isCurrentTimeVisible() && (
            <div 
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${getCurrentTimePosition()}px` }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full ml-14 -mt-1.5"></div>
                <div className="flex-1 h-0.5 bg-red-500"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeekView;