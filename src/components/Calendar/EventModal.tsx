import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Users, 
  MapPin, 
  FileText, 
  Video, 
  Calendar as CalendarIcon,
  Repeat,
  Bell,
  Globe,
  ChevronDown,
  CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { googleCalendarApi } from '../../services/googleCalendarApi';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: { hour: number; minute: number };
  editingEvent?: any;
}

type EventType = 'event' | 'task' | 'outOfOffice' | 'appointmentSchedule';

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  editingEvent
}) => {
  const { addEvent, updateEvent } = useCalendarStore();
  
  const [activeTab, setActiveTab] = useState<EventType>('event');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecurrenceDropdown, setShowRecurrenceDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '12:00',
    endDate: '',
    endTime: '13:00',
    allDay: false,
    location: '',
    guests: '',
    addGoogleMeet: false,
    recurrence: 'none' as string,
    taskList: 'default',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Initialize form with selected date/time or editing event
  useEffect(() => {
    if (editingEvent) {
      console.log('🔍 EDITING EVENT - Raw data:', editingEvent);
      
      // Determine if this is a task or event
      if (editingEvent.kind === 'tasks#task' || editingEvent.due) {
        console.log('📝 Editing TASK');
        setActiveTab('task');
        
        const dueDate = editingEvent.due ? new Date(editingEvent.due) : new Date();
        console.log('📅 Task due date parsed:', dueDate);
        
        setFormData({
          ...formData,
          title: editingEvent.title || '',
          description: editingEvent.notes || '',
          startDate: format(dueDate, 'yyyy-MM-dd'),
          startTime: format(dueDate, 'HH:mm'),
          endDate: format(dueDate, 'yyyy-MM-dd'),
          endTime: format(dueDate, 'HH:mm'),
          allDay: false,
        });
      } else {
        // It's an event
        console.log('📅 Editing EVENT');
        setActiveTab('event');
        
        // Fix timezone parsing for all-day events
        let startDate: Date;
        let endDate: Date;
        const isAllDay = !editingEvent.start.dateTime;
        
        if (isAllDay) {
          // All-day events: parse date without timezone conversion
          startDate = new Date(editingEvent.start.date + 'T00:00:00');
          endDate = new Date(editingEvent.end.date + 'T00:00:00');
          console.log('🌅 All-day event dates:', {
            startRaw: editingEvent.start.date,
            endRaw: editingEvent.end.date,
            startParsed: startDate,
            endParsed: endDate
          });
        } else {
          // Timed events: use dateTime
          startDate = new Date(editingEvent.start.dateTime);
          endDate = new Date(editingEvent.end.dateTime);
          console.log('⏰ Timed event dates:', {
            startRaw: editingEvent.start.dateTime,
            endRaw: editingEvent.end.dateTime,
            startParsed: startDate,
            endParsed: endDate
          });
        }
        
        setFormData({
          ...formData,
          title: editingEvent.summary || '',
          description: editingEvent.description || '',
          startDate: format(startDate, 'yyyy-MM-dd'),
          startTime: isAllDay ? '12:00' : format(startDate, 'HH:mm'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          endTime: isAllDay ? '13:00' : format(endDate, 'HH:mm'),
          allDay: isAllDay,
          location: editingEvent.location || '',
          guests: editingEvent.attendees?.map(a => a.email).join(', ') || '',
          addGoogleMeet: !!editingEvent.conferenceData,
          allDay: isAllDay,
        });
      }
    } else if (selectedDate) {
      // Pre-fill with selected date/time
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startTime = selectedTime ? 
        `${selectedTime.hour.toString().padStart(2, '0')}:${selectedTime.minute.toString().padStart(2, '0')}` : 
        '12:00';
      
      // For events: Calculate end time (1 hour later)
      // For tasks: End time same as start time (no duration)
      const startHour = selectedTime?.hour || 12;
      const startMinute = selectedTime?.minute || 0;
      const endHour = activeTab === 'task' ? startHour : (startMinute === 30 ? startHour + 1 : startHour);
      const endMinute = activeTab === 'task' ? startMinute : (startMinute === 30 ? 0 : 30);
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      setFormData({
        ...formData,
        startDate: dateStr,
        endDate: dateStr,
        startTime,
        endTime: activeTab === 'task' ? startTime : endTime
      });
    }
  }, [selectedDate, selectedTime, editingEvent, activeTab]);

  const eventTypes = [
    { key: 'event', label: 'Event', description: 'Meeting or appointment' },
    { key: 'task', label: 'Task', description: 'To-do item with deadline' },
    { key: 'outOfOffice', label: 'Out of office', description: 'Block time and decline meetings' },
    { key: 'appointmentSchedule', label: 'Appointment schedule', description: 'Bookable time slots' }
  ];

  const recurrenceOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly on ' + (selectedDate ? format(selectedDate, 'EEEE') : 'weekday') },
    { value: 'monthly', label: 'Monthly on the ' + (selectedDate ? format(selectedDate, 'do EEEE') : 'same day') },
    { value: 'yearly', label: 'Annually on ' + (selectedDate ? format(selectedDate, 'MMMM d') : 'same date') },
    { value: 'weekdays', label: 'Every weekday (Monday to Friday)' },
    { value: 'custom', label: 'Custom...' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === 'task') {
        // Create Google Task with proper due date/time
        const dueDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
        
        const taskData = {
          title: formData.title,
          notes: formData.description,
          due: dueDateTime.toISOString(),
          status: 'needsAction'
        };

        if (editingEvent && (editingEvent.kind === 'tasks#task' || editingEvent.due)) {
          // Update existing task
          const taskLists = await googleCalendarApi.getTaskLists();
          const defaultTaskList = taskLists.items?.[0];
          if (defaultTaskList) {
            await googleCalendarApi.updateTask(defaultTaskList.id, editingEvent.id, taskData);
          }
        } else {
          // Create new task
          const taskLists = await googleCalendarApi.getTaskLists();
          const defaultTaskList = taskLists.items?.[0];
          if (defaultTaskList) {
            await googleCalendarApi.createTask(defaultTaskList.id, taskData);
          }
        }
      } else {
        // Create Calendar Event
        let eventData: any = {
          summary: formData.title,
          description: formData.description,
          location: formData.location,
          attendees: formData.guests ? 
            formData.guests.split(',').map(email => ({ email: email.trim() })) : 
            undefined,
          conferenceData: formData.addGoogleMeet ? {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          } : undefined,
          recurrence: buildRecurrenceRule(),
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes: 10 }]
          },
          visibility: 'default',
          transparency: 'opaque'
        };

        if (formData.allDay) {
          // All-day event: same start and end date, no time
          eventData.start = { 
            date: formData.startDate
          };
          eventData.end = { 
            date: formData.startDate // Same date for all-day events
          };
          console.log('🌅 Creating all-day event:', {
            start: eventData.start,
            end: eventData.end
          });
        } else {
          // Timed event: specific start and end times
          const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
          const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`);
          
          eventData.start = { 
            dateTime: startDateTime.toISOString(),
            timeZone: formData.timeZone 
          };
          eventData.end = { 
            dateTime: endDateTime.toISOString(),
            timeZone: formData.timeZone 
          };
          console.log('⏰ Creating timed event:', {
            start: eventData.start,
            end: eventData.end
          });
        }

        if (editingEvent && !editingEvent.kind?.includes('task')) {
          await googleCalendarApi.updateEvent('primary', editingEvent.id, eventData);
        } else {
          if (formData.addGoogleMeet) {
            await googleCalendarApi.createMeetingWithConference('primary', eventData);
          } else {
            await googleCalendarApi.createEvent('primary', eventData);
          }
        }
      }

      // Refresh calendar data
      window.dispatchEvent(new CustomEvent('refreshCalendarData'));
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildRecurrenceRule = (): string[] | undefined => {
    if (formData.recurrence === 'none') return undefined;

    const rules: string[] = [];
    
    switch (formData.recurrence) {
      case 'daily':
        rules.push('RRULE:FREQ=DAILY');
        break;
      case 'weekly':
        const dayOfWeek = selectedDate ? format(selectedDate, 'E').toUpperCase().substring(0, 2) : 'MO';
        rules.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayOfWeek}`);
        break;
      case 'monthly':
        rules.push('RRULE:FREQ=MONTHLY');
        break;
      case 'yearly':
        rules.push('RRULE:FREQ=YEARLY');
        break;
      case 'weekdays':
        rules.push('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
        break;
    }

    return rules;
  };

  const handleAllDayToggle = (checked: boolean) => {
    setFormData({
      ...formData,
      allDay: checked,
      endDate: formData.startDate, // Always same date for all-day events
      startTime: checked ? '' : '12:00',
      endTime: checked ? '' : '13:00'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Add title"
            className="text-xl font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 flex-1"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Type Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {eventTypes.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key as EventType)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date and Time - Different for Events vs Tasks */}
          <div className="flex items-center space-x-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <div className="flex-1 space-y-3">
              {activeTab === 'event' ? (
                // Event: Start date/time and End date/time
                <>
                  <div className="flex items-center space-x-4">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        startDate: e.target.value,
                        endDate: e.target.value // Always same date for all-day events
                      })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {!formData.allDay && (
                      <>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-gray-500">–</span>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            endDate: formData.allDay ? formData.startDate : e.target.value 
                          })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          disabled={formData.allDay}
                        />
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          disabled={formData.allDay}
                        />
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.allDay}
                        onChange={(e) => handleAllDayToggle(e.target.checked)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">All day</span>
                    </label>
                    {formData.allDay && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        End date will match start date for all-day events
                      </span>
                    )}
                  </div>
                </>
              ) : (
                // Task: Only date and start time (no end time, no duration)
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Tasks have no duration - just a start time
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Event-specific fields */}
          {activeTab === 'event' && (
            <>
              {/* Recurrence */}
              <div className="flex items-center space-x-4">
                <Repeat className="w-5 h-5 text-gray-400" />
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setShowRecurrenceDropdown(!showRecurrenceDropdown)}
                    className="w-full text-left px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between"
                  >
                    <span>{recurrenceOptions.find(opt => opt.value === formData.recurrence)?.label || 'Does not repeat'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showRecurrenceDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {recurrenceOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, recurrence: option.value });
                            setShowRecurrenceDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-center space-x-4">
                <Users className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  placeholder="Add guests"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>

              {/* Google Meet */}
              <div className="flex items-center space-x-4">
                <Video className="w-5 h-5 text-gray-400" />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.addGoogleMeet}
                    onChange={(e) => setFormData({ ...formData, addGoogleMeet: e.target.checked })}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Add Google Meet video conferencing</span>
                </label>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Add location"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
            </>
          )}

          {/* Task-specific fields */}
          {activeTab === 'task' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Task Details</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Tasks are created in Google Tasks and appear with a blue checkmark icon. They have a due date and time but no duration.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="flex items-start space-x-4">
            <FileText className="w-5 h-5 text-gray-400 mt-2" />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={activeTab === 'task' ? 'Add task description' : 'Add description or a Google Drive attachment'}
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 resize-none"
            />
          </div>

          {/* Calendar Selection */}
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${activeTab === 'task' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <span className="text-gray-700 dark:text-gray-300">
                  {activeTab === 'task' ? 'Tasks' : 'Matthew Couri'}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {activeTab === 'task' 
                  ? 'Google Tasks • No duration • Blue checkmark'
                  : 'Google Calendar • Busy • Default visibility • Notify 10 minutes before'
                }
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              More options
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;