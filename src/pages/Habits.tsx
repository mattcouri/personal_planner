import React, { useState } from 'react';
import { Target, Plus, Calendar, Edit3, Trash2, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  description?: string;
  color: string;
  habits: Habit[];
}

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  icon: string;
}

export default function Habits() {
  const { state, dispatch } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHabit, setEditingHabit] = useState<{ goalId: string; habit?: Habit } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 'physical-health',
      name: 'Physical Health',
      description: 'Maintain and improve physical fitness',
      color: '#10B981',
      habits: [
        {
          id: 'running',
          name: 'Running',
          description: '30 min cardio',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false },
          icon: '🏃'
        },
        {
          id: 'weights',
          name: 'Weight Training',
          description: 'Strength training',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: false },
          icon: '🏋️'
        },
        {
          id: 'swimming',
          name: 'Swimming',
          description: '45 min swim',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '🏊'
        }
      ]
    },
    {
      id: 'mental-wellness',
      name: 'Mental Wellness',
      description: 'Mental health and mindfulness practices',
      color: '#3B82F6',
      habits: [
        {
          id: 'meditation',
          name: 'Meditation',
          description: '15 min mindfulness',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '🧘'
        },
        {
          id: 'journaling',
          name: 'Journaling',
          description: 'Daily reflection',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: true },
          icon: '📝'
        }
      ]
    },
    {
      id: 'productivity',
      name: 'Productivity',
      description: 'Work and personal productivity habits',
      color: '#F59E0B',
      habits: [
        {
          id: 'reading',
          name: 'Reading',
          description: '30 min daily reading',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
          icon: '📚'
        }
      ]
    }
  ]);

  const monthStart = startOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const monthKey = format(currentMonth, 'yyyy-MM');

  const toggleGoalExpansion = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const getHabitStatus = (goalId: string, habitId: string, day: number) => {
    const dateKey = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    const habitEntry = state.habits.find(h => h.id === `${goalId}-${habitId}-${dateKey}`);
    return habitEntry?.status || 'notScheduled';
  };

  const updateHabitStatus = (goalId: string, habitId: string, day: number, status: string) => {
    const dateKey = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    const habitEntry = {
      id: `${goalId}-${habitId}-${dateKey}`,
      name: `${goalId}-${habitId}`,
      date: dateKey,
      status,
      icon: state.habitLegend[status]?.icon || '−',
    };
    dispatch({ type: 'SET_HABIT', payload: habitEntry });
  };

  const isHabitScheduledForDay = (habit: Habit, day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return habit.frequency[dayNames[dayOfWeek] as keyof typeof habit.frequency];
  };

  const getStatusIcon = (status: string) => {
    return state.habitLegend[status]?.icon || '−';
  };

  const getStatusColor = (status: string) => {
    return state.habitLegend[status]?.color || '#6B7280';
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };
    setGoals([...goals, newGoal]);
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const deleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal and all its habits?')) {
      setGoals(goals.filter(g => g.id !== goalId));
    }
  };

  const addHabitToGoal = (goalId: string, habit: Omit<Habit, 'id'>) => {
    const newHabit: Habit = {
      ...habit,
      id: `habit-${Date.now()}`,
    };
    setGoals(goals.map(g => 
      g.id === goalId 
        ? { ...g, habits: [...g.habits, newHabit] }
        : g
    ));
  };

  const updateHabitInGoal = (goalId: string, updatedHabit: Habit) => {
    setGoals(goals.map(g => 
      g.id === goalId 
        ? { ...g, habits: g.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h) }
        : g
    ));
  };

  const deleteHabitFromGoal = (goalId: string, habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setGoals(goals.map(g => 
        g.id === goalId 
          ? { ...g, habits: g.habits.filter(h => h.id !== habitId) }
          : g
      ));
    }
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
          <button 
            onClick={() => setShowGoalModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
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

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Goal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleGoalExpansion(goal.id)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {expandedGoals.has(goal.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {goal.name}
                    </h3>
                    {goal.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {goal.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
                    {goal.habits.length} habits
                  </span>
                  <button
                    onClick={() => setEditingHabit({ goalId: goal.id })}
                    className="p-2 text-gray-400 hover:text-green-500 transition-colors duration-200"
                    title="Add habit"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingGoal(goal);
                      setShowGoalModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    title="Edit goal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Habit Tracker */}
            {expandedGoals.has(goal.id) && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-1 font-medium text-gray-700 dark:text-gray-300 w-32">
                          Habit
                        </th>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                          return (
                            <th key={day} className="text-center py-2 px-1 font-medium text-gray-500 dark:text-gray-400 min-w-[28px]">
                              <div className="text-xs">{format(date, 'EEE')}</div>
                              <div className="text-sm font-bold">{day}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {goal.habits.map(habit => (
                        <tr key={habit.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-2 px-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{habit.icon}</span>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {habit.name}
                                </div>
                                {habit.description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {habit.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => setEditingHabit({ goalId: goal.id, habit })}
                                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                                  title="Edit habit"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => deleteHabitFromGoal(goal.id, habit.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                  title="Delete habit"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const isScheduled = isHabitScheduledForDay(habit, day);
                            const status = getHabitStatus(goal.id, habit.id, day);
                            const icon = getStatusIcon(status);
                            const color = getStatusColor(status);
                            
                            return (
                              <td key={day} className="text-center py-2 px-1">
                                {isScheduled ? (
                                  <button
                                    onClick={() => {
                                      const statusKeys = Object.keys(state.habitLegend);
                                      const currentIndex = statusKeys.indexOf(status);
                                      const nextIndex = (currentIndex + 1) % statusKeys.length;
                                      updateHabitStatus(goal.id, habit.id, day, statusKeys[nextIndex]);
                                    }}
                                    className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center text-xs font-medium"
                                    style={{ color, backgroundColor: `${color}20` }}
                                  >
                                    {icon}
                                  </button>
                                ) : (
                                  <div className="w-6 h-6 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(state.habitLegend).map(([key, legend]) => (
            <div key={key} className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-medium"
                style={{ color: legend.color, backgroundColor: `${legend.color}20` }}
              >
                {legend.icon}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {legend.label}
              </span>
            </div>
          ))}
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Not Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <GoalModal
          goal={editingGoal}
          onSave={(goal) => {
            if (editingGoal) {
              updateGoal(goal as Goal);
            } else {
              addGoal(goal);
            }
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
        />
      )}

      {/* Habit Modal */}
      {editingHabit && (
        <HabitModal
          goalId={editingHabit.goalId}
          habit={editingHabit.habit}
          onSave={(habit) => {
            if (editingHabit.habit) {
              updateHabitInGoal(editingHabit.goalId, habit as Habit);
            } else {
              addHabitToGoal(editingHabit.goalId, habit);
            }
            setEditingHabit(null);
          }}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </div>
  );
}

// Goal Modal Component
function GoalModal({ 
  goal, 
  onSave, 
  onClose 
}: { 
  goal: Goal | null; 
  onSave: (goal: Omit<Goal, 'id'> | Goal) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    color: goal?.color || '#10B981',
  });

  const colors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal) {
      onSave({ ...goal, ...formData });
    } else {
      onSave({ ...formData, habits: [] });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Physical Health"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of this goal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600"
            >
              {goal ? 'Update' : 'Create'} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Habit Modal Component
function HabitModal({ 
  goalId, 
  habit, 
  onSave, 
  onClose 
}: { 
  goalId: string; 
  habit: Habit | undefined; 
  onSave: (habit: Omit<Habit, 'id'> | Habit) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    icon: habit?.icon || '✅',
    frequency: habit?.frequency || {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
  });

  const icons = ['✅', '🏃', '🏋️', '🏊', '🧘', '📚', '📝', '💊', '🥗', '💧', '😴', '🎯', '🎨', '🎵', '🌱'];
  const days = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habit) {
      onSave({ ...habit, ...formData });
    } else {
      onSave(formData);
    }
  };

  const toggleDay = (day: keyof typeof formData.frequency) => {
    setFormData({
      ...formData,
      frequency: {
        ...formData.frequency,
        [day]: !formData.frequency[day],
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {habit ? 'Edit Habit' : 'Add New Habit'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Habit Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Running"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 30 min cardio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {icons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-8 h-8 rounded border-2 transition-all duration-200 flex items-center justify-center text-lg ${
                    formData.icon === icon ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency (Select days of the week)
            </label>
            <div className="grid grid-cols-7 gap-1">
              {days.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key as keyof typeof formData.frequency)}
                  className={`py-2 px-1 rounded text-xs font-medium transition-all duration-200 ${
                    formData.frequency[key as keyof typeof formData.frequency]
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600"
            >
              {habit ? 'Update' : 'Add'} Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}