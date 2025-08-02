import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CalendarSidebar from '../components/CalendarSidebar';
import TodoSidebar from '../components/TodoSidebar';
import DailyPlanCenter from '../components/DailyPlanCenter';
import QuickAddModal from '../components/QuickAddModal';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

export default function DailyPlan() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<'event' | 'todo' | 'plan'>('event');
  const [isAnimating, setIsAnimating] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const { state, dispatch } = useData();

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];

  const totalItems = dailyPlan.length;
  const completedItems = dailyPlan.filter(item => item.completed).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const upcomingItems = dailyPlan
    .filter(item => !item.completed && item.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);

  const navigateDate = (direction: 'prev' | 'next') => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
      setIsAnimating(false);
    }, 300);
  };

  const handleDateChange = (newDate: Date) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDate(newDate);
      setIsAnimating(false);
    }, 300);
  };

  const handleEditItem = (item: any, type: 'plan') => {
    setEditItem(item);
    setEditType(type);
    setShowQuickAdd(true);
  };

  const handleCloseModal = () => {
    setShowQuickAdd(false);
    setEditItem(null);
    setEditType('event');
  };

  // Handle drag and drop events
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = state.events.find(e => e.id === active.id) ||
                 state.todos.find(t => t.id === active.id) ||
                 dailyPlan.find(p => p.id === active.id);
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
        moveExistingItem(active.id as string, hour, minute);
      } else {
        // It's a new item from sidebar
        const sourceItem = state.events.find(e => e.id === active.id) ||
                          state.todos.find(t => t.id === active.id);
        if (sourceItem) {
          addNewItemToPlan(sourceItem, hour, minute);
        }
      }
    }
  };

  const moveExistingItem = (itemId: string, hour: number, minute: number) => {
    const item = dailyPlan.find(i => i.id === itemId);
    if (!item) return;

    const duration = (item.end.getTime() - item.start.getTime()) / (1000 * 60);
    const newStart = new Date(currentDate);
    newStart.setHours(hour, minute, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    const updatedItem = {
      ...item,
      start: newStart,
      end: newEnd,
    };

    const updatedPlan = dailyPlan.map(planItem =>
      planItem.id === itemId ? updatedItem : planItem
    );

    dispatch({
      type: 'SET_DAILY_PLAN',
      payload: { date: dateKey, items: updatedPlan },
    });
  };

  const addNewItemToPlan = (sourceItem: any, hour: number, minute: number) => {
    const isEvent = sourceItem.color !== undefined || sourceItem.meetLink !== undefined;
    
    // Check if item already exists in plan
    const exists = dailyPlan.find(
      i => i.originalId === sourceItem.id && i.type === (isEvent ? 'event' : 'todo')
    );

    let duration = 60; // Default 1 hour
    
    if (sourceItem.start && sourceItem.end) {
      duration = Math.ceil((sourceItem.end.getTime() - sourceItem.start.getTime()) / (1000 * 60));
    } else if (sourceItem.duration) {
      duration = sourceItem.duration;
    }

    const newStart = new Date(currentDate);
    newStart.setHours(hour, minute, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    const planItem = {
      id: exists?.id || `plan-${Date.now()}`,
      title: sourceItem.title,
      description: sourceItem.description,
      start: newStart,
      end: newEnd,
      type: isEvent ? 'event' : 'todo',
      originalId: sourceItem.id,
      completed: sourceItem.completed || false,
      location: sourceItem.location,
      guests: sourceItem.guests,
      meetLink: sourceItem.meetLink,
      priority: sourceItem.priority,
      projectId: sourceItem.projectId,
    };

    const updatedPlan = exists
      ? dailyPlan.map(item => item.id === exists.id ? planItem : item)
      : [...dailyPlan, planItem];

    dispatch({
      type: 'SET_DAILY_PLAN',
      payload: { date: dateKey, items: updatedPlan },
    });
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="space-y-8 min-h-screen">
        {/* Header */}
        <div className={`transition-all duration-300 ${isAnimating ? 'animate-page-flip' : 'animate-fade-in'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  DAILY PLAN
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {format(currentDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              <button
                onClick={() => navigateDate('next')}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:scale-105 shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Daily Progress
                </span>
                {upcomingItems.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Next: {upcomingItems[0].title} at {format(upcomingItems[0].start, 'h:mm a')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {completedItems} of {totalItems} completed
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(progress)}% complete
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Layout - Three Column Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[700px] transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
          {/* Left Sidebar - Calendar Events */}
          <div className="lg:col-span-1">
            <CalendarSidebar
              currentDate={currentDate}
              onDateChange={handleDateChange}
              onQuickAdd={() => setShowQuickAdd(true)}
            />
          </div>

          {/* Center - Time Grid Calendar */}
          <div className="lg:col-span-3">
            <DailyPlanCenter 
              currentDate={currentDate} 
              onEditItem={handleEditItem}
            />
          </div>

          {/* Right Sidebar - Todo Lists */}
          <div className="lg:col-span-1">
            <TodoSidebar onQuickAdd={() => setShowQuickAdd(true)} />
          </div>
        </div>

        {/* Drag Overlay */}
        {draggedItem && (
          <div className="fixed pointer-events-none z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border opacity-80">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {draggedItem.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Drag to schedule
            </div>
          </div>
        )}

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <QuickAddModal
            currentDate={currentDate}
            onClose={handleCloseModal}
            editItem={editItem}
            editType={editType}
          />
        )}
      </div>
    </DndContext>
  );
}