import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCalendarStore } from '../stores/calendarStore';
import { googleAuthService } from '../services/googleAuth';
import { googleCalendarApi } from '../services/googleCalendarApi';
import GoogleCalendarWizard from '../components/Setup/GoogleCalendarWizard';

// Components
import CalendarHeader from '../components/Calendar/CalendarHeader';
import SchedulingTabs from '../components/Calendar/SchedulingTabs';
import MonthView from '../components/Calendar/MonthView';
import WeekView from '../components/Calendar/WeekView';
import DayView from '../components/Calendar/DayView';
import AgendaView from '../components/Calendar/AgendaView';
import AuthButton from '../components/Auth/AuthButton';

// Icons
import { AlertCircle, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';

const Calendar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  
  const {
    currentView,
    isLoading,
    error,
    setLoading,
    setError,
    setEvents,
    setTasks,
    setTaskLists,
    setOutOfOfficeEvents
  } = useCalendarStore();

  useEffect(() => {
    checkAuthAndLoadData();
    
    // Check if credentials are configured
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    setHasCredentials(!!clientId);
    
    // Handle auth callback messages
    const authParam = searchParams.get('auth');
    if (authParam === 'success') {
      setAuthMessage('Successfully connected to Google Calendar!');
      setTimeout(() => setAuthMessage(null), 5000);
    } else if (authParam === 'error') {
      setAuthMessage('Failed to connect to Google Calendar. Please try again.');
      setTimeout(() => setAuthMessage(null), 5000);
    }
  }, [searchParams]);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      
      const isAuthenticated = googleAuthService.isAuthenticated();
      setAuthStatus(isAuthenticated ? 'authenticated' : 'unauthenticated');
      
      if (isAuthenticated) {
        await loadCalendarData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthStatus('unauthenticated');
      setError('Authentication failed. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load events
      const eventsResponse = await googleCalendarApi.getEvents();
      setEvents(eventsResponse.items || []);

      // Load task lists
      const taskListsResponse = await googleCalendarApi.getTaskLists();
      setTaskLists(taskListsResponse.items || []);

      // Load tasks from all task lists
      const allTasks = [];
      for (const taskList of taskListsResponse.items || []) {
        const tasksResponse = await googleCalendarApi.getTasks(taskList.id);
        allTasks.push(...(tasksResponse.items || []));
      }
      setTasks(allTasks);

      // Load out-of-office events
      const outOfOfficeResponse = await googleCalendarApi.getOutOfOfficeEvents();
      setOutOfOfficeEvents(outOfOfficeResponse.items || []);

    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setError('Failed to load calendar data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleWizardComplete = (credentials: { clientId: string; clientSecret: string }) => {
    // Store credentials in localStorage for this session
    localStorage.setItem('google_client_id', credentials.clientId);
    localStorage.setItem('google_client_secret', credentials.clientSecret);
    
    // Update auth service with new credentials
    googleAuthService.updateCredentials(credentials.clientId, credentials.clientSecret);
    
    setHasCredentials(true);
    setShowSetupWizard(false);
    
    // Show success message
    setAuthMessage('Google Calendar credentials configured successfully! You can now connect your account.');
    setTimeout(() => setAuthMessage(null), 5000);
  };

  const renderCalendarView = () => {
    switch (currentView) {
      case 'month':
        return <MonthView />;
      case 'week':
      case '4days':
        return <WeekView />;
      case 'day':
        return <DayView />;
      case 'agenda':
        return <AgendaView />;
      case 'year':
        return <MonthView />; // Simplified year view using month view
      default:
        return <MonthView />;
    }
  };

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !hasCredentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-primary-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Google Calendar Integration
            </h1>
            
            {!hasCredentials ? (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  To get started, we need to set up Google Calendar integration. Our setup wizard will guide you through the process.
                </p>
                <button
                  onClick={() => setShowSetupWizard(true)}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Settings className="w-5 h-5" />
                  <span>Start Setup Wizard</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Connect your Google Calendar to access all four scheduling types: Meetings, Events, Out of Office, and Appointment Schedules.
                </p>
                <AuthButton />
              </>
            )}
            
            {authMessage && (
              <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                authMessage.includes('Successfully') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {authMessage.includes('Successfully') ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{authMessage}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Setup Wizard */}
        {showSetupWizard && (
          <GoogleCalendarWizard
            onComplete={handleWizardComplete}
            onClose={() => setShowSetupWizard(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auth Success/Error Messages */}
      {authMessage && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          authMessage.includes('Successfully') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50'
        }`}>
          {authMessage.includes('Successfully') ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{authMessage}</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <CalendarHeader />
        <div className="flex items-center space-x-3">
          {!hasCredentials && (
            <button
              onClick={() => setShowSetupWizard(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Setup</span>
            </button>
          )}
          <AuthButton />
        </div>
      </div>

      {/* Scheduling Tabs */}
      <SchedulingTabs />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span className="text-gray-700 dark:text-gray-300">Loading calendar data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {renderCalendarView()}
      
      {/* Setup Wizard */}
      {showSetupWizard && (
        <GoogleCalendarWizard
          onComplete={handleWizardComplete}
          onClose={() => setShowSetupWizard(false)}
        />
      )}
    </div>
  );
};

export default Calendar;