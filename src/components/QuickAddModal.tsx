// components/QuickAddModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X, Calendar, CheckSquare, Clock, MapPin, Users, Video
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { v4 as uuidv4 } from 'uuid';

interface QuickAddModalProps {
  currentDate: Date;
  onClose: () => void;
  editItem?: any; // Item to edit (event, todo, or plan item)
  editType?: 'event' | 'todo' | 'plan';
}

export default function QuickAddModal({ 
  currentDate, 
  onClose, 
  editItem, 
  editType 
}: QuickAddModalProps) {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState<'event' | 'todo'>('event');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60, // Duration in minutes
    useDuration: false, // Whether to use duration instead of end time
    priority: 'medium' as 'low' | 'medium' | 'high',
    projectId: state.projects[0]?.id || '',
    location: '',
    guests: '',
    addGoogleMeet: false,
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (editItem) {
      const startTime = editItem.start ? 
        `${editItem.start.getHours().toString().padStart(2, '0')}:${editItem.start.getMinutes().toString().padStart(2, '0')}` : 
        '09:00';
      const endTime = editItem.end ? 
        `${editItem.end.getHours().toString().padStart(2, '0')}:${editItem.end.getMinutes().toString().padStart(2, '0')}` : 
        '10:00';
      
      const duration = editItem.start && editItem.end ? 
        Math.round((editItem.end.getTime() - editItem.start.getTime()) / (1000 * 60)) : 
        60;

      setFormData({
        title: editItem.title || '',
        description: editItem.description || '',
        startTime,
        endTime,
        duration,
        useDuration: false,
        priority: editItem.priority || 'medium',
        projectId: editItem.projectId || state.projects[0]?.id || '',
        location: editItem.location || '',
        guests: editItem.guests ? editItem.guests.join(', ') : '',
        addGoogleMeet: !!editItem.meetLink,
      });

      if (editType === 'plan') {
        setActiveTab(editItem.type || 'event');
      } else {
        setActiveTab(editType || 'event');
      }
    }
  }, [editItem, editType, state.projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'event') {
      const [sh, sm] = formData.startTime.split(':').map(Number);
      let [eh, em] = formData.endTime.split(':').map(Number);
      
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      start.setHours(sh, sm, 0, 0);
      
      if (formData.useDuration) {
        end.setTime(start.getTime() + formData.duration * 60 * 1000);
      } else {
        end.setHours(eh, em, 0, 0);
      }

      const event = {
        id: editItem?.originalId || editItem?.id || uuidv4(),
        title: formData.title,
        description: formData.description,
        start,
        end,
        color: '#3B82F6',
        location: formData.location,
        guests: formData.guests ? formData.guests.split(',').map(g => g.trim()) : [],
        meetLink: formData.addGoogleMeet
          ? (editItem?.meetLink || `https://meet.google.com/${Math.random().toString(36).substring(2, 9)}`)
          : undefined,
      };

      if (editItem) {
        dispatch({ type: 'UPDATE_EVENT', payload: event });
      } else {
        dispatch({ type: 'ADD_EVENT', payload: event });
      }
    } else {
      const todo = {
        id: editItem?.originalId || editItem?.id || uuidv4(),
        title: formData.title,
        description: formData.description,
        completed: editItem?.completed || false,
        priority: formData.priority,
        projectId: formData.projectId,
        dueDate: new Date(currentDate),
        createdAt: editItem?.createdAt || new Date(),
        duration: formData.useDuration ? formData.duration : 
          (formData.endTime && formData.startTime ? 
            ((parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1])) - 
             (parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1]))) : 60),
      };

      if (editItem) {
        dispatch({ type: 'UPDATE_TODO', payload: todo });
      } else {
        dispatch({ type: 'ADD_TODO', payload: todo });
      }
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editItem ? 'Edit Item' : 'Quick Add'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2">
          {[
            { key: 'event', label: 'Event', icon: Calendar },
            { key: 'todo', label: 'Todo', icon: CheckSquare },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'event' | 'todo')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium flex-1 justify-center ${
                activeTab === key
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Time/Duration Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useDuration"
                checked={formData.useDuration}
                onChange={(e) => setFormData({ ...formData, useDuration: e.target.checked })}
                className="rounded border-gray-300 text-primary-600"
              />
              <label htmlFor="useDuration" className="text-sm text-gray-700 dark:text-gray-300">
                Use duration instead of end time
              </label>
            </div>

            {formData.useDuration ? (
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDurationChange(30)}
                    className={`px-3 py-2 rounded text-sm ${
                      formData.duration === 30 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    30m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(60)}
                    className={`px-3 py-2 rounded text-sm ${
                      formData.duration === 60 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    1h
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(120)}
                    className={`px-3 py-2 rounded text-sm ${
                      formData.duration === 120 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    2h
                  </button>
                </div>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={formData.duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 60)}
                  className="w-full mt-2 px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Custom duration (minutes)"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {activeTab === 'event' ? (
            <>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Users className="w-4 h-4 mr-1" /> Guests
                </label>
                <input
                  type="text"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Separate with commas"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="googleMeet"
                  checked={formData.addGoogleMeet}
                  onChange={(e) => setFormData({ ...formData, addGoogleMeet: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="googleMeet" className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Video className="w-4 h-4 mr-1" />
                  Add Google Meet
                </label>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Project
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {state.projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
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
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 shadow-lg"
            >
              {editItem ? 'Update' : 'Add'} {activeTab === 'event' ? 'Event' : 'Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}