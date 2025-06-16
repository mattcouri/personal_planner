import React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from 'date-fns';
import { useData } from '../contexts/DataContext';
import { useDrag } from 'react-dnd';
import { Clock, MapPin, Plus, Trash2 } from 'lucide-react';

interface CalendarSidebarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onQuickAdd: () => void;
}

interface DraggableEventProps {
  event: any;
  children: React.ReactNode;
}

function DraggableEvent({ event, children }: DraggableEventProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'calendar-event',
    item: { ...event, sourceType: 'calendar' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`cursor-move transition-opacity duration-200 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {children}
    </div>
  );
}

export default function CalendarSidebar({
  currentDate,
  onDateChange,
  onQuickAdd,
}: CalendarSidebarProps) {
  const { state, dispatch } = useData();

  const dayEvents = state.events.filter((event) =>
    isSameDay(event.start, currentDate)
  );

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];
  const scheduledEventIds = dailyPlan
    .filter((item) => item.type === 'event')
    .map((item) => item.originalId);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const removeEventFromDailyPlan = (eventId: string) => {
    const updatedPlan = dailyPlan.filter(
      (item) => !(item.type === 'event' && item.originalId === eventId)
    );
    dispatch({
      type: 'SET_DAILY_PLAN',
      payload: { date: dateKey, items: updatedPlan },
    });
  };

  const handleEdit = (event: any) => {
    const updatedTitle = prompt('Edit Meeting Title', event.title);
    if (updatedTitle) {
      dispatch({
        type: 'UPDATE_EVENT',
        payload: { ...event, title: updatedTitle },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Mini Calendar */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-xl border">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {format(currentDate, 'MMMM yyyy')}
        </h3>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => (
            <button
              key={day.toString()}
              onClick={() => onDateChange(day)}
              className={`w-8 h-8 text-sm rounded-lg transition ${
                isSameDay(day, currentDate)
                  ? 'bg-primary-500 text-white shadow-lg'
                  : isToday(day)
                  ? 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Meetings */}
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-xl border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary-500" />
            Today's Meetings
          </h3>
          <button
            onClick={onQuickAdd}
            className="p-1 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {dayEvents.length > 0 ? (
            dayEvents.map((event) => {
              const isScheduled = scheduledEventIds.includes(event.id);
              return (
                <DraggableEvent key={event.id} event={event}>
                  <div
                    onDoubleClick={() => handleEdit(event)}
                    className={`p-3 rounded-lg border transition ${
                      isScheduled
                        ? 'from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 border-gray-300 dark:border-gray-600 opacity-60'
                        : 'from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-700/50'
                    } bg-gradient-to-r`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(event.start, 'h:mm a')} -{' '}
                          {format(event.end, 'h:mm a')}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                            📍 {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex items-center space-x-1">
                        {isScheduled && (
                          <button
                            onClick={() => removeEventFromDailyPlan(event.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-500"
                            title="Remove from daily plan"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      </div>
                    </div>
                  </div>
                </DraggableEvent>
              );
            })
          ) : (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No events scheduled for today
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
