import React, { useEffect, useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
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

  // ADD THIS DEBUG CODE HERE:
  console.log('🔍 DEBUG: First few events:', events.slice(0, 3).map(event => ({
    summary: event.summary,
    start: event.start,
    startType: typeof event.start,
    startDateTime: event.start?.dateTime,
    startDate: event.start?.date
  })));

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
    console.log(`🔍 Getting events for ${format(day, 'yyyy-MM-dd')} hour ${hour}`);
    console.log('📅 Total events in store:', events.length);
    
    const dayEvents = events.filter(event => {
      // Handle both dateTime and date formats
      let eventDate: Date | null = null;
      
      if (event.start?.dateTime) {
        eventDate = new Date(event.start.dateTime);
      } else if (event.start?.date) {
        eventDate = new Date(event.start.date);
      } else if (event.start instanceof Date) {
        eventDate = event.start;
      }
      
      if (!eventDate) {
        console.log('❌ Event has no valid start date:', event);
        return false;
      }
      
      const isSameDay = eventDate.toDateString() === day.toDateString();
      const isSameHour = eventDate.getHours() === hour;
      
      if (isSameDay && isSameHour) {
        console.log('✅ Found event for this slot:', event.summary || event.title);
      }
      
      return isSameDay && isSameHour;
    });

    const dayOutOfOffice = outOfOfficeEvents.filter(event => {
      let eventDate: Date | null = null;
      
      if (event.start?.dateTime) {
        eventDate = new Date(event.start.dateTime);
      } else if (event.start?.date) {
        eventDate = new Date(event.start.date);
      } else if (event.start instanceof Date) {
        eventDate = event.start;
      }
      
      if (!eventDate) return false;
      
      return eventDate.toDateString() === day.toDateString() && eventDate.getHours() === hour;
    });

    console.log(`📊 Found ${dayEvents.length} events and ${dayOutOfOffice.length} out-of-office for ${format(day, 'yyyy-MM-dd')} ${hour}:00`);
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
    console.log('🎨 Rendering event:', event.summary || event.title, 'type:', type);
    
    // Calculate duration and positioning
    let duration = 60; // Default 1 hour
    let startMinute = 0;
    
    if (event.start?.dateTime && event.end?.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      duration = (end.getTime() - start.getTime()) / (1000 * 60);
      startMinute = start.getMinutes();
    } else if (event.start instanceof Date && event.end instanceof Date) {
      duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
      startMinute = event.start.getMinutes();
    }
    
    const height = Math.max((duration / 60) * 48, 20);
    const topOffset = (startMinute / 60) * 48;

    // Google Calendar colors
    const colorClass = type === 'outOfOffice'
      ? 'bg-orange-500 text-white border-l-4 border-orange-600'
      : 'bg-blue-500 text-white border-l-4 border-blue-600';

    const title = event.summary || event.title || 'Untitled Event';
    const location = event.location || '';
    
    let timeDisplay = '';
    if (event.start?.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
      timeDisplay = format(start, 'HH:mm');
      if (end) {
        timeDisplay += ` - ${format(end, 'HH:mm')}`;
      }
    } else if (event.start instanceof Date) {
      timeDisplay = format(event.start, 'HH:mm');
      if (event.end instanceof Date) {
        timeDisplay += ` - ${format(event.end, 'HH:mm')}`;
      }
    }

    return (
      <div
        key={event.id}
        className={`absolute left-1 right-1 rounded-sm px-2 py-1 text-xs cursor-pointer hover:shadow-lg transition-all duration-200 z-10 ${colorClass}`}
        style={{ 
          height: `${height}px`, 
          minHeight: '20px',
          top: `${topOffset}px`
        }}
        title={`${title}${location ? ` - ${location}` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          console.log('🖱️ Event clicked:', event);
        }}
      >
        <div className="font-medium truncate">{title}</div>
        {timeDisplay && (
          <div className="opacity-90 truncate text-xs">
            {timeDisplay}
          </div>
        )}
        {location && (
          <div className="opacity-75 truncate text-xs">{location}</div>
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

  const getCurrentTimeDay = () => {
    const now = new Date();
    return weekDays.findIndex(day => isSameDay(day, now));
  };

  console.log('🔄 WeekView render - Events in store:', events.length);
  console.log('📅 Sample event:', events[0]);

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
              {weekDays.map((day, dayIndex) => {
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
          
          {/* Current time indicator - Red line like Google */}
          {isCurrentTimeVisible() && (
            <div 
              className="absolute z-20 pointer-events-none"
              style={{ 
                top: `${getCurrentTimePosition()}px`,
                left: '60px',
                right: '0px'
              }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5 border-2 border-white dark:border-gray-800"></div>
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