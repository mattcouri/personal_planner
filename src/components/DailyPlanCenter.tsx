import React, { useEffect, useState } from 'react';
import { format, isSameDay, setHours, setMinutes } from 'date-fns';
import { useData } from '../contexts/DataContext';
import { useDrop, useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle2, Circle, Clock, Trash2 } from 'lucide-react';

interface DailyPlanCenterProps {
  currentDate: Date;
}

export default function DailyPlanCenter({ currentDate }: DailyPlanCenterProps) {
  const { state, dispatch } = useData();
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const todayEvents = state.events.filter(event =>
      isSameDay(event.start, currentDate)
    );
    const existingEventIds = dailyPlan.filter(i => i.type === 'event').map(i => i.originalId);
    const newEvents = todayEvents.filter(e => !existingEventIds.includes(e.id));

    if (newEvents.length > 0) {
      const newPlanItems = newEvents.map(event => ({
        id: uuidv4(),
        title: event.title,
        start: event.start,
        end: event.end,
        type: 'event' as const,
        originalId: event.id,
        completed: false,
        description: event.description,
        location: event.location,
        guests: event.guests,
        meetLink: event.meetLink,
      }));
      dispatch({
        type: 'SET_DAILY_PLAN',
        payload: { date: dateKey, items: [...dailyPlan, ...newPlanItems] },
      });
    }
  }, [currentDate, dateKey]);

  const timeSlots = Array.from({ length: 24 }, (_, i) =>
    format(setHours(setMinutes(new Date(), 0), i), 'h:mm a')
  );

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['calendar-event', 'todo-item', 'plan-item'],
    drop: (item: any, monitor) => {
      const result = monitor.getDropResult() as any;
      if (result?.hour !== undefined) {
        if (item.type === 'plan-item') {
          moveExisting(item.id, result.hour);
        } else {
          handleNewDrop(item, result.hour);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const moveExisting = (id: string, hour: number) => {
    const dragged = dailyPlan.find(i => i.id === id);
    if (!dragged) return;
    const duration = (dragged.end.getTime() - dragged.start.getTime()) / 3600000;
    const updated = {
      ...dragged,
      start: setHours(setMinutes(currentDate, 0), hour),
      end: setHours(setMinutes(currentDate, 0), hour + Math.ceil(duration)),
    };
    updatePlanItem(updated);
  };

  const handleNewDrop = (item: any, hour: number) => {
    const isEvent = item.sourceType === 'calendar';
    const exists = dailyPlan.find(
      i => i.originalId === item.id && i.type === (isEvent ? 'event' : 'todo')
    );

    const duration = item.start && item.end
      ? Math.ceil((new Date(item.end).getTime() - new Date(item.start).getTime()) / 3600000)
      : 1;

    const base = {
      title: item.title,
      start: setHours(setMinutes(currentDate, 0), hour),
      end: setHours(setMinutes(currentDate, 0), hour + duration),
      type: isEvent ? 'event' : 'todo',
      originalId: item.id,
      completed: false,
      description: item.description,
      location: item.location,
      guests: item.guests,
      meetLink: item.meetLink,
    };

    const newItem = exists
      ? { ...exists, ...base }
      : { ...base, id: uuidv4() };

    const updated = exists
      ? dailyPlan.map(p => p.id === exists.id ? newItem : p)
      : [...dailyPlan, newItem];

    dispatch({ type: 'SET_DAILY_PLAN', payload: { date: dateKey, items: updated } });
  };

  const updatePlanItem = (updatedItem: any) => {
    const updatedPlan = dailyPlan.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    dispatch({ type: 'SET_DAILY_PLAN', payload: { date: dateKey, items: updatedPlan } });
  };

  const toggleComplete = (id: string) => {
    const updatedPlan = dailyPlan.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    dispatch({ type: 'SET_DAILY_PLAN', payload: { date: dateKey, items: updatedPlan } });
  };

  const removeItem = (id: string) => {
    const updatedPlan = dailyPlan.filter(i => i.id !== id);
    dispatch({ type: 'SET_DAILY_PLAN', payload: { date: dateKey, items: updatedPlan } });
  };

  const editItem = (item: any) => {
    const updatedTitle = prompt('Edit item title', item.title);
    if (updatedTitle) {
      updatePlanItem({ ...item, title: updatedTitle });
    }
  };

  const getItemsForHour = (hour: number) =>
    dailyPlan.filter(item => item.start.getHours() === hour);

  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const nowPosition = (currentMinutes / 60) * 100;

  useEffect(() => {
    const el = document.getElementById(`hour-${currentHour}`);
    if (el && isSameDay(currentDate, new Date())) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentDate]);

  return (
    <div
      ref={drop}
      className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border overflow-hidden h-full"
    >
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
          <Clock className="w-5 h-5 mr-2 text-primary-500" />
          Daily Schedule
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Drag items here and organize your day
        </p>
      </div>

      <div className="h-96 overflow-y-auto relative">
        {timeSlots.map((label, hour) => {
          const items = getItemsForHour(hour);
          const isNow = hour === currentHour;

          return (
            <div
              key={hour}
              id={`hour-${hour}`}
              className="flex border-b min-h-[80px] hover:bg-gray-50 dark:hover:bg-gray-700/40 relative"
            >
              {isNow && isSameDay(currentDate, new Date()) && (
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 shadow"
                  style={{ top: `${nowPosition}%` }}
                >
                  <div className="absolute -left-2 -top-1 w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
              )}

              <div className="w-24 p-3 text-sm text-gray-500 border-r bg-gray-50/50 dark:bg-gray-800/50">
                {label}
              </div>

              <div className="flex-1 p-3 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onDoubleClick={() => editItem(item)}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.completed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700/40 opacity-70'
                        : item.type === 'event'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => toggleComplete(item.id)}
                        className="text-gray-400 hover:text-primary-500"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-medium truncate ${
                            item.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {format(item.start, 'h:mm a')} –{' '}
                          {format(item.end, 'h:mm a')}
                        </p>
                        {item.location && (
                          <p className="text-xs text-gray-600 truncate">📍 {item.location}</p>
                        )}
                        {item.meetLink && (
                          <p className="text-xs text-blue-600 truncate">🎥 Google Meet</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
