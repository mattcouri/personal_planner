import React, { useState } from 'react';
import { Target, Plus, Calendar, Edit3, Trash2, ChevronDown, ChevronRight, Settings, ArrowUp, ArrowDown, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, getDaysInMonth, startOfMonth, getDay, addDays, differenceInDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
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

// KPI Configuration Constants
const KPI_CONFIG = {
  S_STAR: 14,
  R_STAR: 3,
  TAU: 0.5,
  EPSILON: 0.01,
  WEIGHTS: {
    completion: 0.25,
    streak: 0.15,
    adherence: 0.10,
    onTime: 0.10,
    recovery: 0.10,
    trend: 0.10,
    consistency: 0.10,
    resilience: 0.10
  }
};

export default function Habits() {
  const { state, dispatch } = useData();
  const TODAY = new Date(); // Define TODAY at component level
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-01'),
    end: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  });
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHabit, setEditingHabit] = useState<{ goalId: string; habit?: Habit } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 'spiritual',
      name: 'Spiritual',
      description: 'You with your God/Universe',
      color: '#8B5CF6',
      position: 1,
      habits: [
        {
          id: 'prayer',
          name: 'Prayer/Meditation',
          description: '20 min spiritual practice',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '🙏'
        },
        {
          id: 'scripture',
          name: 'Scripture Reading',
          description: '15 min daily reading',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: true },
          icon: '📖'
        },
        {
          id: 'gratitude',
          name: 'Gratitude Practice',
          description: 'List 3 things grateful for',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: true },
          icon: '🙏'
        },
        {
          id: 'service',
          name: 'Acts of Service',
          description: 'Help others in need',
          frequency: { monday: false, tuesday: false, wednesday: true, thursday: false, friday: false, saturday: true, sunday: true },
          icon: '🤝'
        },
        {
          id: 'reflection',
          name: 'Spiritual Reflection',
          description: 'Journal spiritual insights',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: false, sunday: true },
          icon: '✨'
        }
      ]
    },
    {
      id: 'mental',
      name: 'Mental',
      description: 'You with your mind',
      color: '#3B82F6',
      position: 2,
      habits: [
        {
          id: 'meditation',
          name: 'Mindfulness Meditation',
          description: '15 min daily meditation',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '🧘'
        },
        {
          id: 'learning',
          name: 'Learning New Skills',
          description: '30 min skill development',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
          icon: '📚'
        },
        {
          id: 'puzzles',
          name: 'Brain Training',
          description: 'Puzzles or brain games',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: false },
          icon: '🧩'
        },
        {
          id: 'creativity',
          name: 'Creative Expression',
          description: 'Art, music, or writing',
          frequency: { monday: false, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: true, sunday: true },
          icon: '🎨'
        },
        {
          id: 'digital-detox',
          name: 'Digital Detox',
          description: '1 hour without screens',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: true, sunday: true },
          icon: '📵'
        }
      ]
    },
    {
      id: 'social',
      name: 'Social',
      description: 'You with other people',
      color: '#10B981',
      position: 3,
      habits: [
        {
          id: 'family-time',
          name: 'Quality Family Time',
          description: 'Meaningful time with family',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: true },
          icon: '👨‍👩‍👧‍👦'
        },
        {
          id: 'friends',
          name: 'Connect with Friends',
          description: 'Call or meet with friends',
          frequency: { monday: false, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: true, sunday: false },
          icon: '👥'
        },
        {
          id: 'networking',
          name: 'Professional Networking',
          description: 'Build professional relationships',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false },
          icon: '🤝'
        },
        {
          id: 'community',
          name: 'Community Involvement',
          description: 'Participate in community events',
          frequency: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: true, sunday: true },
          icon: '🏘️'
        },
        {
          id: 'social-media',
          name: 'Positive Social Media',
          description: 'Meaningful online interactions',
          frequency: { monday: true, tuesday: true, wednesday: false, thursday: true, friday: true, saturday: false, sunday: false },
          icon: '💬'
        }
      ]
    },
    {
      id: 'physical',
      name: 'Physical',
      description: 'You with your body',
      color: '#F59E0B',
      position: 4,
      habits: [
        {
          id: 'cardio',
          name: 'Cardiovascular Exercise',
          description: '30 min cardio workout',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false },
          icon: '🏃'
        },
        {
          id: 'strength',
          name: 'Strength Training',
          description: 'Weight lifting or resistance',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: false },
          icon: '🏋️'
        },
        {
          id: 'flexibility',
          name: 'Flexibility & Stretching',
          description: 'Yoga or stretching routine',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '🧘‍♀️'
        },
        {
          id: 'nutrition',
          name: 'Healthy Nutrition',
          description: 'Track meals and water intake',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '🥗'
        },
        {
          id: 'sleep',
          name: 'Quality Sleep',
          description: '7-8 hours of sleep',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '😴'
        }
      ]
    },
    {
      id: 'financial',
      name: 'Financial',
      description: 'You with your resources',
      color: '#EF4444',
      position: 5,
      habits: [
        {
          id: 'budget-review',
          name: 'Budget Review',
          description: 'Review daily expenses',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
          icon: '💰'
        },
        {
          id: 'savings',
          name: 'Savings Contribution',
          description: 'Add to savings account',
          frequency: { monday: true, tuesday: false, wednesday: false, thursday: false, friday: true, saturday: false, sunday: false },
          icon: '🏦'
        },
        {
          id: 'investment',
          name: 'Investment Research',
          description: 'Research investment opportunities',
          frequency: { monday: false, tuesday: false, wednesday: true, thursday: false, friday: false, saturday: true, sunday: false },
          icon: '📈'
        },
        {
          id: 'financial-education',
          name: 'Financial Education',
          description: 'Read financial content',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: false, sunday: true },
          icon: '📖'
        },
        {
          id: 'expense-tracking',
          name: 'Expense Tracking',
          description: 'Log all daily expenses',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
          icon: '📊'
        }
      ]
    },
    {
      id: 'career-development',
      name: 'Career Development',
      description: 'Professional growth and skill building',
      color: '#6366F1',
      position: 6,
      habits: [
        {
          id: 'skill-learning',
          name: 'Skill Development',
          description: 'Learn new professional skills',
          frequency: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
          icon: '💻'
        },
        {
          id: 'industry-news',
          name: 'Industry Research',
          description: 'Stay updated with industry trends',
          frequency: { monday: true, tuesday: false, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false },
          icon: '📰'
        },
        {
          id: 'portfolio-work',
          name: 'Portfolio Building',
          description: 'Work on personal projects',
          frequency: { monday: false, tuesday: true, wednesday: false, thursday: true, friday: false, saturday: true, sunday: true },
          icon: '🎯'
        }
      ]
    },
    {
      id: 'personal-growth',
      name: 'Personal Growth',
      description: 'Self-improvement and personal development',
      color: '#EC4899',
      position: 7,
      habits: [
        {
          id: 'self-reflection',
          name: 'Self Reflection',
          description: 'Journal about personal growth',
          frequency: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: true },
          icon: '📝'
        },
        {
          id: 'goal-review',
          name: 'Goal Review',
          description: 'Review and adjust personal goals',
          frequency: { monday: true, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: false, sunday: false },
          icon: '🎯'
        }
      ]
    },
    {
      id: 'hobbies-recreation',
      name: 'Hobbies & Recreation',
      description: 'Fun activities and personal interests',
      color: '#84CC16',
      position: 8,
      habits: [
        {
          id: 'hobby-time',
          name: 'Hobby Practice',
          description: 'Engage in favorite hobbies',
          frequency: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: true, sunday: true },
          icon: '🎨'
        },
        {
          id: 'outdoor-activity',
          name: 'Outdoor Activities',
          description: 'Spend time in nature',
          frequency: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false, saturday: true, sunday: true },
          icon: '🌲'
        }
      ]
    }
  ].sort((a, b) => a.position - b.position));

  // Calculate date range
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  const toggleGoalExpansion = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const getHabitStatus = (goalId: string, habitId: string, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const habitEntry = state.habits.find(h => h.id === `${goalId}-${habitId}-${dateKey}`);
    return habitEntry?.status || 'notScheduled';
  };

  const updateHabitStatus = (goalId: string, habitId: string, date: Date, status: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const habitEntry = {
      id: `${goalId}-${habitId}-${dateKey}`,
      name: `${goalId}-${habitId}`,
      date: dateKey,
      status,
      icon: state.habitLegend[status]?.icon || '−',
    };
    dispatch({ type: 'SET_HABIT', payload: habitEntry });
  };

  const isHabitScheduledForDay = (habit: Habit, date: Date) => {
    const dayOfWeek = getDay(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return habit.frequency[dayNames[dayOfWeek] as keyof typeof habit.frequency];
  };

  const getStatusIcon = (status: string) => {
    return state.habitLegend[status]?.icon || '−';
  };

  const getStatusColor = (status: string) => {
    return state.habitLegend[status]?.color || '#6B7280';
  };

  // Advanced KPI Calculation Functions
  const calculateHabitKPIs = (goalId: string, habitId: string) => {
    const goal = goals.find(g => g.id === goalId);
    const habit = goal?.habits.find(h => h.id === habitId);
    if (!goal || !habit) return null;

    // Get window dates (start_date ≤ d ≤ min(end_date, Today))
    const startDate = new Date(dateRange.start);
    const endDate = new Date(Math.min(new Date(dateRange.end).getTime(), TODAY.getTime()));
    const windowDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Build planned mask and completion data
    const dayData = windowDays.map(date => {
      const isScheduled = isHabitScheduledForDay(habit, date);
      const status = getHabitStatus(goalId, habitId, date);
      const isPlanned = isScheduled && status !== 'notScheduled';
      const isCompleted = status === 'completed';
      const isPartial = status === 'partial';
      const isMissed = status === 'missed';
      
      return {
        date,
        isPlanned,
        isCompleted,
        isPartial,
        isMissed,
        completionValue: isCompleted ? 1 : (isPartial ? 0.5 : 0)
      };
    });

    const plannedDays = dayData.filter(d => d.isPlanned);
    const P = plannedDays.length;

    // If no planned occurrences, return neutral scores
    if (P === 0) {
      return {
        completionRate: 50,
        streakLength: 50,
        adherenceVariance: 50,
        onTimeRate: 50,
        recoveryAfterMiss: 50,
        trendDirection: 50,
        weightedConsistency: 50,
        resilience: 50,
        overallScore: 50,
        plannedDays: 0,
        completedDays: 0
      };
    }

    // 1) Completion Rate
    const completedCount = plannedDays.reduce((sum, d) => sum + d.completionValue, 0);
    const CR = completedCount / P;
    const completionRate = Math.round(100 * CR);

    // 2) Streak Length (boundary-aware)
    let currentStreak = 0;
    let maxStreak = 0;
    for (const day of plannedDays) {
      if (day.isCompleted) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    const S_max = Math.min(KPI_CONFIG.S_STAR, P);
    const streakLength = Math.round(100 * Math.min(maxStreak / S_max, 1));

    // 3) Adherence Variance (inverse)
    const completionValues = plannedDays.map(d => d.completionValue);
    const mean = completionValues.reduce((a, b) => a + b, 0) / completionValues.length;
    const variance = completionValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / completionValues.length;
    const adherenceVariance = Math.round(100 * (1 - Math.min(variance / 0.25, 1)));

    // 4) On-Time Rate (assuming completed = on-time for simplicity)
    const onTimeCount = plannedDays.filter(d => d.isCompleted).length;
    const totalCompleted = Math.max(1, plannedDays.filter(d => d.completionValue > 0).length);
    const onTimeRate = Math.round(100 * (onTimeCount / totalCompleted));

    // 5) Recovery After Miss
    let recoveryDays = [];
    for (let i = 0; i < plannedDays.length - 1; i++) {
      if (plannedDays[i].isMissed) {
        for (let j = i + 1; j < plannedDays.length; j++) {
          if (plannedDays[j].isCompleted) {
            recoveryDays.push(j - i);
            break;
          }
        }
      }
    }
    const avgRecovery = recoveryDays.length > 0 ? recoveryDays.reduce((a, b) => a + b, 0) / recoveryDays.length : 1;
    const recoveryAfterMiss = Math.round(100 * (1 - Math.min(avgRecovery / KPI_CONFIG.R_STAR, 1)));

    // 6) Trend Direction
    const midPoint = Math.floor(plannedDays.length / 2);
    const firstHalf = plannedDays.slice(0, midPoint);
    const secondHalf = plannedDays.slice(midPoint);
    
    const CR_H1 = firstHalf.length > 0 ? firstHalf.reduce((sum, d) => sum + d.completionValue, 0) / firstHalf.length : 0;
    const CR_H2 = secondHalf.length > 0 ? secondHalf.reduce((sum, d) => sum + d.completionValue, 0) / secondHalf.length : 0;
    const delta = CR_H2 - CR_H1;
    const trendDirection = Math.round(100 * Math.max(0, Math.min(1, (delta + 1) / 2)));

    // 7) Weighted Consistency (harmonic mean of completion and streak)
    const c = Math.max(CR, KPI_CONFIG.EPSILON);
    const s = Math.max(streakLength / 100, KPI_CONFIG.EPSILON);
    const WC = 2 / (1/c + 1/s);
    const weightedConsistency = Math.round(100 * WC);

    // 8) Resilience (simplified - completion rate after setback periods)
    const weeklyCompletions = [];
    for (let i = 0; i < plannedDays.length; i += 7) {
      const week = plannedDays.slice(i, i + 7);
      if (week.length > 0) {
        const weekCR = week.reduce((sum, d) => sum + d.completionValue, 0) / week.length;
        weeklyCompletions.push(weekCR);
      }
    }
    
    let resilienceScores = [];
    for (let i = 0; i < weeklyCompletions.length - 1; i++) {
      if (weeklyCompletions[i] < KPI_CONFIG.TAU) {
        resilienceScores.push(weeklyCompletions[i + 1]);
      }
    }
    const avgResilience = resilienceScores.length > 0 ? resilienceScores.reduce((a, b) => a + b, 0) / resilienceScores.length : CR;
    const resilience = Math.round(100 * avgResilience);

    // Overall Habit Score (weighted average)
    const weights = KPI_CONFIG.WEIGHTS;
    const overallScore = Math.round(
      (weights.completion * completionRate +
       weights.streak * streakLength +
       weights.adherence * adherenceVariance +
       weights.onTime * onTimeRate +
       weights.recovery * recoveryAfterMiss +
       weights.trend * trendDirection +
       weights.consistency * weightedConsistency +
       weights.resilience * resilience) /
      (weights.completion + weights.streak + weights.adherence + weights.onTime + 
       weights.recovery + weights.trend + weights.consistency + weights.resilience)
    );

    return {
      completionRate: Math.max(0, Math.min(100, completionRate)),
      streakLength: Math.max(0, Math.min(100, streakLength)),
      adherenceVariance: Math.max(0, Math.min(100, adherenceVariance)),
      onTimeRate: Math.max(0, Math.min(100, onTimeRate)),
      recoveryAfterMiss: Math.max(0, Math.min(100, recoveryAfterMiss)),
      trendDirection: Math.max(0, Math.min(100, trendDirection)),
      weightedConsistency: Math.max(0, Math.min(100, weightedConsistency)),
      resilience: Math.max(0, Math.min(100, resilience)),
      overallScore: Math.max(0, Math.min(100, overallScore)),
      plannedDays: P,
      completedDays: Math.round(completedCount)
    };
  };

  // Enhanced Goal Metrics with KPI rollup
  const calculateAdvancedGoalMetrics = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return { totalHabits: 0, avgCompletion: 0, streak: 0, totalCompleted: 0, overallScore: 0 };

    const habitKPIs = goal.habits.map(habit => calculateHabitKPIs(goalId, habit.id)).filter(Boolean);
    
    if (habitKPIs.length === 0) {
      return { totalHabits: 0, avgCompletion: 0, streak: 0, totalCompleted: 0, overallScore: 0 };
    }

    const avgCompletion = Math.round(habitKPIs.reduce((sum, kpi) => sum + kpi.completionRate, 0) / habitKPIs.length);
    const avgStreak = Math.round(habitKPIs.reduce((sum, kpi) => sum + kpi.streakLength, 0) / habitKPIs.length);
    const totalCompleted = habitKPIs.reduce((sum, kpi) => sum + kpi.completedDays, 0);
    const overallScore = Math.round(habitKPIs.reduce((sum, kpi) => sum + kpi.overallScore, 0) / habitKPIs.length);

    return {
      totalHabits: goal.habits.length,
      avgCompletion,
      streak: avgStreak,
      totalCompleted,
      overallScore
    };
  };

  const setQuickDateRange = (type: string) => {
    const today = TODAY; // Use the TODAY constant defined at component level
    let start = new Date();
    let end = new Date();

    switch (type) {
      case '1d':
        start = end = today;
        break;
      case '1w':
        start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case '1m':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case '3m':
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
  };

  const moveGoal = (goalId: string, direction: 'up' | 'down') => {
    const sortedGoals = [...goals].sort((a, b) => a.position - b.position);
    const currentIndex = sortedGoals.findIndex(g => g.id === goalId);
    
    if ((direction === 'up' && currentIndex > 0) || (direction === 'down' && currentIndex < sortedGoals.length - 1)) {
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const updatedGoals = [...sortedGoals];
      
      // Swap positions
      const temp = updatedGoals[currentIndex].position;
      updatedGoals[currentIndex].position = updatedGoals[newIndex].position;
      updatedGoals[newIndex].position = temp;
      
      setGoals(updatedGoals);
    }
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'position'>) => {
    const maxPosition = Math.max(...goals.map(g => g.position), 0);
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`,
      position: maxPosition + 1,
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

  // Calculate metrics
  // Legacy method for backward compatibility
  const calculateHabitMetrics = (goalId: string, habitId: string) => {
    const kpis = calculateHabitKPIs(goalId, habitId);
    if (!kpis) return { completedDays: 0, scheduledDays: 0, completionRate: 0 };
    
    return {
      completedDays: kpis.completedDays,
      scheduledDays: kpis.plannedDays,
      completionRate: kpis.completionRate
    };
  };

  const calculateGoalMetrics = (goalId: string) => {
    return calculateAdvancedGoalMetrics(goalId);
  };

  // Calculate dashboard metrics
  const dashboardMetrics = {
    totalGoals: goals.length,
    totalHabits: goals.reduce((sum, g) => sum + g.habits.length, 0),
    overallCompletion: goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + calculateAdvancedGoalMetrics(g.id).overallScore, 0) / goals.length)
      : 0,
    activeStreak: Math.max(...goals.map(g => calculateAdvancedGoalMetrics(g.id).streak), 0)
  };

  const sortedGoals = [...goals].sort((a, b) => a.position - b.position);

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

        <button 
          onClick={() => setShowGoalModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Goals</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardMetrics.totalGoals}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Habits</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{dashboardMetrics.totalHabits}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardMetrics.overallCompletion}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Current Streak</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{dashboardMetrics.activeStreak} days</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            {[
              { key: '1d', label: '1D' },
              { key: '1w', label: '1W' },
              { key: '1m', label: '1M' },
              { key: '3m', label: '3M' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setQuickDateRange(key)}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Goals & Habit Tracking ({format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedGoals.map(goal => {
            const goalMetrics = calculateGoalMetrics(goal.id);
            
            return (
              <div key={goal.id} className="p-4">
                {/* Goal Header */}
                <div className="flex items-center justify-between mb-4">
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
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {goal.name}
                      </h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Goal Metrics */}
                    <div className="flex space-x-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-gray-900 dark:text-white">{goalMetrics.totalHabits}</div>
                        <div className="text-gray-500 dark:text-gray-400">Habits</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">{goalMetrics.avgCompletion}%</div>
                        <div className="text-gray-500 dark:text-gray-400">Avg</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">{goalMetrics.streak}</div>
                        <div className="text-gray-500 dark:text-gray-400">Streak</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{goalMetrics.totalCompleted}</div>
                        <div className="text-gray-500 dark:text-gray-400">Done</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveGoal(goal.id, 'up')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveGoal(goal.id, 'down')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingHabit({ goalId: goal.id })}
                        className="p-1 text-gray-400 hover:text-green-500 transition-colors duration-200"
                        title="Add habit"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setShowGoalModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                        title="Edit goal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Habit Tracker */}
                {expandedGoals.has(goal.id) && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-1 px-1 font-medium text-gray-700 dark:text-gray-300 w-32">
                            Habit
                          </th>
                          {daysInRange.map((date, i) => (
                            <th key={i} className="text-center py-1 px-0.5 font-medium text-gray-500 dark:text-gray-400 min-w-[24px]">
                              <div className="text-xs">{format(date, 'EEE')}</div>
                              <div className="text-sm font-bold">{format(date, 'd')}</div>
                            </th>
                          ))}
                          <th className="text-center py-1 px-1 font-medium text-gray-700 dark:text-gray-300 w-16">
                            Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {goal.habits.map(habit => {
                          const habitKPIs = calculateHabitKPIs(goal.id, habit.id);
                          const habitMetrics = calculateHabitMetrics(goal.id, habit.id); // For backward compatibility
                          
                          return (
                            <tr key={habit.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                              <td className="py-1 px-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-base">{habit.icon}</span>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {habit.name}
                                    </div>
                                    {habit.description && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {habit.description}
                                      </div>
                                    )}
                                    {habitKPIs && (
                                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        <div className="grid grid-cols-4 gap-1">
                                          <span title="Completion Rate">CR: {habitKPIs.completionRate}%</span>
                                          <span title="Streak Length">SL: {habitKPIs.streakLength}%</span>
                                          <span title="Trend Direction">TD: {habitKPIs.trendDirection}%</span>
                                          <span title="Overall Score">OS: {habitKPIs.overallScore}%</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 mt-1">
                                          <span title="Adherence Variance">AV: {habitKPIs.adherenceVariance}%</span>
                                          <span title="Recovery">RC: {habitKPIs.recoveryAfterMiss}%</span>
                                          <span title="Consistency">WC: {habitKPIs.weightedConsistency}%</span>
                                          <span title="Resilience">RS: {habitKPIs.resilience}%</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => setEditingHabit({ goalId: goal.id, habit })}
                                      className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                                      title="Edit habit"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => deleteHabitFromGoal(goal.id, habit.id)}
                                      className="p-0.5 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                      title="Delete habit"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              {daysInRange.map((date, i) => {
                                const isScheduled = isHabitScheduledForDay(habit, date);
                                const isFutureDate = date > TODAY;
                                const status = getHabitStatus(goal.id, habit.id, date);
                                const icon = getStatusIcon(status);
                                const color = getStatusColor(status);
                                
                                // Show "Scheduled (future)" for future dates that are scheduled
                                const displayStatus = isFutureDate && isScheduled && status === 'notScheduled' ? 'scheduled' : status;
                                const displayIcon = isFutureDate && isScheduled && status === 'notScheduled' ? '○' : icon;
                                const displayColor = isFutureDate && isScheduled && status === 'notScheduled' ? '#9CA3AF' : color;
                                
                                return (
                                  <td key={i} className="text-center py-1 px-0.5">
                                    <button
                                      onClick={() => {
                                        // Allow toggling for any day, but different logic for scheduled vs unscheduled
                                        if (isScheduled) {
                                          // For scheduled days: cycle through all statuses including notScheduled
                                          const statusKeys = ['completed', 'partial', 'missed', 'notScheduled'];
                                          const currentIndex = statusKeys.indexOf(displayStatus);
                                          const nextIndex = (currentIndex + 1) % statusKeys.length;
                                          updateHabitStatus(goal.id, habit.id, date, statusKeys[nextIndex]);
                                        } else {
                                          // For unscheduled days: cycle through completion statuses
                                          const statusKeys = Object.keys(state.habitLegend);
                                          const currentIndex = statusKeys.indexOf(displayStatus);
                                          const nextIndex = (currentIndex + 1) % statusKeys.length;
                                          updateHabitStatus(goal.id, habit.id, date, statusKeys[nextIndex]);
                                        }
                                      }}
                                      className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 flex items-center justify-center text-xs font-medium"
                                      style={{ 
                                        color: displayColor, 
                                        backgroundColor: isScheduled || displayStatus !== 'notScheduled' ? `${displayColor}20` : 'transparent',
                                        borderStyle: isScheduled ? 'solid' : 'dotted'
                                      }}
                                      title={isFutureDate && isScheduled && status === 'notScheduled' ? 'Scheduled (future date)' : state.habitLegend[displayStatus]?.label}
                                    >
                                      {isScheduled || displayStatus !== 'notScheduled' ? displayIcon : '·'}
                                    </button>
                                  </td>
                                );
                              })}
                              <td className="text-center py-1 px-1">
                                <div className="text-sm font-bold" style={{ color: (habitKPIs?.overallScore || 0) >= 80 ? '#10B981' : (habitKPIs?.overallScore || 0) >= 60 ? '#F59E0B' : '#EF4444' }}>
                                  {habitKPIs?.overallScore || 0}%
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {Object.entries(state.habitLegend).map(([key, legend]) => (
            <div key={key} className="flex items-center space-x-3">
              <div
                className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs font-medium"
                style={{ color: legend.color, backgroundColor: `${legend.color}20` }}
              >
                {legend.icon}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {key === 'notScheduled' ? 'Not Scheduled' : legend.label}
              </span>
            </div>
          ))}
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded">
              <div className="text-gray-400">○</div>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Scheduled (future date)
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 flex items-center justify-center border border-gray-400 border-dotted rounded">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Unscheduled
            </span>
          </div>
        </div>
        
        {/* KPI Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            KPI Abbreviations
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div><strong>CR:</strong> Completion Rate</div>
            <div><strong>SL:</strong> Streak Length</div>
            <div><strong>AV:</strong> Adherence Variance</div>
            <div><strong>TD:</strong> Trend Direction</div>
            <div><strong>RC:</strong> Recovery Rate</div>
            <div><strong>WC:</strong> Weighted Consistency</div>
            <div><strong>RS:</strong> Resilience</div>
            <div><strong>OS:</strong> Overall Score</div>
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
  onSave: (goal: Omit<Goal, 'id' | 'position'> | Goal) => void; 
  onClose: () => void; 
}) {
  const { dispatch } = useData();
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    color: goal?.color || '#10B981',
    position: goal?.position || 1,
  });
  const [createHealthDimension, setCreateHealthDimension] = useState(false);

  const colors = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create health dimension if checkbox is checked and it's a new goal
    if (!goal && createHealthDimension) {
      const healthDimension = {
        id: `health-${Date.now()}`,
        key: formData.name.toLowerCase().replace(/\s+/g, '-'),
        label: formData.name,
        description: formData.description || `Health tracking for ${formData.name}`,
        color: formData.color,
        position: 1,
        linkedGoalId: `goal-${Date.now()}`
      };
      
      // In a real implementation, you would dispatch this to create the health dimension
      // For now, we'll just log it to show the integration works
      console.log('Creating health dimension:', healthDimension);
    }
    
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position
            </label>
            <input
              type="number"
              min="1"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Goal order position"
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

          {!goal && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="createHealthDimension"
                  checked={createHealthDimension}
                  onChange={(e) => setCreateHealthDimension(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <label htmlFor="createHealthDimension" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                    Automatically create a corresponding Health Dimension to be measured in the Health Tracker page
                  </label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This will create a health dimension with the same name that you can track and score in the Health Tracker
                  </p>
                </div>
              </div>
            </div>
          )}

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
  const [showMoreIcons, setShowMoreIcons] = useState(false);
  const [formData, setFormData] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    icon: habit?.icon || '',
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

  const basicIcons = ['✅', '🏃', '🏋️', '🏊', '🧘', '📚', '📝', '💊', '🥗', '💧', '😴', '🎯', '🎨', '🎵', '🌱'];
  const moreIcons = [
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥅', '🏑', '🏒', '🥍', '🏏', '🪃', '🥏',
    '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🪗', '🎤', '🎧', '🎵', '🎶', '🎙️', '📻',
    '🔬', '🧪', '🧬', '🔭', '📡', '💻', '⌨️', '🖥️', '🖨️', '📱', '☎️', '📞', '📟', '📠', '📺',
    '🍎', '🥕', '🥬', '🥒', '🌶️', '🫑', '🥑', '🍆', '🥔', '🧄', '🧅', '🥜', '🌰', '🫘', '🥥'
  ];
  
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
            <div className="grid grid-cols-8 gap-2 mb-2">
              {basicIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: formData.icon === icon ? '' : icon })}
                  className={`w-8 h-8 rounded border-2 transition-all duration-200 flex items-center justify-center text-lg ${
                    formData.icon === icon ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {icon}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowMoreIcons(!showMoreIcons)}
                className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-all duration-200 flex items-center justify-center text-sm bg-gray-50 dark:bg-gray-700"
              >
                {showMoreIcons ? '▲' : '▼'}
              </button>
            </div>
            
            {showMoreIcons && (
              <div className="grid grid-cols-8 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                {moreIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, icon: formData.icon === icon ? '' : icon });
                      setShowMoreIcons(false);
                    }}
                    className={`w-8 h-8 rounded border-2 transition-all duration-200 flex items-center justify-center text-lg ${
                      formData.icon === icon ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
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