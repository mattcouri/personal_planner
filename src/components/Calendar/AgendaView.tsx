import React, { useState } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { Clock, CheckSquare, Coffee, MapPin, Users } from 'lucide-react';
import EventModal from './EventModal';

const AgendaView: React.FC = () => {
  const {
    currentDate,
    events,
    tasks,
    outOfOfficeEvents
  } = useCalendarStore();

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getItemsForDay = (day: Date) => {
    const dayEvents = events.filter(event => {
      if (event.start?.date) {
        // All-day events - check if this day falls within the event range
        const eventStartDate = event.start.date; // YYYY-MM-DD format
        const eventEndDate = event.end?.date || eventStartDate; // Default to start date if no end
        const dayDateString = format(day, 'yyyy-MM-dd');
        
        // Check if day falls within the event range (inclusive)
        const isWithinRange = dayDateString >= eventStartDate && dayDateString <= eventEndDate;
        console.log(`📅 Agenda view - All-day event "${event.summary}": Start="${eventStartDate}" End="${eventEndDate}" Day="${dayDateString}" -> Within range? ${isWithinRange}`);
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

  const renderEventItem = (item: any, type: 'event' | 'task' | 'outOfOffice') => {
    const getIcon = () => {
      switch (type) {
        case 'event': return <Clock className="w-4 h-4" />;
        case 'task': return <CheckSquare className="w-4 h-4" />;
        case 'outOfOffice': return <Coffee className="w-4 h-4" />;
        default: return <Clock className="w-4 h-4" />;
      }
    };

    const getColorClass = () => {
      const isCompleted = type === 'task' && 'status' in item && item.status === 'completed';
      
      switch (type) {
        case 'event':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-300';
        case 'task':
          return isCompleted 
            ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300';
        case 'outOfOffice':
          return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/50 text-orange-700 dark:text-orange-300';
        default:
          return 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300';
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
        return null;
      }
      if ('start' in item && item.start.dateTime) {
        const start = format(new Date(item.start.dateTime), 'HH:mm');
        const end = item.end?.dateTime ? format(new Date(item.end.dateTime), 'HH:mm') : '';
        return end ? `${start} - ${end}` : start;
      }
      if ('start' in item && item.start.date) {
        return 'All day';
      }
      return null;
    };

    const isCompleted = type === 'task' && 'status' in item && item.status === 'completed';

    return (
      <div
        key={item.id}
        className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 ${getColorClass()}`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium text-sm truncate ${isCompleted ? 'line-through' : ''}`}>{getTitle()}</h4>
              {getTime() && (
                <span className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                  {getTime()}
                </span>
              )}
            </div>
            
            {(item.description || item.notes) && (
              <p className="text-xs opacity-75 line-clamp-2 mb-2">{item.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-xs opacity-75">
              {item.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{item.location}</span>
                </div>
              )}
              
              {item.attendees && item.attendees.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{item.attendees.length} attendees</span>
                </div>
              )}
              
              {type === 'task' && (
                <span className={`font-medium ${isCompleted ? 'text-gray-500' : 'text-blue-600'}`}>
                  {isCompleted ? 'Completed' : 'Task'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get all days with items
  const daysWithItems = daysInMonth.filter(day => {
    const dayData = getItemsForDay(day);
    return dayData.events.length > 0 || dayData.tasks.length > 0 || dayData.outOfOffice.length > 0;
  });

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Agenda for {format(currentDate, 'MMMM yyyy')}
        </h3>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {daysWithItems.length > 0 ? (
          <div className="p-6 space-y-6">
            {daysWithItems.map(day => {
              const dayData = getItemsForDay(day);
              const allItems = [
                ...dayData.events.map(e => ({ ...e, type: 'event' as const })),
                ...dayData.tasks.map(t => ({ ...t, type: 'task' as const })),
                ...dayData.outOfOffice.map(o => ({ ...o, type: 'outOfOffice' as const }))
              ].sort((a, b) => {
                // Sort by time, with all-day items first
                const getTime = (item: any) => {
                  if (item.type === 'task') return 0; // Tasks first
                  if ('start' in item && item.start.dateTime) {
                    return new Date(item.start.dateTime).getTime();
                  }
                  return 1; // All-day items after tasks but before timed items
                };
                return getTime(a) - getTime(b);
              });

              return (
                <div key={day.toString()}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {format(day, 'EEEE, MMMM d')}
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {allItems.map(item => renderEventItem(item, item.type))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h4 className="text-lg font-medium mb-2">No items scheduled</h4>
              <p className="text-sm">
                No meetings, tasks, or out-of-office periods found for {format(currentDate, 'MMMM yyyy')}.
              </p>
              <button
                onClick={() => {
                  setSelectedSlot({ date: new Date(), hour: 12, minute: 0 });
                  setShowEventModal(true);
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Add Event
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
};

export default AgendaView;