import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDraggable } from '@dnd-kit/core';

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onQuickAdd: () => void;
}

export default function CalendarSidebar({
  currentDate,
  onDateChange,
  onQuickAdd,
}: CalendarSidebarProps) {
  const { state } = useData();

  // Get events for the selected date and upcoming events
  const selectedDateEvents = state.events.filter((event) =>
    isSameDay(event.start, currentDate)
  );
  
  const upcomingEvents = state.events.filter((event) =>
    event.start > currentDate && 
    event.start <= new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
  ).sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 5);

  const allEvents = [
    ...selectedDateEvents,
    ...upcomingEvents.filter(event => !selectedDateEvents.some(e => e.id === event.id))
  ];


  return (
    <div className="h-full">
      {/* Events Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary-500" />
            Events
          </h2>
          <button
            onClick={onQuickAdd}
            className="text-sm px-3 py-1 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {allEvents.length > 0 ? (
          <div className="space-y-2 max-h-full overflow-y-auto">
            {selectedDateEvents.length > 0 && (
              <>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Today
                </div>
                {selectedDateEvents.map((event) => (
                  <DraggableCalendarEvent key={event.id} event={event} isToday={true} />
                ))}
              </>
            )}
            
            {upcomingEvents.length > 0 && (
              <>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-4">
                  Upcoming
                </div>
                {upcomingEvents.map((event) => (
                  <DraggableCalendarEvent key={event.id} event={event} isToday={false} />
                ))}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No events scheduled.
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableCalendarEvent({ event, isToday }: { event: any; isToday: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg shadow-sm cursor-move transition-all duration-200 hover:shadow-md ${
        isToday 
          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700/50' 
          : 'bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50'
      }`}
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {event.title}
      </h4>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {isToday ? format(event.start, 'h:mm a') : format(event.start, 'MMM d, h:mm a')}
        </p>
        {event.location && (
          <span className="text-xs text-gray-500 dark:text-gray-400">📍</span>
        )}
      </div>
    </div>
  );
}

