import React, { useState } from 'react';
import { Heart, Plus, TrendingUp, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const healthDimensions = [
  { key: 'spiritual', label: 'Spiritual', description: 'You with your God/Universe', color: '#8B5CF6' },
  { key: 'mental', label: 'Mental', description: 'You with your mind', color: '#3B82F6' },
  { key: 'social', label: 'Social', description: 'You with other people', color: '#10B981' },
  { key: 'physical', label: 'Physical', description: 'You with your body', color: '#F59E0B' },
  { key: 'financial', label: 'Financial', description: 'You with your resources', color: '#EF4444' },
];

export default function Health() {
  const { state, dispatch } = useData();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showScoreModal, setShowScoreModal] = useState(false);

  const currentScore = state.healthScores.find(score => score.month === selectedMonth);

  const handleScoreUpdate = (dimension: string, score: number) => {
    const existingScore = currentScore || {
      id: selectedMonth,
      month: selectedMonth,
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
    const existingScore = currentScore || {
      id: selectedMonth,
      month: selectedMonth,
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

  // Prepare radar chart data
  const radarData = healthDimensions.map(dimension => ({
    dimension: dimension.label,
    score: currentScore?.[dimension.key as keyof typeof currentScore] || 5,
    fullMark: 10,
  }));

  // Prepare trend data
  const trendData = state.healthScores
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(score => ({
      month: format(new Date(score.month + '-01'), 'MMM'),
      ...healthDimensions.reduce((acc, dim) => ({
        ...acc,
        [dim.label]: score[dim.key as keyof typeof score],
      }), {}),
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
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={() => setShowScoreModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Update Scores</span>
          </button>
        </div>
      </div>

      {/* Health Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthDimensions.map(dimension => {
          const score = currentScore?.[dimension.key as keyof typeof currentScore] || 5;
          const notes = currentScore?.notes[dimension.key as keyof typeof currentScore.notes] || '';
          
          return (
            <div key={dimension.key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: dimension.color }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {dimension.label}
                </h3>
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
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {notes}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
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
      </div>

      {/* Score Update Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Health Scores for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {healthDimensions.map(dimension => {
                const score = currentScore?.[dimension.key as keyof typeof currentScore] || 5;
                const notes = currentScore?.notes[dimension.key as keyof typeof currentScore.notes] || '';
                
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