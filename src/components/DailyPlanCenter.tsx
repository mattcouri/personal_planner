import React, { useState } from 'react';
import { format, addMinutes } from 'date-fns';
import { Clock, MapPin, Users, Video, Edit3, Check, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DailyPlanCenterProps {
  currentDate: Date;
  onEditItem: (item: any, type: 'plan') => void;
}

export default function DailyPlanCenter({ currentDate, onEditItem }: DailyPlanCenterProps) {
  const { state, dispatch } = useData();
  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];

  // Generate time slots (24 hours, 15-minute intervals)
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({ hour, minute });
    }
  }

  const toggleItemCompletion = (itemId: string) => {
    const item = dailyPlan.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, completed: !item.completed };
    const updatedPlan = dailyPlan.map(planItem =>
      planItem.id === itemId ? updatedItem : planItem
    );

    dispatch({
      type: 'SET_DAILY_PLAN',
      payload: { date: dateKey, items: updatedPlan },
    });

    // Also update the original todo if it exists
    if (item.type === 'todo' && item.originalId) {
      const originalTodo = state.todos.find(t => t.id === item.originalId);
      if (originalTodo) {
        dispatch({
          type: 'UPDATE_TODO',
          payload: { ...originalTodo, completed: updatedItem.completed }
        });
      }
    }
  };

  const removeItemFromPlan = (itemId: string) => {
    const updatedPlan = dailyPlan.filter(item => item.id !== itemId);
    dispatch({
      type: 'SET_DAILY_PLAN',
      payload: { date: dateKey, items: updatedPlan },
    });
  };

  const getItemsForSlot = (hour: number, minute: number) => {
    return dailyPlan.filter(item => {
      const itemHour = item.start.getHours();
      const itemMinute = item.start.getMinutes();
      return itemHour === hour && Math.floor(itemMinute / 15) * 15 === minute;
    });
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary-500" />
          Daily Schedule
        </h3>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-1">
          {timeSlots.map((slot, index) => {
            const slotItems = getItemsForSlot(slot.hour, slot.minute);
            const timeString = format(
              new Date().setHours(slot.hour, slot.minute, 0, 0),
              'HH:mm'
            );

            return (
              <TimeSlot
                key={`${slot.hour}-${slot.minute}`}
                hour={slot.hour}
                minute={slot.minute}
                timeString={timeString}
                items={slotItems}
                onToggleCompletion={toggleItemCompletion}
                onRemoveItem={removeItemFromPlan}
                onEditItem={onEditItem}
                slotIndex={index}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeSlot({
  hour,
  minute,
  timeString,
  items,
  onToggleCompletion,
  onRemoveItem,
  onEditItem,
  slotIndex,
}: {
  hour: number;
  minute: number;
  timeString: string;
  items: any[];
  onToggleCompletion: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: any, type: 'plan') => void;
  slotIndex: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `time-slot-${slotIndex}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex border-b border-gray-100 dark:border-gray-700 min-h-[60px] transition-all duration-200 ${
        isOver ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : ''
      }`}
    >
      {/* Time Label */}
      <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 flex-shrink-0">
        {minute === 0 && (
          <div className="font-medium">
            {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <ScheduledItem
              key={item.id}
              item={item}
              onToggleCompletion={onToggleCompletion}
              onRemoveItem={onRemoveItem}
              onEditItem={onEditItem}
            />
          ))
        ) : (
          <div className={`h-full flex items-center justify-center text-gray-300 dark:text-gray-600 transition-all duration-200 ${
            isOver ? 'text-primary-400 dark:text-primary-500' : ''
          }`}>
            {isOver && (
              <div className="text-sm font-medium">
                Drop here to schedule at {timeString}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduledItem({
  item,
  onToggleCompletion,
  onRemoveItem,
  onEditItem,
}: {
  item: any;
  onToggleCompletion: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onEditItem: (item: any, type: 'plan') => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const duration = Math.round((item.end.getTime() - item.start.getTime()) / (1000 * 60));
  const endTime = format(item.end, 'HH:mm');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        item.completed
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
          : item.type === 'event'
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
          : item.priority === 'high'
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
          : item.priority === 'medium'
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onToggleCompletion(item.id)}
            className={`mt-1 w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
              item.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 dark:border-gray-500 hover:border-primary-500'
            }`}
          >
            {item.completed && <Check className="w-3 h-3" />}
          </button>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-medium text-sm cursor-pointer hover:text-primary-600 ${
                item.completed
                  ? 'line-through text-gray-500 dark:text-gray-400'
                  : 'text-gray-900 dark:text-white'
              }`}
              onDoubleClick={() => onEditItem(item, 'plan')}
            >
              {item.title}
            </h4>

            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{format(item.start, 'HH:mm')} - {endTime}</span>
              <span>({duration}m)</span>
              {item.type === 'todo' && item.priority && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  item.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                  item.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                  {item.priority}
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Event-specific details */}
            {item.type === 'event' && (
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {item.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.guests && item.guests.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{item.guests.length} guests</span>
                  </div>
                )}
                {item.meetLink && (
                  <div className="flex items-center space-x-1">
                    <Video className="w-3 h-3" />
                    <span>Meet</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={() => onEditItem(item, 'plan')}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
            title="Edit item"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onRemoveItem(item.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
            title="Remove from schedule"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}