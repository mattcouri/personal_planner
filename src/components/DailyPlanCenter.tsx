import React, { useEffect, useState } from 'react';
import { format, isSameDay, setHours, setMinutes, addMinutes } from 'date-fns';
import { useData } from '../contexts/DataContext';
import { 
  useDroppable, 
  useDraggable, 
  DragEndEvent,
  DragOverEvent,
  DragStartEvent 
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle2, Circle, Clock, Trash2, Edit3, Plus, MoreHorizontal } from 'lucide-react';
import DragDropProvider from './DragDropProvider';

interface DailyPlanCenterProps {
  currentDate: Date;
  onEditItem?: (item: any, type: 'plan') => void;
}

export default function DailyPlanCenter({ currentDate, onEditItem }: DailyPlanCenterProps) {
  const { state, dispatch } = useData();
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedItem, setDraggedItem] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const todayEvents = state.events.filter(event =>
      isSameDay(event.start, currentDate)
    );
    const todayTodos = state.todos.filter(todo =>
      isSameDay(todo.dueDate, currentDate)
    );

    const existingEventIds = dailyPlan.filter(i => i.type === 'event').map(i => i.originalId);
    const existingTodoIds = dailyPlan.filter(i => i.type === 'todo').map(i => i.originalId);
    
    const newEvents = todayEvents.filter(e => !existingEventIds.includes(e.id));
    const newTodos = todayTodos.filter(t => !existingTodoIds.includes(t.id));

    const newPlanItems = [
      ...newEvents.map(event => ({
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
      })),
      ...newTodos.map(todo => ({
        id: uuidv4(),
        title: todo.title,
        start: todo.dueDate,
        end: new Date(todo.dueDate.getTime() + (todo.duration || 60) * 60 * 1000),
        type: 'todo' as const,
        originalId: todo.id,
        completed: todo.completed,
        description: todo.description,
        priority: todo.priority,
        projectId: todo.projectId,
      }))
    ];

    if (newPlanItems.length > 0) {
      dispatch({
        type: 'SET_DAILY_PLAN',
        payload: { date: dateKey, items: [...dailyPlan, ...newPlanItems] },
      });
    }
  }, [currentDate, dateKey, state.events, state.todos]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = dailyPlan.find(i => i.id === active.id) || 
                 state.events.find(e => e.id === active.id) ||
                 state.todos.find(t => t.id === active.id);
    setDraggedItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);

    if (!over) return;

    const overId = over.id as string;
    
    // Check if dropping on a time slot
    if (overId.startsWith('time-slot-')) {
      const slotIndex = parseInt(overId.replace('time-slot-', ''));
      const hour = Math.floor(slotIndex / 4);
      const minute = (slotIndex % 4) * 15;
      
      // Check if it's an existing plan item being moved
      const existingItem = dailyPlan.find(i => i.id === active.id);
      if (existingItem) {
        moveExisting(active.id as string, hour, minute);
      } else {
        // It's a new item from sidebar
        const sourceItem = state.events.find(e => e.id === active.id) ||
                          state.todos.find(t => t.id === active.id);
        if (sourceItem) {
          handleNewDrop(sourceItem, hour, minute);
        }
      }
    }
  };

  const moveExisting = (id: string, hour: number, minute: number = 0) => {
    const dragged = dailyPlan.find(i => i.id === id);
    if (!dragged) return;
    
    const duration = (dragged.end.getTime() - dragged.start.getTime()) / (1000 * 60);
    const newStart = setHours(setMinutes(currentDate, minute), hour);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);
    
    const updated = {
      ...dragged,
      start: newStart,
      end: newEnd,
    };
    updatePlanItem(updated);
  };

  const handleNewDrop = (item: any, hour: number, minute: number = 0) => {
    const isEvent = item.color !== undefined || item.meetLink !== undefined; // Events have these properties
    const exists = dailyPlan.find(
      i => i.originalId === item.id && i.type === (isEvent ? 'event' : 'todo')
    );

    let duration = 60;
    
    if (item.start && item.end) {
      duration = Math.ceil((new Date(item.end).getTime() - new Date(item.start).getTime()) / (1000 * 60));
    } else if (item.duration) {
      duration = item.duration;
    }

    const newStart = setHours(setMinutes(currentDate, minute), hour);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    const base = {
      title: item.title,
      start: newStart,
      end: newEnd,
      type: isEvent ? 'event' : 'todo',
      originalId: item.id,
      completed: item.completed || false,
      description: item.description,
      location: item.location,
      guests: item.guests,
      meetLink: item.meetLink,
      priority: item.priority,
      projectId: item.projectId,
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

  const handleEditItem = (item: any) => {
    if (onEditItem) {
      onEditItem(item, 'plan');
    }
  };

  // Generate time slots every 15 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = setHours(setMinutes(new Date(), minute), hour);
        slots.push({
          hour,
          minute,
          time,
          label: minute === 0 ? format(time, 'h:mm a') : '',
          isHour: minute === 0,
          slotIndex: hour * 4 + minute / 15,
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // Calculate item positions and heights
  const getItemStyle = (item: any) => {
    const startHour = item.start.getHours();
    const startMinute = item.start.getMinutes();
    const endHour = item.end.getHours();
    const endMinute = item.end.getMinutes();
    
    const startSlot = startHour * 4 + Math.floor(startMinute / 15);
    const endSlot = endHour * 4 + Math.ceil(endMinute / 15);
    const duration = endSlot - startSlot;
    
    return {
      top: `${startSlot * 20}px`, // 20px per 15-minute slot
      height: `${Math.max(duration * 20, 20)}px`,
      zIndex: 10,
    };
  };

  const sortedItems = [...dailyPlan].sort((a, b) => a.start.getTime() - b.start.getTime());

  useEffect(() => {
    const currentSlot = currentHour * 4 + Math.floor(currentMinutes / 15);
    const element = document.getElementById(`slot-${currentSlot}`);
    if (element && isSameDay(currentDate, new Date())) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentDate, currentHour, currentMinutes]);

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl border overflow-hidden h-full flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 mr-2 text-primary-500" />
                Time Blocks
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Drag tasks and events to schedule your day
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {sortedItems.filter(item => item.completed).length}/{sortedItems.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">completed</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <TimeGrid
            timeSlots={timeSlots}
            sortedItems={sortedItems}
            currentDate={currentDate}
            currentHour={currentHour}
            currentMinutes={currentMinutes}
            getItemStyle={getItemStyle}
            onToggleComplete={toggleComplete}
            onRemoveItem={removeItem}
            onEditItem={handleEditItem}
          />
        </div>
      </div>
    </DragDropProvider>
  );
}

function TimeGrid({
  timeSlots,
  sortedItems,
  currentDate,
  currentHour,
  currentMinutes,
  getItemStyle,
  onToggleComplete,
  onRemoveItem,
  onEditItem,
}: {
  timeSlots: any[];
  sortedItems: any[];
  currentDate: Date;
  currentHour: number;
  currentMinutes: number;
  getItemStyle: (item: any) => any;
  onToggleComplete: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: any) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'time-grid',
  });

  return (
    <div 
      ref={setNodeRef}
      id="time-grid"
      className={`h-full overflow-y-auto relative ${isOver ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Time grid background */}
      <div className="relative" style={{ height: `${timeSlots.length * 20}px` }}>
        {/* Time labels and grid lines */}
        {timeSlots.map((slot, index) => (
          <TimeSlot
            key={index}
            slot={slot}
            index={index}
            currentDate={currentDate}
            currentHour={currentHour}
            currentMinutes={currentMinutes}
          />
        ))}

        {/* Scheduled items */}
        <div className="absolute left-20 right-0 top-0 bottom-0">
          {sortedItems.map((item) => (
            <ScheduledItem
              key={item.id}
              item={item}
              style={getItemStyle(item)}
              onToggleComplete={onToggleComplete}
              onRemove={onRemoveItem}
              onEdit={onEditItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimeSlot({
  slot,
  index,
  currentDate,
  currentHour,
  currentMinutes,
}: {
  slot: any;
  index: number;
  currentDate: Date;
  currentHour: number;
  currentMinutes: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${index}`,
  });

  return (
    <div
      ref={setNodeRef}
      id={`slot-${index}`}
      className={`absolute left-0 right-0 flex transition-colors duration-200 ${
        slot.isHour ? 'border-t border-gray-200 dark:border-gray-700' : 'border-t border-gray-100 dark:border-gray-800'
      } ${isOver ? 'bg-primary-100 dark:bg-primary-800/30' : ''}`}
      style={{ top: `${index * 20}px`, height: '20px' }}
    >
      {slot.label && (
        <div className="w-20 px-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/80 border-r border-gray-200 dark:border-gray-700 flex items-center">
          {slot.label}
        </div>
      )}
      <div className="flex-1 relative">
        {/* Current time indicator */}
        {isSameDay(currentDate, new Date()) && 
         slot.hour === currentHour && 
         currentMinutes >= slot.minute && 
         currentMinutes < slot.minute + 15 && (
          <div 
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
            style={{ 
              top: `${((currentMinutes - slot.minute) / 15) * 20}px`
            }}
          >
            <div className="absolute -left-1 -top-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduledItem({ 
  item, 
  style,
  onToggleComplete, 
  onRemove, 
  onEdit,
}: { 
  item: any; 
  style: any;
  onToggleComplete: (id: string) => void; 
  onRemove: (id: string) => void;
  onEdit: (item: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const duration = Math.round((item.end.getTime() - item.start.getTime()) / (1000 * 60));
  const isShort = duration <= 30;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute left-1 right-1 rounded-lg border cursor-move transition-all duration-200 group hover:shadow-lg ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        item.completed
          ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700/50 opacity-80'
          : item.type === 'event'
          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700/50 hover:bg-blue-200 dark:hover:bg-blue-900/40'
          : 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700/50 hover:bg-amber-200 dark:hover:bg-amber-900/40'
      }`}
      style={{ ...style, ...dragStyle }}
    >
      <div className={`p-2 h-full flex ${isShort ? 'items-center' : 'flex-col'}`}>
        <div className="flex items-start justify-between flex-1 min-w-0">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(item.id);
              }}
              className="mt-0.5 flex-shrink-0"
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 hover:text-primary-500" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-medium truncate ${
                  item.completed
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {item.title}
              </h4>
              
              {!isShort && (
                <div className="mt-1 space-y-1">
                  <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(item.start, 'h:mm a')} - {format(item.end, 'h:mm a')}
                    <span className="ml-2 text-gray-500">({duration}m)</span>
                  </div>
                  
                  {item.location && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      📍 {item.location}
                    </div>
                  )}
                  
                  {item.meetLink && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      🎥 Google Meet
                    </div>
                  )}
                  
                  {item.priority && (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      item.priority === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                      item.priority === 'medium' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                      'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="text-gray-400 hover:text-blue-500 p-1"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}