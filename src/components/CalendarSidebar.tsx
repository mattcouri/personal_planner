// components/CalendarSidebar.tsx
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDrag } from 'react-dnd';

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

  const todayEvents = state.events.filter((event) =>
    isSameDay(event.start, currentDate)
  );

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary-500" />
          Calendar Events
        </h2>
        <button
          onClick={onQuickAdd}
          className="text-sm px-3 py-1 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {todayEvents.length > 0 ? (
        <div className="space-y-2">
          {todayEvents.map((event) => (
            <DraggableCalendarEvent key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No events scheduled for today.
        </p>
      )}
    </div>
  );
}

function DraggableCalendarEvent({ event }: { event: any }) {
  const [, drag] = useDrag(() => ({
    type: 'calendar-event',
    item: {
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      sourceType: 'calendar',
      description: event.description,
      location: event.location,
      guests: event.guests,
      meetLink: event.meetLink,
    },
  }));

  return (
    <div
      ref={drag}
      className="p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg shadow-sm cursor-move"
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {event.title}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-300">
        {format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')}
      </p>
    </div>
  );
}
