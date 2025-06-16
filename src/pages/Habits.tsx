import React, { useState } from 'react';
import { Target, Plus, Calendar, Edit3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';

export default function Habits() {
  const { state, dispatch } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [habitList, setHabitList] = useState([
    'Exercise', 'Meditation', 'Reading', 'Water Intake', 'Sleep 8h'
  ]);

  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const monthKey = format(currentMonth, 'yyyy-MM');

  const getHabitStatus = (habit: string, day: number) => {
    const dateKey = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    const habitEntry = state.habits.find(h => h.name === habit && h.date === dateKey);
    return habitEntry?.status || 'notScheduled';
  };

  const updateHabitStatus = (habit: string, day: number, status: string) => {
    const dateKey = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    const habitEntry = {
      id: `${habit}-${dateKey}`,
      name: habit,
      date: dateKey,
      status,
      icon: state.habitLegend[status]?.icon || '−',
    };
    dispatch({ type: 'SET_HABIT', payload: habitEntry });
  };

  const getStatusIcon = (status: string) => {
    return state.habitLegend[status]?.icon || '−';
  };

  const getStatusColor = (status: string) => {
    return state.habitLegend[status]?.color || '#6B7280';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Goals & Habits
          </h1>
        </div>

        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <Edit3 className="w-4 h-4" />
            <span>Edit Legend</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            →
          </button>
        </div>
      </div>

      {/* Habit Tracker Grid */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Habit Tracker
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Habit
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {habitList.map(habit => (
                <tr key={habit} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {habit}
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const status = getHabitStatus(habit, day);
                    const icon = getStatusIcon(status);
                    const color = getStatusColor(status);
                    
                    return (
                      <td key={day} className="px-2 py-4 text-center">
                        <button
                          onClick={() => {
                            const statusKeys = Object.keys(state.habitLegend);
                            const currentIndex = statusKeys.indexOf(status);
                            const nextIndex = (currentIndex + 1) % statusKeys.length;
                            updateHabitStatus(habit, day, statusKeys[nextIndex]);
                          }}
                          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center text-sm font-medium"
                          style={{ color, backgroundColor: `${color}20` }}
                        >
                          {icon}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(state.habitLegend).map(([key, legend]) => (
            <div key={key} className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-sm font-medium"
                style={{ color: legend.color, backgroundColor: `${legend.color}20` }}
              >
                {legend.icon}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {legend.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}