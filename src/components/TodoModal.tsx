import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Target } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { v4 as uuidv4 } from 'uuid';

interface TodoModalProps {
  currentDate: Date;
  onClose: () => void;
  editTodo?: any;
  defaultProjectId?: string;
}

export default function TodoModal({ 
  currentDate, 
  onClose, 
  editTodo,
  defaultProjectId
}: TodoModalProps) {
  const { state, dispatch } = useData();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    noTimeAssigned: false,
    useDuration: false,
    goalDate: '',
    limitDate: '',
    priority: 'none' as 'none' | 'low' | 'medium' | 'high',
    projectId: defaultProjectId || state.projects[0]?.id || '',
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editTodo) {
      const startTime = editTodo.dueDate ? 
        `${editTodo.dueDate.getHours().toString().padStart(2, '0')}:${editTodo.dueDate.getMinutes().toString().padStart(2, '0')}` : 
        '09:00';
      
      setFormData({
        title: editTodo.title || '',
        description: editTodo.description || '',
        startTime,
        endTime: '10:00',
        duration: editTodo.duration || 60,
        noTimeAssigned: !editTodo.duration,
        useDuration: !!editTodo.duration,
        goalDate: editTodo.dueDate ? editTodo.dueDate.toISOString().split('T')[0] : '',
        limitDate: '',
        priority: editTodo.priority || 'none',
        projectId: editTodo.projectId || defaultProjectId || state.projects[0]?.id || '',
      });
    } else if (defaultProjectId) {
      setFormData(prev => ({ ...prev, projectId: defaultProjectId }));
    }
  }, [editTodo, defaultProjectId, state.projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate due date
    let dueDate = new Date(currentDate);
    if (formData.goalDate) {
      dueDate = new Date(formData.goalDate);
    }

    // Set time if not "no time assigned"
    if (!formData.noTimeAssigned) {
      if (formData.useDuration) {
        // Use start time + duration
        const [sh, sm] = formData.startTime.split(':').map(Number);
        dueDate.setHours(sh, sm, 0, 0);
      } else {
        // Use start time
        const [sh, sm] = formData.startTime.split(':').map(Number);
        dueDate.setHours(sh, sm, 0, 0);
      }
    }

    const todo = {
      id: editTodo?.id || uuidv4(),
      title: formData.title,
      description: formData.description,
      completed: editTodo?.completed || false,
      priority: formData.priority === 'none' ? 'low' : formData.priority,
      projectId: formData.projectId,
      dueDate,
      createdAt: editTodo?.createdAt || new Date(),
      duration: formData.useDuration ? formData.duration : undefined,
      position: editTodo?.position || 0,
    };

    if (editTodo) {
      dispatch({ type: 'UPDATE_TODO', payload: todo });
    } else {
      dispatch({ type: 'ADD_TODO', payload: todo });
    }

    onClose();
  };

  const handleDurationChange = (minutes: number) => {
    setFormData({ ...formData, duration: minutes });
    
    // Update end time based on start time + duration
    if (formData.startTime) {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = startMinutes + minutes;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      setFormData(prev => ({
        ...prev,
        endTime: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`,
        duration: minutes
      }));
    }
  };

  const quickDurations = [
    { label: '5m', value: 5 },
    { label: '10m', value: 10 },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '60m', value: 60 },
    { label: '90m', value: 90 },
    { label: '120m', value: 120 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            New ToDo Item
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter task title..."
            />
          </div>

          {/* 2. Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional description..."
            />
          </div>

          {/* 3. Start Time / End Time */}
          {!formData.noTimeAssigned && !formData.useDuration && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* 4. No time or duration assigned checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="noTimeAssigned"
              checked={formData.noTimeAssigned}
              onChange={(e) => setFormData({ 
                ...formData, 
                noTimeAssigned: e.target.checked,
                useDuration: e.target.checked ? false : formData.useDuration
              })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="noTimeAssigned" className="text-sm text-gray-700 dark:text-gray-300">
              No time or duration assigned
            </label>
          </div>

          {/* 5. Use duration instead of end time checkbox */}
          {!formData.noTimeAssigned && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useDuration"
                  checked={formData.useDuration}
                  onChange={(e) => setFormData({ ...formData, useDuration: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="useDuration" className="text-sm text-gray-700 dark:text-gray-300">
                  Use duration instead of end time
                </label>
              </div>

              {/* Duration selection */}
              {formData.useDuration && (
                <div className="flex items-center space-x-2 flex-wrap">
                  {quickDurations.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleDurationChange(value)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                        formData.duration === value 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 60)}
                    className="w-16 px-2 py-1 text-xs rounded border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-primary-500"
                    placeholder="min"
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. Goal Date and Limit Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Goal Date
              </label>
              <input
                type="date"
                value={formData.goalDate}
                onChange={(e) => setFormData({ ...formData, goalDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Limit Date
              </label>
              <input
                type="date"
                value={formData.limitDate}
                onChange={(e) => setFormData({ ...formData, limitDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 7. Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {state.projects.sort((a, b) => {
                if (a.id === 'unclassified') return -1;
                if (b.id === 'unclassified') return 1;
                return 0;
              }).map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 shadow-lg transition-all duration-200"
            >
              {editTodo ? 'Update' : 'Create'} ToDo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}