import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCalendarStore } from '../stores/calendarStore';
import { googleAuthService } from '../services/googleAuth';
import { googleCalendarApi } from '../services/googleCalendarApi';
import GoogleCalendarWizard from '../components/Setup/GoogleCalendarWizard';

// Components
import CalendarHeader from '../components/Calendar/CalendarHeader';
import CalendarSidebar from '../components/Calendar/CalendarSidebar';
import MonthView from '../components/Calendar/MonthView';
import WeekView from '../components/Calendar/WeekView';
import DayView from '../components/Calendar/DayView';
import AgendaView from '../components/Calendar/AgendaView';
import AuthButton from '../components/Auth/AuthButton';

// Icons
import { AlertCircle, CheckCircle, Calendar as CalendarIcon, Settings } from 'lucide-react';

const Calendar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  
  const {
    currentView,
    setCurrentView,
    isLoading,
    error,
    setLoading,
    setError,
    setEvents,
    setTasks,
    setTaskLists,
    setOutOfOfficeEvents
  } = useCalendarStore();

  // Set default view to week (like Google Calendar)
  useEffect(() => {
    if (currentView === 'month') {
      setCurrentView('week');
    }
  }, []);
  useEffect(() => {
    initializeCalendar();
    
    // Handle auth callback messages
    const authParam = searchParams.get('auth');
    if (authParam === 'success') {
      setAuthMessage('Successfully connected to Google Calendar!');
      setTimeout(() => setAuthMessage(null), 5000);
      // Clear the URL parameter to avoid repeated messages
      window.history.replaceState({}, '', '/calendar');
    } else if (authParam === 'error') {
      setAuthMessage('Failed to connect to Google Calendar. Please try again.');
      setTimeout(() => setAuthMessage(null), 5000);
      // Clear the URL parameter to avoid repeated messages
      window.history.replaceState({}, '', '/calendar');
    }
  }, [searchParams]);

  const initializeCalendar = async () => {
    console.log('🚀 ===== INITIALIZE CALENDAR STARTED =====');
    
    try {
      setLoading(true);
      
      // Check credentials first
      const credentialsStatus = googleAuthService.getCredentialsStatus();
      setHasCredentials(credentialsStatus.hasCredentials);
      
      console.log('🔐 Credentials status:', credentialsStatus);
      
      if (!credentialsStatus.hasCredentials) {
        console.log('❌ No credentials configured - stopping here');
        setAuthStatus('unauthenticated');
        return;
      }
      
      if (!credentialsStatus.hasTokens) {
        console.log('❌ No auth tokens found - stopping here');
        setAuthStatus('unauthenticated');
        return;
      }
      
      console.log('✅ Both credentials and tokens found - proceeding to validate token');
      
      // Try to get a valid access token (this will refresh if needed)
      try {
        const token = await googleAuthService.getValidAccessToken();
        console.log('✅ Valid access token obtained:', token ? 'YES' : 'NO');
        setAuthStatus('authenticated');
        
        console.log('📞 About to call loadCalendarData...');
        await loadCalendarData();
        
        await loadCalendarData();
      } catch (tokenError) {
        console.error('❌ Token validation failed:', tokenError);
        setAuthStatus('unauthenticated');
        setError('Authentication expired. Please sign in again.');
      }
      
    } catch (error) {
      console.error('💥 Initialize calendar failed:', error);
      setAuthStatus('unauthenticated');
      setError('Authentication failed. Please sign in again.');
    } finally {
      setLoading(false);
      console.log('🏁 Initialize calendar completed');
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading calendar data...');

      // Load events
      console.log('📅 Fetching events...');
      const eventsResponse = await googleCalendarApi.getEvents();
      console.log('📅 Events response:', eventsResponse);
      setEvents(eventsResponse.items || []);

      // Load task lists
      console.log('📋 Fetching task lists...');
      const taskListsResponse = await googleCalendarApi.getTaskLists();
      console.log('📋 Task lists response:', taskListsResponse);
      setTaskLists(taskListsResponse.items || []);

      // Load tasks from all task lists
      console.log('✅ Fetching tasks...');
      const allTasks = [];
      for (const taskList of taskListsResponse.items || []) {
        const tasksResponse = await googleCalendarApi.getTasks(taskList.id);
        console.log(`✅ Tasks for ${taskList.title}:`, tasksResponse);
        allTasks.push(...(tasksResponse.items || []));
      }
      setTasks(allTasks);

      // Load out-of-office events
      console.log('☕ Fetching out-of-office events...');
      const outOfOfficeResponse = await googleCalendarApi.getOutOfOfficeEvents();
      console.log('☕ Out-of-office response:', outOfOfficeResponse);
      setOutOfOfficeEvents(outOfOfficeResponse.items || []);

      console.log('✅ Calendar data loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load calendar data:', error);
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

  const handleReconnect = async () => {
    try {
      setLoading(true);
      await googleAuthService.initialize();
      const authUrl = googleAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Reconnection failed:', error);
      setError('Failed to reconnect. Please try again.');
      setLoading(false);
    }
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
                <div className="space-y-4">
                  <AuthButton />
                  {authStatus === 'unauthenticated' && hasCredentials && (
                    <button
                      onClick={handleReconnect}
                      className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                    >
                      <span>Reconnect to Google Calendar</span>
                    </button>
                  )}
                </div>
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <CalendarHeader />
      
      {/* Auth Success/Error Messages */}
      {authMessage && (
        <div className={`mx-6 mt-4 p-4 rounded-lg flex items-center space-x-2 ${
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
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <CalendarSidebar />
        
        {/* Main Calendar Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {renderCalendarView()}
        </div>
      </div>

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