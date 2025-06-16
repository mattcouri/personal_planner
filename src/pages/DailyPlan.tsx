import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CalendarSidebar from '../components/CalendarSidebar';
import TodoSidebar from '../components/TodoSidebar';
import DailyPlanCenter from '../components/DailyPlanCenter';
import QuickAddModal from '../components/QuickAddModal';

export default function DailyPlan() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<'event' | 'todo' | 'plan'>('event');
  const [isAnimating, setIsAnimating] = useState(false);
  const { state } = useData();

  const dateKey = format(currentDate, 'yyyy-MM-dd');
  const dailyPlan = state.dailyPlans[dateKey] || [];

  const totalItems = dailyPlan.length;
  const completedItems = dailyPlan.filter(item => item.completed).length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

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

  return (
    <div className="space-y-8 min-h-screen">
      {/* Header */}
      <div className={`transition-all duration-300 ${isAnimating ? 'animate-page-flip' : 'animate-fade-in'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border"
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
              className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:scale-105 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 shadow-xl border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Daily Progress
            </span>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
              {completedItems} of {totalItems} completed ({Math.round(progress)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px] ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
        <div className="lg:col-span-1">
          <CalendarSidebar
            currentDate={currentDate}
            onDateChange={handleDateChange}
            onQuickAdd={() => setShowQuickAdd(true)}
          />
        </div>

        <div className="lg:col-span-2">
          <DailyPlanCenter 
            currentDate={currentDate} 
            onEditItem={handleEditItem}
          />
        </div>

        <div className="lg:col-span-1">
          <TodoSidebar onQuickAdd={() => setShowQuickAdd(true)} />
        </div>
      </div>

      {showQuickAdd && (
        <QuickAddModal
          currentDate={currentDate}
          onClose={handleCloseModal}
          editItem={editItem}
          editType={editType}
        />
      )}
    </div>
  );
}