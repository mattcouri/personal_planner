import React from 'react';
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

  const weekStart = startOfWeek(currentDate);
  const daysToShow = currentView === '4days' ? 4 : 7;
  const weekDays = Array.from({ length: daysToShow }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

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

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (task.due) {
        return isSameDay(new Date(task.due), day);
      }
      return false;
    });
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
      window.location.reload(); // Quick refresh - better to update state
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };
  const renderEvent = (event: any, type: 'event' | 'outOfOffice') => {
    const duration = event.end?.dateTime && event.start?.dateTime
      ? (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / (1000 * 60)
      : 60;
    
    const height = Math.max((duration / 60) * 60, 30); // Minimum 30px height

    const colorClass = type === 'outOfOffice'
      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';

    return (
      <div
        key={event.id}
        className={`absolute left-1 right-1 p-1 rounded border text-xs cursor-pointer hover:shadow-md transition-all duration-200 z-10 ${colorClass}`}
        style={{ height: `${height}px`, minHeight: '30px' }}
        title={event.summary || event.title}
      >
        <div className="font-medium truncate">{event.summary || event.title}</div>
        {event.start?.dateTime && (
          <div className="text-xs opacity-75">
            {format(new Date(event.start.dateTime), 'HH:mm')}
            {event.end?.dateTime && ` - ${format(new Date(event.end.dateTime), 'HH:mm')}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Header with days */}
      <div className="grid border-b border-gray-200 dark:border-gray-700" style={{ gridTemplateColumns: `80px repeat(${daysToShow}, 1fr)` }}>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50"></div>
        {weekDays.map(day => (
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(day)}
            className={`p-3 text-center cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
              selectedDate && isSameDay(day, selectedDate) 
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                : 'bg-gray-50 dark:bg-gray-700/50'
            } ${
              isToday(day) ? 'font-bold' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {format(day, 'EEE')}
            </div>
            <div className={`text-lg ${
              isToday(day) 
                ? 'bg-primary-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Tasks row (for all-day items) */}
      <div className="grid border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30" style={{ gridTemplateColumns: `80px repeat(${daysToShow}, 1fr)` }}>
        <div className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
          All Day
        </div>
        {weekDays.map(day => {
          const dayTasks = getTasksForDay(day);
          return (
            <div key={`tasks-${day.toString()}`} className="p-2 min-h-[60px] border-r border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                {dayTasks.slice(0, 2).map(task => (
                  <div
                    key={task.id}
                    className="text-xs p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50 cursor-pointer hover:shadow-sm transition-all duration-200"
                      className="relative min-h-[60px] border-r border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-all duration-200 cursor-pointer"
                      onClick={() => handleTimeSlotClick(day, hour)}
                      title={`Click to add event at ${format(day, 'MMM d')} ${format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className={task.status === 'completed' ? 'line-through' : ''}>{task.title}</span>
                      {task.status === 'completed' && <span className="text-green-500">✓</span>}
                    </div>
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${daysToShow}, 1fr)` }}>
          {hours.map(hour => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              
              {/* Day columns */}
              {weekDays.map(day => {
                const hourData = getEventsForDayAndHour(day, hour);
                return (
                  <div
                    key={`${day.toString()}-${hour}`}
                    className="relative min-h-[60px] border-r border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-all duration-200"
                  >
                    {/* Events */}
                    {hourData.events.map(event => renderEvent(event, 'event'))}
                    {hourData.outOfOffice.map(event => renderEvent(event, 'outOfOffice'))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;