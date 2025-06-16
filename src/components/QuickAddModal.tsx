import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { format, setHours, setMinutes } from 'date-fns';
import { useData } from '../contexts/DataContext';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface QuickAddModalProps {
  currentDate: Date;
  onClose: () => void;
}

export default function QuickAddModal({ currentDate, onClose }: QuickAddModalProps) {
  const { dispatch } = useData();
  const [type, setType] = useState<'event' | 'todo'>('event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    const baseTime = setHours(setMinutes(currentDate, 0), 9);
    const endTime = setHours(setMinutes(currentDate, 0), 10);

    if (type === 'event') {
      const newEvent = {
        id: uuidv4(),
        title,
        start: baseTime,
        end: endTime,
        description,
        location: '',
        guests: [],
        meetLink: '',
        color: '#3B82F6',
      };
      dispatch({ type: 'ADD_EVENT', payload: newEvent });
    } else {
      const newTodo = {
        id: uuidv4(),
        title,
        description,
        completed: false,
        priority: 'medium' as const,
        projectId: '',
        dueDate: currentDate,
        createdAt: new Date(),
      };
      dispatch({ type: 'ADD_TODO', payload: newTodo });
    }

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-50">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Add - {type === 'event' ? 'Event' : 'To-Do'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'event' | 'todo')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="event">Event</option>
              <option value="todo">To-Do</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="Title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 px-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Add
          </button>
        </div>
      </div>
    </Dialog>
  );
}
