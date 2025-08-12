import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Activity, 
  Clock, 
  Zap, 
  Award, 
  BarChart3,
  Calendar,
  ChevronDown,
  Info,
  Plus,
  Minus
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

// Import KPI calculation functions from Habits page
const calculateHabitKPIs = (habit: any, TODAY: Date) => {
  const startDate = new Date(habit.startDate);
  const endDate = habit.endDate ? new Date(habit.endDate) : TODAY;
  const windowEnd = endDate < TODAY ? endDate : TODAY;
  
  if (startDate > windowEnd) {
    return {
      completionRate: 50,
      streakLength: 50,
      adherenceVariance: 50,
      onTimeRate: 50,
      recoveryAfterMiss: 50,
      trendDirection: 50,
      weightedConsistency: 50,
      resilience: 50
    };
  }

  const daysInWindow = eachDayOfInterval({ start: startDate, end: windowEnd });
  const plannedDays = daysInWindow.filter(day => {
    const dayOfWeek = day.getDay();
    const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    return habit.schedule[dayKey];
  });

  if (plannedDays.length === 0) {
    return {
      completionRate: 50,
      streakLength: 50,
      adherenceVariance: 50,
      onTimeRate: 50,
      recoveryAfterMiss: 50,
      trendDirection: 50,
      weightedConsistency: 50,
      resilience: 50
    };
  }

  const completedDays = plannedDays.filter(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return habit.completions?.[dateKey] === 'completed';
  });

  const onTimeDays = completedDays.filter(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return habit.onTime?.[dateKey] === true;
  });

  // 1. Completion Rate
  const completionRate = Math.round((completedDays.length / plannedDays.length) * 100);

  // 2. Streak Length
  let currentStreak = 0;
  let maxStreak = 0;
  for (const day of plannedDays) {
    const dateKey = format(day, 'yyyy-MM-dd');
    if (habit.completions?.[dateKey] === 'completed') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  const maxPossibleStreak = Math.min(21, plannedDays.length);
  const streakLength = Math.round((maxStreak / maxPossibleStreak) * 100);

  // 3. Adherence Variance (simplified)
  const completionValues = plannedDays.map(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return habit.completions?.[dateKey] === 'completed' ? 1 : 0;
  });
  const mean = completionValues.reduce((a, b) => a + b, 0) / completionValues.length;
  const variance = completionValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / completionValues.length;
  const adherenceVariance = Math.round((1 - Math.min(variance / 0.25, 1)) * 100);

  // 4. On-Time Rate
  const onTimeRate = completedDays.length > 0 ? Math.round((onTimeDays.length / completedDays.length) * 100) : 50;

  // 5. Recovery After Miss (simplified)
  let totalRecoveryDays = 0;
  let missCount = 0;
  for (let i = 0; i < plannedDays.length - 1; i++) {
    const dateKey = format(plannedDays[i], 'yyyy-MM-dd');
    if (habit.completions?.[dateKey] !== 'completed') {
      missCount++;
      for (let j = i + 1; j < plannedDays.length; j++) {
        const nextDateKey = format(plannedDays[j], 'yyyy-MM-dd');
        if (habit.completions?.[nextDateKey] === 'completed') {
          totalRecoveryDays += (j - i);
          break;
        }
      }
    }
  }
  const avgRecovery = missCount > 0 ? totalRecoveryDays / missCount : 1;
  const recoveryAfterMiss = Math.round((1 - Math.min(avgRecovery / 3, 1)) * 100);

  // 6. Trend Direction
  const midPoint = Math.floor(plannedDays.length / 2);
  const firstHalf = plannedDays.slice(0, midPoint);
  const secondHalf = plannedDays.slice(midPoint);
  
  const firstHalfCompletion = firstHalf.filter(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return habit.completions?.[dateKey] === 'completed';
  }).length / firstHalf.length;
  
  const secondHalfCompletion = secondHalf.filter(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return habit.completions?.[dateKey] === 'completed';
  }).length / secondHalf.length;
  
  const delta = secondHalfCompletion - firstHalfCompletion;
  const trendDirection = Math.round(Math.max(0, Math.min(100, ((delta + 1) / 2) * 100)));

  // 7. Weighted Consistency
  const cr = completionRate / 100;
  const sl = streakLength / 100;
  const epsilon = 0.000001;
  const weightedConsistency = Math.round((2 / (1/Math.max(cr, epsilon) + 1/Math.max(sl, epsilon))) * 100);

  // 8. Resilience (simplified)
  const resilience = Math.round(Math.max(0, Math.min(100, (completionRate + streakLength) / 2)));

  return {
    completionRate,
    streakLength,
    adherenceVariance,
    onTimeRate,
    recoveryAfterMiss,
    trendDirection,
    weightedConsistency,
    resilience
  };
};

