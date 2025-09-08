import React, { useState } from 'react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  Phone,
  Calendar,
  CheckSquare,
  Copy,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { useCalendarStore } from '../../stores/calendarStore';
import { googleCalendarApi } from '../../services/googleCalendarApi';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  eventType: 'event' | 'task';
  onEdit?: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  eventType,
  onEdit
}) => {
  const { updateEvent, deleteEvent, updateTask, deleteTask } = useCalendarStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(event?.attendees?.find((a: any) => a.self)?.responseStatus || 'needsAction');

  if (!isOpen || !event) return null;

  const handleRSVP = async (status: 'accepted' | 'declined' | 'tentative') => {
    try {
      setRsvpStatus(status);
      
      // Update attendee response in the event
      const updatedAttendees = event.attendees?.map((attendee: any) => 
        attendee.self ? { ...attendee, responseStatus: status } : attendee
      ) || [];

      const updatedEvent = {
        ...event,
        attendees: updatedAttendees
      };

      // Update in Google Calendar
      await googleCalendarApi.updateEvent('primary', event.id, updatedEvent);
      
      // Update local store
      updateEvent(event.id, updatedEvent);
      
      // Refresh calendar data
      window.dispatchEvent(new CustomEvent('refreshCalendarData'));
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${event.summary || event.title}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      
      if (eventType === 'event') {
        await googleCalendarApi.deleteEvent('primary', event.id);
        deleteEvent(event.id);
      } else {
        // For tasks, we need the task list ID
        const taskLists = await googleCalendarApi.getTaskLists();
        const defaultTaskList = taskLists.items?.[0];
        if (defaultTaskList) {
          await googleCalendarApi.deleteTask(defaultTaskList.id, event.id);
          deleteTask(event.id);
        }
      }
      
      // Refresh calendar data
      window.dispatchEvent(new CustomEvent('refreshCalendarData'));
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkTaskComplete = async () => {
    try {
      const updatedTask = {
        ...event,
        status: event.status === 'completed' ? 'needsAction' : 'completed',
        completed: event.status === 'completed' ? undefined : new Date().toISOString()
      };

      // Update in Google Tasks
      const taskLists = await googleCalendarApi.getTaskLists();
      const defaultTaskList = taskLists.items?.[0];
      if (defaultTaskList) {
        await googleCalendarApi.updateTask(defaultTaskList.id, event.id, updatedTask);
        updateTask(event.id, updatedTask);
      }
      
      // Refresh calendar data
      window.dispatchEvent(new CustomEvent('refreshCalendarData'));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getEventTime = () => {
    if (eventType === 'task') {
      if (event.due) {
        return format(new Date(event.due), 'EEEE, MMMM d\nHH:mm');
      }
      return 'No due date';
    }

    if (event.start?.date && event.end?.date) {
      // All day event
      const start = new Date(event.start.date);
      const end = new Date(event.end.date);
      if (start.toDateString() === end.toDateString()) {
        return format(start, 'EEEE, MMMM d');
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }

    if (event.start?.dateTime && event.end?.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const dateStr = format(start, 'EEEE, MMMM d');
      const timeStr = `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`;
      return `${dateStr}\n${timeStr}`;
    }

    return 'No time specified';
  };

  const getRecurrenceText = () => {
    if (!event.recurrence || event.recurrence.length === 0) {
      return 'Does not repeat';
    }

    const rule = event.recurrence[0];
    if (rule.includes('FREQ=DAILY')) return 'Daily';
    if (rule.includes('FREQ=WEEKLY')) {
      if (rule.includes('BYDAY=MO,TU,WE,TH,FR')) return 'Every weekday (Monday to Friday)';
      return `Weekly on ${format(new Date(event.start?.dateTime || event.start?.date), 'EEEE')}`;
    }
    if (rule.includes('FREQ=MONTHLY')) return 'Monthly';
    if (rule.includes('FREQ=YEARLY')) return 'Annually';
    
    return 'Custom recurrence';
  };

  if (eventType === 'task') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {event.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Date/Time */}
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-900 dark:text-white whitespace-pre-line">
                  {getEventTime()}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.notes && (
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-1 h-4 bg-gray-400 rounded"></div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {event.notes}
                </div>
              </div>
            )}

            {/* Mark Complete Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleMarkTaskComplete}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                  event.status === 'completed'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {event.status === 'completed' ? 'Mark incomplete' : 'Mark completed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Event/Meeting Modal
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {event.summary}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date/Time */}
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-line">
                {getEventTime()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {getRecurrenceText()}
              </div>
            </div>
          </div>

          {/* Google Meet */}
          {event.conferenceData?.entryPoints && (
            <div className="space-y-2">
              <button
                onClick={() => window.open(event.conferenceData.entryPoints[0].uri, '_blank')}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                <Video className="w-5 h-5" />
                <span>Join with Google Meet</span>
              </button>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{event.conferenceData.entryPoints[0].uri}</span>
                <button
                  onClick={() => copyToClipboard(event.conferenceData.entryPoints[0].uri)}
                  className="p-1 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Phone Numbers */}
          {event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'phone') && (
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer">
                Join by phone
              </div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="text-sm text-gray-900 dark:text-white">
                {event.location}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-1 h-4 bg-gray-400 rounded"></div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {event.description}
              </div>
            </div>
          )}

          {/* Guests */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div className="text-sm text-gray-900 dark:text-white">
                  {event.attendees.length} guests
                </div>
              </div>
              
              <div className="ml-8 space-y-2">
                {event.attendees.map((attendee: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                        {attendee.displayName?.charAt(0) || attendee.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {attendee.displayName || attendee.email}
                        </div>
                        {attendee.organizer && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Organizer</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {attendee.responseStatus === 'accepted' && (
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">Yes</span>
                      )}
                      {attendee.responseStatus === 'declined' && (
                        <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">No</span>
                      )}
                      {attendee.responseStatus === 'tentative' && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">Maybe</span>
                      )}
                      {attendee.responseStatus === 'needsAction' && (
                        <span className="text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Awaiting</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminder */}
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-3 h-3 border border-gray-400 rounded"></div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              10 minutes before
            </div>
          </div>

          {/* Calendar */}
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="text-sm text-gray-900 dark:text-white">
              Matthew Couri
            </div>
          </div>

          {/* RSVP Section for Events */}
          {eventType === 'event' && event.attendees && event.attendees.some((a: any) => a.self) && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">Going?</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRSVP('accepted')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    rsvpStatus === 'accepted'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleRSVP('declined')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    rsvpStatus === 'declined'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => handleRSVP('tentative')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    rsvpStatus === 'tentative'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Maybe
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default EventDetailModal;