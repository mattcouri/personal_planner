import React, { useState } from 'react';
import { Heart, Plus, TrendingUp, Calendar, Edit3, Trash2, Target, Settings, BarChart3, Activity, Zap, Award, ArrowUp, ArrowDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format, eachDayOfInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, BarChart, Bar } from 'recharts';
import { v4 as uuidv4 } from 'uuid';

interface HealthDimension {
  id: string;
  key: string;
  label: string;
  description: string;
  color: string;
  linkedGoalId?: string;
  position: number;
}

export default function Health() {
  const { state, dispatch } = useData();
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingDimension, setEditingDimension] = useState<HealthDimension | null>(null);
  const [healthDimensions, setHealthDimensions] = useState<HealthDimension[]>([
    { id: 'spiritual', key: 'spiritual', label: 'Spiritual', description: 'You with your God/Universe', color: '#8B5CF6', position: 1 },
    { id: 'mental', key: 'mental', label: 'Mental', description: 'You with your mind', color: '#3B82F6', position: 2 },
    { id: 'social', key: 'social', label: 'Social', description: 'You with other people', color: '#10B981', position: 3 },
    { id: 'physical', key: 'physical', label: 'Physical', description: 'You with your body', color: '#F59E0B', position: 4 },
    { id: 'financial', key: 'financial', label: 'Financial', description: 'You with your resources', color: '#EF4444', position: 5 },
  ].sort((a, b) => a.position - b.position));

  // Calculate date range
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  const setQuickDateRange = (type: string) => {
    const today = new Date();
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

  const getCurrentScore = (dimensionKey: string) => {
    const monthKey = format(new Date(), 'yyyy-MM');
    const currentScore = state.healthScores.find(score => score.month === monthKey);
    return currentScore?.[dimensionKey] || 5;
  };

  const handleScoreUpdate = (dimension: string, score: number) => {
    const monthKey = format(new Date(), 'yyyy-MM');
    const existingScore = state.healthScores.find(s => s.month === monthKey) || {
      id: monthKey,
      month: monthKey,
      spiritual: 5,
      mental: 5,
      social: 5,
      physical: 5,
      financial: 5,
      notes: {
        spiritual: '',
        mental: '',
        social: '',
        physical: '',
        financial: '',
      },
    };

    const updatedScore = {
      ...existingScore,
      [dimension]: score,
    };

    dispatch({ type: 'SET_HEALTH_SCORE', payload: updatedScore });
  };

  const handleNotesUpdate = (dimension: string, notes: string) => {
    const monthKey = format(new Date(), 'yyyy-MM');
    const existingScore = state.healthScores.find(s => s.month === monthKey) || {
      id: monthKey,
      month: monthKey,
      spiritual: 5,
      mental: 5,
      social: 5,
      physical: 5,
      financial: 5,
      notes: {
        spiritual: '',
        mental: '',
        social: '',
        physical: '',
        financial: '',
      },
    };

    const updatedScore = {
      ...existingScore,
      notes: {
        ...existingScore.notes,
        [dimension]: notes,
      },
    };

    dispatch({ type: 'SET_HEALTH_SCORE', payload: updatedScore });
  };

  const addHealthDimension = (dimension: Omit<HealthDimension, 'id' | 'position'>, createGoal: boolean) => {
    const maxPosition = Math.max(...healthDimensions.map(d => d.position), 0);
    const newDimension: HealthDimension = {
      ...dimension,
      id: uuidv4(),
      position: maxPosition + 1,
    };

    if (createGoal) {
      // Create corresponding goal in Goals & Habits
      const newGoal = {
        id: uuidv4(),
        name: dimension.label,
        description: dimension.description,
        color: dimension.color,
        position: 1,
        habits: []
      };
      
      newDimension.linkedGoalId = newGoal.id;
      // Note: In a real app, you'd dispatch this to the goals state
      // For now, we'll just store the linkedGoalId
    }

    setHealthDimensions([...healthDimensions, newDimension]);
  };

  const updateHealthDimension = (updatedDimension: HealthDimension) => {
    setHealthDimensions(healthDimensions.map(d => d.id === updatedDimension.id ? updatedDimension : d));
  };

  const deleteHealthDimension = (dimensionId: string) => {
    if (confirm('Are you sure you want to delete this health dimension?')) {
      setHealthDimensions(healthDimensions.filter(d => d.id !== dimensionId));
    }
  };

  // Calculate metrics
  const calculateDashboardMetrics = () => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentScore = state.healthScores.find(score => score.month === currentMonth);
    
    const avgScore = healthDimensions.length > 0 
      ? healthDimensions.reduce((sum, dim) => sum + (currentScore?.[dim.key] || 5), 0) / healthDimensions.length
      : 5;

    const highestScore = healthDimensions.length > 0
      ? Math.max(...healthDimensions.map(dim => currentScore?.[dim.key] || 5))
      : 5;

    const lowestScore = healthDimensions.length > 0
      ? Math.min(...healthDimensions.map(dim => currentScore?.[dim.key] || 5))
      : 5;

    const balanceScore = healthDimensions.length > 0
      ? 10 - (highestScore - lowestScore)
      : 10;

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      highestScore,
      lowestScore,
      balanceScore: Math.max(0, balanceScore)
    };
  };

  const dashboardMetrics = calculateDashboardMetrics();

  // Prepare chart data
  const radarData = healthDimensions.map(dimension => ({
    dimension: dimension.label,
    score: getCurrentScore(dimension.key),
    fullMark: 10,
  }));

  const trendData = state.healthScores
    .filter(score => {
      const scoreDate = new Date(score.month + '-01');
      return scoreDate >= startDate && scoreDate <= endDate;
    })
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(score => ({
      month: format(new Date(score.month + '-01'), 'MMM yyyy'),
      ...healthDimensions.reduce((acc, dim) => ({
        ...acc,
        [dim.label]: score[dim.key] || 5,
      }), {}),
    }));

  // Area chart data for wellness trends
  const wellnessTrendData = trendData.map(item => ({
    ...item,
    average: healthDimensions.reduce((sum, dim) => sum + (item[dim.label] || 5), 0) / healthDimensions.length
  }));

  // Bar chart data for dimension comparison
  const comparisonData = healthDimensions.map(dim => ({
    name: dim.label,
    current: getCurrentScore(dim.key),
    target: 8, // Target score
    color: dim.color
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Heart className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Health Tracker
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDimensionModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Health Dimension</span>
          </button>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </button>
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

      {/* Dashboard Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Average Score</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardMetrics.avgScore}/10</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Highest Score</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{dashboardMetrics.highestScore}/10</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Lowest Score</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{dashboardMetrics.lowestScore}/10</p>
            </div>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Balance Score</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardMetrics.balanceScore}/10</p>
            </div>
            <Award className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Health Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthDimensions.sort((a, b) => a.position - b.position).map(dimension => {
          const score = getCurrentScore(dimension.key);
          const monthKey = format(new Date(), 'yyyy-MM');
          const currentScore = state.healthScores.find(s => s.month === monthKey);
          const notes = currentScore?.notes?.[dimension.key] || '';
          
          return (
            <div 
              key={dimension.id} 
              onClick={() => window.location.href = `/health/${dimension.id}`}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dimension.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {dimension.label}
                  </h3>
                </div>
                <div className="flex items-center space-x-1">
                  {dimension.linkedGoalId && (
                    <div className="p-1 text-green-500" title="Linked to goal">
                      <Target className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {dimension.description}
              </p>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Score
                  </span>
                  <span className="text-2xl font-bold" style={{ color: dimension.color }}>
                    {score}/10
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(score / 10) * 100}%`,
                      backgroundColor: dimension.color 
                    }}
                  />
                </div>
              </div>
              
              {notes && (
            {notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {notes}
                </p>
              </div>
            )}
          </div>
        })}
      </div>

      {/* Charts Grid - 4 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Health Balance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="dimension" />
              <PolarRadiusAxis angle={90} domain={[0, 10]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Health Trends Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              {healthDimensions.map(dimension => (
                <Line
                  key={dimension.key}
                  type="monotone"
                  dataKey={dimension.label}
                  stroke={dimension.color}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wellness Area Chart */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Overall Wellness Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={wellnessTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="average"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Bar Chart */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current vs Target Scores
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="current" fill="#8B5CF6" />
              <Bar dataKey="target" fill="#E5E7EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Dimension Management Modal */}
      {showDimensionModal && !editingDimension && (
        <AddHealthDimensionModal
          dimension={null}
          onSave={(dimension, createGoal) => {
            addHealthDimension(dimension, createGoal);
            setShowDimensionModal(false);
          }}
          onClose={() => setShowDimensionModal(false)}
        />
      )}

      {editingDimension && (
        <AddHealthDimensionModal
          dimension={editingDimension}
          onSave={(dimension, createGoal) => {
            updateHealthDimension(dimension as HealthDimension);
            setEditingDimension(null);
          }}
          onClose={() => setEditingDimension(null)}
        />
      )}

      {showManageModal && (
        <ManageHealthDimensionsModal
          dimensions={healthDimensions}
          onEdit={(dimension) => {
            setEditingDimension(dimension);
            setShowManageModal(false);
          }}
          onDelete={deleteHealthDimension}
          onReorder={(dimensions) => setHealthDimensions(dimensions)}
          onClose={() => setShowManageModal(false)}
        />
      )}

      {/* Score Update Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Health Scores for {format(new Date(), 'MMMM yyyy')}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {healthDimensions.map(dimension => {
                const score = getCurrentScore(dimension.key);
                const monthKey = format(new Date(), 'yyyy-MM');
                const currentScore = state.healthScores.find(s => s.month === monthKey);
                const notes = currentScore?.notes?.[dimension.key] || '';
                
                return (
                  <div key={dimension.key} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: dimension.color }}
                      />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {dimension.label}
                      </h4>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {dimension.description}
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Score (1-10): {score}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={score}
                        onChange={(e) => handleScoreUpdate(dimension.key, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: dimension.color }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => handleNotesUpdate(dimension.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={2}
                        placeholder="Why this score? What can you improve?"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowScoreModal(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Save Scores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Health Dimension Modal Component
function AddHealthDimensionModal({
  dimension,
  onSave,
  onClose,
}: {
  dimension: HealthDimension | null;
  onSave: (dimension: Omit<HealthDimension, 'id' | 'position'> | HealthDimension, createGoal: boolean) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    label: dimension?.label || '',
    description: dimension?.description || '',
    color: dimension?.color || '#8B5CF6',
    position: dimension?.position || 1,
  });
  const [createGoal, setCreateGoal] = useState(false);

  const colors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dimension) {
      onSave({ 
        ...dimension, 
        ...formData,
        key: formData.label.toLowerCase().replace(/\s+/g, '-')
      }, false);
    } else {
      onSave({
        ...formData,
        key: formData.label.toLowerCase().replace(/\s+/g, '-')
      }, createGoal);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {dimension ? 'Edit Health Dimension' : 'Add Health Dimension'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Label
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Emotional Health"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of this health dimension"
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
                  className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position on Page
            </label>
            <input
              type="number"
              min="1"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Display order (1, 2, 3...)"
            />
          </div>

          {!dimension && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="createGoal"
                  checked={createGoal}
                  onChange={(e) => setCreateGoal(e.target.checked)}
                  className="mt-1 w-6 h-6 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <label htmlFor="createGoal" className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
                    Automatically create a corresponding goal in Goals & Habits
                  </label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This will create a goal with the same name that you can add habits to for tracking
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
              {dimension ? 'Update' : 'Create'} Health Dimension
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Management Modal Component
function ManageHealthDimensionsModal({
  dimensions,
  onEdit,
  onDelete,
  onReorder,
  onClose
}: {
  dimensions: HealthDimension[];
  onEdit: (dimension: HealthDimension) => void;
  onDelete: (dimensionId: string) => void;
  onReorder: (dimensions: HealthDimension[]) => void;
  onClose: () => void;
}) {
  const [localDimensions, setLocalDimensions] = useState([...dimensions].sort((a, b) => a.position - b.position));

  const moveUp = (index: number) => {
    if (index > 0) {
      const newDimensions = [...localDimensions];
      const temp = newDimensions[index].position;
      newDimensions[index].position = newDimensions[index - 1].position;
      newDimensions[index - 1].position = temp;
      
      const reordered = newDimensions.sort((a, b) => a.position - b.position);
      setLocalDimensions(reordered);
      onReorder(reordered);
    }
  };

  const moveDown = (index: number) => {
    if (index < localDimensions.length - 1) {
      const newDimensions = [...localDimensions];
      const temp = newDimensions[index].position;
      newDimensions[index].position = newDimensions[index + 1].position;
      newDimensions[index + 1].position = temp;
      
      const reordered = newDimensions.sort((a, b) => a.position - b.position);
      setLocalDimensions(reordered);
      onReorder(reordered);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Manage Health Dimensions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Edit, delete, or reorder existing health dimensions
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {localDimensions.map((dimension, index) => (
              <div key={dimension.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dimension.color }}
                  />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {dimension.label}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {dimension.description}
                    </p>
                  </div>
                  {dimension.linkedGoalId && (
                    <div className="text-green-500" title="Linked to goal">
                      <Target className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === localDimensions.length - 1}
                    className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(dimension)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${dimension.label}"?`)) {
                        onDelete(dimension.id);
                        setLocalDimensions(localDimensions.filter(d => d.id !== dimension.id));
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}