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

  const unscheduledTodos = state.todos.filter(todo => 
    !todo.completed && 
    !state.dailyPlans[format(currentDate, 'yyyy-MM-dd')]?.some(
      plan => plan.originalId === todo.id && plan.type === 'todo'
    )
  );

  return (
    <div className="space-y-4 h-full">
      {/* Events Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
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
          <div className="space-y-2 max-h-64 overflow-y-auto">
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

      {/* Unscheduled Tasks */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <div className="w-5 h-5 mr-2 bg-amber-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            Unscheduled
          </h2>
          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
            {unscheduledTodos.length}
          </span>
        </div>

        {unscheduledTodos.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {unscheduledTodos.map((todo) => (
              <DraggableUnscheduledTodo key={todo.id} todo={todo} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All tasks are scheduled!
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableCalendarEvent({ event, isToday }: { event: any; isToday: boolean }) {
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

function DraggableUnscheduledTodo({ todo }: { todo: any }) {
  const [, drag] = useDrag(() => ({
    type: 'todo-item',
    item: {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      sourceType: 'todo',
      duration: todo.duration || 60,
      priority: todo.priority,
      projectId: todo.projectId,
      completed: todo.completed,
    },
  }));

  return (
    <div
      ref={drag}
      className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg shadow-sm cursor-move transition-all duration-200 hover:shadow-md hover:bg-amber-100 dark:hover:bg-amber-900/30"
    >
      <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
        {todo.title}
      </h4>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          todo.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
          todo.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {todo.priority}
        </span>
        {todo.duration && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {todo.duration >= 60 ? `${Math.floor(todo.duration / 60)}h` : `${todo.duration}m`}
            {todo.duration >= 60 && todo.duration % 60 > 0 && ` ${todo.duration % 60}m`}
          </span>
        )}
      </div>
    </div>
  );
}