export default function HealthDimensionDetail() {
  const { dimensionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  const [selectedDimension, setSelectedDimension] = useState(dimensionId || 'spiritual');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [manualAdjustment, setManualAdjustment] = useState(0);
  const [showFormulaModal, setShowFormulaModal] = useState<string | null>(null);

  const TODAY = new Date();

  // Health dimensions with their linked goals
  const healthDimensions = [
    { id: 'spiritual', label: 'Spiritual', description: 'You with your God/Universe', color: '#8B5CF6' },
    { id: 'mental', label: 'Mental', description: 'You with your mind', color: '#3B82F6' },
    { id: 'social', label: 'Social', description: 'You with other people', color: '#10B981' },
    { id: 'physical', label: 'Physical', description: 'You with your body', color: '#F59E0B' },
    { id: 'financial', label: 'Financial', description: 'You with your resources', color: '#EF4444' },
  ];

  const currentDimension = healthDimensions.find(d => d.id === selectedDimension);
  const linkedGoal = state.goals?.find(g => g.name.toLowerCase() === selectedDimension);
  const habits = linkedGoal?.habits || [];

  // Calculate KPIs for each habit
  const habitKPIs = habits.map(habit => ({
    ...habit,
    kpis: calculateHabitKPIs(habit, TODAY)
  }));

  // Calculate rolled-up KPIs for the dimension
  const calculateRolledUpKPIs = () => {
    if (habitKPIs.length === 0) {
      return {
        completionRate: 50,
        streakLength: 50,
        adherenceVariance: 50,
        onTimeRate: 50,
        recoveryAfterMiss: 50,
        trendDirection: 50,
        weightedConsistency: 50,
        resilience: 50
      };
    }

    const avgKPIs = {
      completionRate: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.completionRate, 0) / habitKPIs.length),
      streakLength: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.streakLength, 0) / habitKPIs.length),
      adherenceVariance: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.adherenceVariance, 0) / habitKPIs.length),
      onTimeRate: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.onTimeRate, 0) / habitKPIs.length),
      recoveryAfterMiss: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.recoveryAfterMiss, 0) / habitKPIs.length),
      trendDirection: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.trendDirection, 0) / habitKPIs.length),
      weightedConsistency: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.weightedConsistency, 0) / habitKPIs.length),
      resilience: Math.round(habitKPIs.reduce((sum, h) => sum + h.kpis.resilience, 0) / habitKPIs.length)
    };

    return avgKPIs;
  };

  const rolledUpKPIs = calculateRolledUpKPIs();

  // Calculate overall health score with manual adjustment
  const calculateOverallScore = () => {
    const kpiValues = Object.values(rolledUpKPIs);
    const baseScore = kpiValues.reduce((sum, val) => sum + val, 0) / kpiValues.length;
    return Math.max(0, Math.min(100, Math.round(baseScore + manualAdjustment)));
  };

  const overallScore = calculateOverallScore();

  // Update health score in context when it changes
  useEffect(() => {
    const monthKey = format(new Date(), 'yyyy-MM');
    const existingScore = state.healthScores?.find(s => s.month === monthKey) || {
      id: monthKey,
      month: monthKey,
      spiritual: 5,
      mental: 5,
      social: 5,
      physical: 5,
      financial: 5,
      notes: {}
    };

    const updatedScore = {
      ...existingScore,
      [selectedDimension]: Math.round(overallScore / 10) // Convert to 1-10 scale
    };

    dispatch({ type: 'SET_HEALTH_SCORE', payload: updatedScore });
  }, [overallScore, selectedDimension, dispatch, state.healthScores]);

  const kpiDefinitions = [
    {
      key: 'completionRate',
      label: 'Completion Rate',
      icon: Target,
      description: 'Measures how many scheduled (planned) habit instances were actually completed.',
      formula: 'CR = (Σ y_d) / P\nCR_100 = 100 * CR',
      color: '#10B981'
    },
    {
      key: 'streakLength',
      label: 'Streak Length',
      icon: Zap,
      description: 'Tracks the longest run of consecutive planned days where the habit was completed. Rewards consistent streaks.',
      formula: 'S_max = min(S*, P)\nSL_100 = 100 * min(SL / S_max, 1)',
      color: '#F59E0B'
    },
    {
      key: 'adherenceVariance',
      label: 'Adherence Variance',
      icon: Activity,
      description: 'Measures stability of execution; high variance means irregular performance. Lower variance = higher score.',
      formula: 'AV_100 = 100 * (1 - min(Var(y_d) / 0.25, 1))',
      color: '#8B5CF6'
    },
    {
      key: 'onTimeRate',
      label: 'On-Time Rate',
      icon: Clock,
      description: 'Percent of completed habits done at the planned or target time.',
      formula: 'OT = (Σ t_d) / max(1, Σ y_d)\nOT_100 = 100 * OT',
      color: '#3B82F6'
    },
    {
      key: 'recoveryAfterMiss',
      label: 'Recovery After Miss',
      icon: TrendingUp,
      description: 'Average number of days it takes to return to completion after a missed planned day. Faster recovery = higher score.',
      formula: 'RC_100 = 100 * (1 - min(R / R*, 1))',
      color: '#EF4444'
    },
    {
      key: 'trendDirection',
      label: 'Trend Direction',
      icon: BarChart3,
      description: 'Shows improvement or decline over the period by comparing first half to second half completion rates.',
      formula: 'Δ = CR_H2 - CR_H1\nTD_100 = 100 * clamp((Δ + 1) / 2, 0, 1)',
      color: '#06B6D4'
    },
    {
      key: 'weightedConsistency',
      label: 'Weighted Consistency',
      icon: Award,
      description: 'Balances overall completion and streak length so both contribute to the score.',
      formula: 'WC = 2 / (1/max(CR, ε) + 1/max(SL_100/100, ε))\nWC_100 = 100 * WC',
      color: '#84CC16'
    },
    {
      key: 'resilience',
      label: 'Resilience',
      icon: Award,
      description: 'Measures how well the user bounces back after a low-performing week ("setback week").',
      formula: 'RS_100 = 100 * RS',
      color: '#EC4899'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/health')}
            className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:shadow-xl border transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: currentDimension?.color }}
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                {currentDimension?.label} Health
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {currentDimension?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Selector */}
        <div className="flex items-center space-x-4">
          <select
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {healthDimensions.map(dimension => (
              <option key={dimension.id} value={dimension.id}>
                {dimension.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
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

          {/* Overall Score with Manual Adjustment */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</div>
              <div className="text-3xl font-bold" style={{ color: currentDimension?.color }}>
                {overallScore}%
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setManualAdjustment(prev => Math.max(-20, prev - 1))}
                className="p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                {manualAdjustment > 0 ? '+' : ''}{manualAdjustment}
              </span>
              <button
                onClick={() => setManualAdjustment(prev => Math.min(20, prev + 1))}
                className="p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiDefinitions.map((kpi) => {
          const Icon = kpi.icon;
          const score = rolledUpKPIs[kpi.key as keyof typeof rolledUpKPIs];
          
          return (
            <div key={kpi.key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {kpi.label}
                  </h3>
                </div>
                <button
                  onClick={() => setShowFormulaModal(kpi.key)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Info className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(score)}`}>
                  {score}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {kpi.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Habits Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Associated Habits & Individual KPIs
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Individual habit performance contributing to {currentDimension?.label} health score
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Habit
                </th>
                {kpiDefinitions.map(kpi => (
                  <th key={kpi.key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {kpi.label.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {habitKPIs.map((habit, index) => (
                <tr key={habit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {habit.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {habit.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  {kpiDefinitions.map(kpi => {
                    const score = habit.kpis[kpi.key as keyof typeof habit.kpis];
                    return (
                      <td key={kpi.key} className="px-3 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Rollup Row */}
              <tr className="bg-gray-100 dark:bg-gray-700/30 font-semibold">
                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                  {currentDimension?.label} Rollup
                </td>
                {kpiDefinitions.map(kpi => {
                  const score = rolledUpKPIs[kpi.key as keyof typeof rolledUpKPIs];
                  return (
                    <td key={kpi.key} className="px-3 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            {(() => {
              const kpi = kpiDefinitions.find(k => k.key === showFormulaModal);
              const Icon = kpi?.icon || Info;
              return (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6" style={{ color: kpi?.color }} />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {kpi?.label}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {kpi?.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Formula
                      </h4>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                        <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                          {kpi?.formula}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Score
                      </h4>
                      <div className="text-center">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(rolledUpKPIs[showFormulaModal as keyof typeof rolledUpKPIs])}`}>
                          {rolledUpKPIs[showFormulaModal as keyof typeof rolledUpKPIs]}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowFormulaModal(null)}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}