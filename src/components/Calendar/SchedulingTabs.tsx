import React, { useState } from 'react';
import { 
  Users, 
  CheckSquare, 
  Coffee, 
  Calendar,
  Plus
} from 'lucide-react';
import { useCalendarStore } from '../../stores/calendarStore';
import { SchedulingType } from '../../types/calendar';
import { googleCalendarApi } from '../../services/googleCalendarApi';

const SchedulingTabs: React.FC = () => {
  const { activeSchedulingType, setActiveSchedulingType } = useCalendarStore();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const tabs: Array<{
    key: SchedulingType;
    label: string;
    icon: any;
    description: string;
    color: string;
  }> = [
    {
      key: 'meetings',
      label: 'Meetings',
      icon: Users,
      description: 'Calendar events with attendees',
      color: 'blue'
    },
    {
      key: 'events',
      label: 'Events',
      icon: CheckSquare,
      description: 'Personal tasks and to-dos',
      color: 'green'
    },
    {
      key: 'outOfOffice',
      label: 'Out of Office',
      icon: Coffee,
      description: 'Block time and auto-decline meetings',
      color: 'orange'
    },
    {
      key: 'appointments',
      label: 'Appointment Schedules',
      icon: Calendar,
      description: 'Bookable time slots for others',
      color: 'purple'
    }
  ];

  const getTabStyles = (tabKey: SchedulingType, color: string) => {
    const isActive = activeSchedulingType === tabKey;
    
    const colorClasses = {
      blue: isActive 
        ? 'bg-blue-500 text-white border-blue-500' 
        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-700/50',
      green: isActive 
        ? 'bg-green-500 text-white border-green-500' 
        : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-700/50',
      orange: isActive 
        ? 'bg-orange-500 text-white border-orange-500' 
        : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 dark:border-orange-700/50',
      purple: isActive 
        ? 'bg-purple-500 text-white border-purple-500' 
        : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-700/50'
    };

    return colorClasses[color as keyof typeof colorClasses];
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    
    try {
      setIsCreating(true);
      console.log('🚀 Creating quick event:', quickAddText);
      await googleCalendarApi.quickAddEvent('primary', quickAddText);
      setQuickAddText('');
      setShowQuickAdd(false);
      console.log('✅ Event created successfully!');
      // TODO: Better to call a refresh function instead of page reload
      // For now, we'll use a small delay to let the API sync
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Scheduling Types
        </h3>
        
        {/* Quick Add Button with Popup */}
        <div className="relative">
          <button 
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add</span>
          </button>
          
          {/* Quick Add Popup */}
          {showQuickAdd && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quick Add Event</h4>
              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                placeholder="e.g., Lunch with John tomorrow at 12pm"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
                onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleQuickAdd}
                  disabled={isCreating || !quickAddText.trim()}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isCreating ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map(({ key, label, icon: Icon, description, color }) => (
          <button
            key={key}
            onClick={() => setActiveSchedulingType(key)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-lg ${getTabStyles(key, color)}`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </div>
            <p className="text-xs opacity-80">
              {description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SchedulingTabs;