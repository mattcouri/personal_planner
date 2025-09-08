import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarEvent, Task, OutOfOfficeEvent } from '../../types/calendar';
import { googleCalendarApi } from '../../services/googleCalendarApi';

const MonthView: React.FC = () => {
  const {
    currentDate,
    selectedDate,
    setSelectedDate,
    events,
    tasks,
    outOfOfficeEvents,
    activeSchedulingType
  } = useCalendarStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    const dayEvents = events.filter(event => {
      if (event.start?.date) {
        return isSameDay(new Date(event.start.date), day);
      }
      if (event.start?.dateTime) {
        return isSameDay(new Date(event.start.dateTime), day);
      }
      if (event.start instanceof Date) {
        return isSameDay(event.start, day);
      }
      return false;
    });

    const dayTasks = tasks.filter(task => {
      if (task.due) {
        return isSameDay(new Date(task.due), day);
      }
      return false;
    });

    const dayOutOfOffice = outOfOfficeEvents.filter(event => {
      if (event.start?.date) {
        return isSameDay(new Date(event.start.date), day);
      }
      if (event.start?.dateTime) {
        return isSameDay(new Date(event.start.dateTime), day);
      }
      if (event.start instanceof Date) {
        return isSameDay(event.start, day);
      }
      return false;
    });

    return { events: dayEvents, tasks: dayTasks, outOfOffice: dayOutOfOffice };
  };

  const handleDayClick = async (day: Date, event: React.MouseEvent) => {
    // Only handle click if not clicking on an event
    if ((event.target as HTMLElement).closest('.event-item')) {
      return;
    }
    
    const eventTitle = prompt(`Add event for ${format(day, 'MMM d, yyyy')}:`);
    if (!eventTitle) return;
    
    try {
      console.log('🚀 Creating all-day event:', eventTitle, 'on', day);
      const eventData = {
        summary: eventTitle,
        start: {
          date: format(day, 'yyyy-MM-dd'),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          date: format(day, 'yyyy-MM-dd'),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      await googleCalendarApi.createEvent('primary', eventData);
      console.log('✅ Event created successfully!');
      window.location.reload(); // Quick refresh - better to update state
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };
  const renderEventItem = (item: CalendarEvent | Task | OutOfOfficeEvent, type: string) => {
    const getEventColor = () => {
      switch (type) {
        case 'meeting':
          return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';
        case 'task':
          return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50';
        case 'outOfOffice':
          return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50';
        default:
          return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      }
    };

    const getTitle = () => {
      if ('summary' in item) return item.summary;
      if ('title' in item) return item.title;
      return 'Untitled';
    };

    const getTime = () => {
      if ('start' in item && item.start.dateTime) {
        return format(new Date(item.start.dateTime), 'HH:mm');
      }
      return '';
    };

    return (
      <div
        key={item.id}
        className={`event-item text-xs p-1 rounded border mb-1 truncate cursor-pointer hover:shadow-sm transition-all duration-200 ${getEventColor()}`}
        title={`${getTitle()} ${getTime()}`}
      >
        <div className="flex items-center space-x-1">
          {getTime() && <span className="font-mono text-xs">{getTime()}</span>}
          <span className="truncate">{getTitle()}</span>
          {type === 'task' && 'status' in item && item.status === 'completed' && (
            <span className="text-green-500">✓</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const dayData = getEventsForDay(day);

          return (
            <div
              key={day.toString()}
              onClick={(e) => {
                setSelectedDate(day);
                handleDayClick(day, e);
              }}
              className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-400' : ''
              } ${
                isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''
              } ${
                isDayToday ? 'bg-primary-50 dark:bg-primary-900/10' : ''
              }`}
              title={`Click to add event on ${format(day, 'MMM d, yyyy')}`}
            >
              {/* Day Number */}
              <div className={`text-sm font-medium mb-2 ${
                isDayToday 
                  ? 'bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                  : ''
              }`}>
                {format(day, 'd')}
              </div>

              {/* Events */}
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {/* Show items based on active scheduling type */}
                {(activeSchedulingType === 'meetings' || activeSchedulingType === 'meetings') && 
                  dayData.events.slice(0, 3).map(event => renderEventItem(event, 'meeting'))
                }
                
                {(activeSchedulingType === 'events' || activeSchedulingType === 'meetings') && 
                  dayData.tasks.slice(0, 2).map(task => renderEventItem(task, 'task'))
                }
                
                {(activeSchedulingType === 'outOfOffice' || activeSchedulingType === 'meetings') && 
                  dayData.outOfOffice.slice(0, 1).map(event => renderEventItem(event, 'outOfOffice'))
                }

                {/* Show overflow indicator */}
                {(dayData.events.length + dayData.tasks.length + dayData.outOfOffice.length) > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    +{(dayData.events.length + dayData.tasks.length + dayData.outOfOffice.length) - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;