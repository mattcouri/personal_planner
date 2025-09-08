import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { CheckSquare } from 'lucide-react';
import EventModal from './EventModal';
import EventDetailModal from './EventDetailModal';
import { CheckSquare } from 'lucide-react';

const DayView: React.FC = () => {
  const {
    currentDate,
    events,
    tasks,
    outOfOfficeEvents
  } = useCalendarStore();

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number; minute: number } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEventType, setSelectedEventType] = useState<'event' | 'task'>('event');

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    const hourEvents = events.filter(event => {
      if (event.start?.dateTime) {
        const eventDate = new Date(event.start.dateTime);
        return isSameDay(eventDate, currentDate) && eventDate.getHours() === hour;
      }
      if (event.start instanceof Date) {
        return isSameDay(event.start, currentDate) && event.start.getHours() === hour;
      }
      return false;
    });

    const hourOutOfOffice = outOfOfficeEvents.filter(event => {
      if (event.start?.dateTime) {
        const eventDate = new Date(event.start.dateTime);
        return isSameDay(eventDate, currentDate) && eventDate.getHours() === hour;
      }
      if (event.start instanceof Date) {
        return isSameDay(event.start, currentDate) && event.start.getHours() === hour;
      }
      return false;
    });

    return { events: hourEvents, outOfOffice: hourOutOfOffice };
  };

  const getAllDayEventsForDay = () => {
    return events.filter(event => {
      if (event.start?.date && !event.start?.dateTime) {
        return isSameDay(new Date(event.start.date), currentDate);
      }
      return false;
    });
  };

  const getDayTasks = () => {
    return tasks.filter(task => {
      if (task.due) {
        return isSameDay(new Date(task.due), currentDate);
      }
      return false;
    });
  };

  const handleEventClick = (event: any, type: 'event' | 'task') => {
    setSelectedEvent(event);
    setSelectedEventType(type);
    setShowDetailModal(true);
  };

  const getUserRSVPStatus = (event: any) => {
    const userAttendee = event.attendees?.find((a: any) => a.self);
    return userAttendee?.responseStatus || 'needsAction';
  };

  const renderEvent = (event: any, type: 'event' | 'outOfOffice') => {
    const duration = event.end?.dateTime && event.start?.dateTime
      ? (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / (1000 * 60)
      : 60;
    
    const height = Math.max((duration / 60) * 80, 40); // Minimum 40px height

    // Check RSVP status for visual styling
    const rsvpStatus = getUserRSVPStatus(event);
    const isConfirmed = rsvpStatus === 'accepted';
    
    let colorClass = '';
    if (type === 'outOfOffice') {
      colorClass = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50';
    } else {
      // Event styling based on RSVP status
      if (isConfirmed) {
        colorClass = 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50';
      } else {
        // Hollow/outline style for unconfirmed events
        colorClass = 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 border-2 border-green-500 border-dashed';
      }
    }

    return (
      <div
        key={event.id}
        className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 mb-2 ${colorClass}`}
        style={{ minHeight: `${height}px` }}
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(event, 'event');
        }}
      >
        <div className="font-medium text-sm mb-1">{event.summary || event.title}</div>
        {event.start?.dateTime && (
          <div className="text-xs opacity-75 mb-1">
            {format(new Date(event.start.dateTime), 'HH:mm')}
            {event.end?.dateTime && ` - ${format(new Date(event.end.dateTime), 'HH:mm')}`}
          </div>
        )}
        {event.description && (
          <div className="text-xs opacity-75 line-clamp-2">{event.description}</div>
        )}
        {event.location && (
          <div className="text-xs opacity-75 mt-1">📍 {event.location}</div>
        )}
      </div>
    );
  };

  const handleTimeSlotClick = (hour: number) => {
    setSelectedSlot({ date: currentDate, hour, minute: 0 });
    setShowEventModal(true);
  };

  const allDayEvents = getAllDayEventsForDay();
  const dayTasks = getDayTasks();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Day header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">All day</h4>
          <div className="space-y-2">
            {allDayEvents.map(event => (
              <div
                key={event.id}
                className="p-2 rounded bg-green-500 text-white cursor-pointer hover:bg-green-600 transition-colors duration-200"
                onClick={() => handleEventClick(event, 'event')}
              >
                {event.summary}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks section */}
      {dayTasks.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
          <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Tasks</h4>
          <div className="space-y-2">
            {dayTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center space-x-2 p-2 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200"
                onClick={() => handleEventClick(task, 'task')}
              >
                <CheckSquare className="w-4 h-4" />
                <span className={task.status === 'completed' ? 'line-through' : ''}>{task.title}</span>
                {task.status === 'completed' && <span className="text-green-500">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
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

      {/* Hourly schedule */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map(hour => {
          const hourData = getEventsForHour(hour);
          const hasEvents = hourData.events.length > 0 || hourData.outOfOffice.length > 0;

          return (
            <div key={hour} className="flex border-b border-gray-200 dark:border-gray-700 min-h-[80px]">
              {/* Time label */}
              <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              
              {/* Events column */}
              <div 
                className="flex-1 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-all duration-200"
                onClick={() => handleTimeSlotClick(hour)}
                title={`Click to add event at ${format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}`}
              >
                {hasEvents ? (
                  <div className="space-y-2">
                    {hourData.events.map(event => renderEvent(event, 'event'))}
                    {hourData.outOfOffice.map(event => renderEvent(event, 'outOfOffice'))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm opacity-0 hover:opacity-100 transition-opacity duration-200">
                    Click to add event
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

export default DayView;