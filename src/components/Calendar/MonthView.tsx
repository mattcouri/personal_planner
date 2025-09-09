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
  endOfWeek
} from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { CalendarEvent, Task, OutOfOfficeEvent } from '../../types/calendar';
import { CheckSquare } from 'lucide-react';
import EventModal from './EventModal';
import EventDetailModal from './EventDetailModal';

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

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEventType, setSelectedEventType] = useState<'event' | 'task'>('event');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    const dayEvents = events.filter(event => {
      if (event.start?.date) {
        // All-day events - check if this day falls within the event range
        const eventStartDate = event.start.date; // YYYY-MM-DD format
        const eventEndDate = event.end?.date || eventStartDate; // Default to start date if no end
        const dayDateString = format(day, 'yyyy-MM-dd');
        
        // Check if day falls within the event range (inclusive)
        const isWithinRange = dayDateString >= eventStartDate && dayDateString <= eventEndDate;
        console.log(`📅 Month view - All-day event "${event.summary}": Start="${eventStartDate}" End="${eventEndDate}" Day="${dayDateString}" -> Within range? ${isWithinRange}`);
        return isWithinRange;
      }
      if (event.start?.dateTime) {
        // Timed events - parse dateTime correctly
        const eventDate = new Date(event.start.dateTime);
        return isSameDay(eventDate, day);
      }
      if (event.start instanceof Date) {
        return isSameDay(event.start, day);
      }
      return false;
    });

    const dayTasks = tasks.filter(task => {
      if (task.due) {
        // Parse task due date correctly
        const taskDueDate = new Date(task.due);
        return isSameDay(taskDueDate, day);
      }
      return false;
    });

    const dayOutOfOffice = outOfOfficeEvents.filter(event => {
      if (event.start?.date) {
        const eventDate = new Date(event.start.date + 'T00:00:00');
        return isSameDay(eventDate, day);
      }
      if (event.start?.dateTime) {
        const eventDate = new Date(event.start.dateTime);
        return isSameDay(eventDate, day);
      }
      if (event.start instanceof Date) {
        return isSameDay(event.start, day);
      }
      return false;
    });

    return { events: dayEvents, tasks: dayTasks, outOfOffice: dayOutOfOffice };
  };

  const handleEventClick = (event: any, type: 'event' | 'task') => {
    setSelectedEvent(event);
    setSelectedEventType(type);
    setShowDetailModal(true);
  };

  const handleDayClick = (day: Date, event: React.MouseEvent) => {
    // Only handle click if not clicking on an event
    if ((event.target as HTMLElement).closest('.event-item')) {
      return;
    }
    
    setSelectedSlot({ date: day, hour: 12, minute: 0 });
    setShowEventModal(true);
  };
  
  const renderEventItem = (item: CalendarEvent | Task | OutOfOfficeEvent, type: string, isAllDay: boolean = false) => {
    const getEventColor = () => {
      switch (type) {
        case 'event':
          return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50';
        case 'task':
          const isCompleted = 'status' in item && item.status === 'completed';
          return isCompleted 
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50';
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
      if (type === 'task') {
        if ('due' in item && item.due) {
          const taskDate = new Date(item.due);
          return format(taskDate, 'HH:mm');
        }
        return '';
      }
      if (isAllDay) return '';
      if ('start' in item && item.start.dateTime) {
        return format(new Date(item.start.dateTime), 'HH:mm');
      }
      return '';
    };

    const isCompleted = type === 'task' && 'status' in item && item.status === 'completed';

    return (
      <div
        key={item.id}
        className={`event-item text-xs p-1 rounded border mb-1 truncate cursor-pointer hover:shadow-sm transition-all duration-200 ${getEventColor()}`}
        title={`${getTitle()} ${getTime()}`}
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(item, type === 'task' ? 'task' : 'event');
        }}
      >
        <div className={`flex items-center space-x-1 ${isCompleted ? 'line-through' : ''}`}>
          {type === 'task' && <CheckSquare className="w-3 h-3" />}
          {getTime() && <span className="font-mono text-xs">{getTime()}</span>}
          <span className="truncate">{getTitle()}</span>
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

              {/* All-day events */}
              <div className="space-y-1 mb-2">
                {dayData.events
                  .filter(event => event.start?.date && !event.start?.dateTime)
                  .slice(0, 2)
                  .map(event => {
                    console.log(`📅 Rendering all-day event in month view: "${event.summary}" on ${format(day, 'yyyy-MM-dd')}`);
                    return renderEventItem(event, 'event', true);
                  })
                }
              </div>

              {/* Timed events and tasks */}
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {/* Timed events */}
                {dayData.events
                  .filter(event => event.start?.dateTime)
                  .slice(0, 2)
                  .map(event => renderEventItem(event, 'event'))
                }
                
                {/* Tasks with specific times - show in time slots, not all-day */}
                {dayData.tasks
                  .slice(0, 2)
                  .map(task => renderEventItem(task, 'task'))
                }
                
                {/* Out of office */}
                {dayData.outOfOffice.slice(0, 1).map(event => renderEventItem(event, 'outOfOffice'))}

                {/* Show overflow indicator */}
                {(dayData.events.length + dayData.tasks.length + dayData.outOfOffice.length) > 4 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    +{(dayData.events.length + dayData.tasks.length + dayData.outOfOffice.length) - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedSlot(null);
        }}
        selectedDate={selectedSlot?.date}
        selectedTime={selectedSlot ? { hour: selectedSlot.hour, minute: selectedSlot.minute } : undefined}
      />
      
      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        eventType={selectedEventType}
        onEdit={() => {
          setShowDetailModal(false);
          // TODO: Open edit modal
        }}
      />
    </div>
  );
};

export default MonthView;