import React, { useState } from 'react';
import { 
  Calendar, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Settings,
  Globe,
  Shield
} from 'lucide-react';

interface GoogleCalendarWizardProps {
  onComplete: (credentials: { clientId: string; clientSecret: string }) => void;
  onClose: () => void;
}

const GoogleCalendarWizard: React.FC<GoogleCalendarWizardProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: ''
  });
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const totalSteps = 4;
  const currentDomain = window.location.origin;
  const redirectUri = `${currentDomain}/auth/callback`;

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (credentials.clientId && credentials.clientSecret) {
      onComplete(credentials);
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
      case 2:
      case 3:
        return currentStep > step;
      case 4:
        return credentials.clientId && credentials.clientSecret;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
            currentStep === step
              ? 'bg-primary-500 border-primary-500 text-white'
              : isStepComplete(step)
              ? 'bg-green-500 border-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500'
          }`}>
            {isStepComplete(step) ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="text-sm font-medium">{step}</span>
            )}
          </div>
          {step < totalSteps && (
            <div className={`w-12 h-0.5 mx-2 transition-all duration-200 ${
              isStepComplete(step) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Calendar className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Connect Google Calendar
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
        We'll guide you through setting up Google Calendar integration. This will allow you to sync your events, create meetings, and manage tasks directly from this app.
      </p>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-left">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Your data stays secure
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              We use Google's official OAuth 2.0 authentication. Your credentials are never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>View and manage your calendar events</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Create meetings with Google Meet integration</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Sync tasks and to-dos</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Set up appointment booking pages</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Create Google Cloud Project
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          First, we need to set up a project in Google Cloud Console
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Step 2.1: Open Google Cloud Console</h4>
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 text-sm"
            >
              <span>Open Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Click the link above to open Google Cloud Console in a new tab.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Step 2.2: Create New Project</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">1</span>
              <span>Click "Select a project" dropdown at the top</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">2</span>
              <span>Click "New Project"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">3</span>
              <span>Enter a project name (e.g., "Daily Organizer Calendar")</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">4</span>
              <span>Click "Create"</span>
            </li>
          </ol>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">Important</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                Make sure to select your new project before proceeding to the next step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Enable APIs & Create Credentials
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Enable the required APIs and set up OAuth credentials
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Step 3.1: Enable APIs</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">1</span>
              <span>Go to "APIs & Services" → "Library"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">2</span>
              <span>Search for and enable "Google Calendar API"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">3</span>
              <span>Search for and enable "Google Tasks API"</span>
            </li>
          </ol>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Step 3.2: Create OAuth Credentials</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">1</span>
              <span>Go to "APIs & Services" → "Credentials"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">2</span>
              <span>Click "Create Credentials" → "OAuth client ID"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">3</span>
              <span>Choose "Web application"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">4</span>
              <span>Add this redirect URI:</span>
            </li>
          </ol>
          
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
                {redirectUri}
              </code>
              <button
                onClick={() => copyToClipboard(redirectUri, 'redirect-uri')}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Copy redirect URI"
              >
                {copiedItems.has('redirect-uri') ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">Next Step</p>
              <p className="text-blue-700 dark:text-blue-300">
                After creating the OAuth client, copy the Client ID and Client Secret. You'll need them in the next step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Enter Your Credentials
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Copy your Client ID and Client Secret from Google Cloud Console
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client ID
          </label>
          <input
            type="text"
            value={credentials.clientId}
            onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
            placeholder="Enter your Google OAuth Client ID"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Client Secret
          </label>
          <input
            type="password"
            value={credentials.clientSecret}
            onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
            placeholder="Enter your Google OAuth Client Secret"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-green-800 dark:text-green-200 font-medium mb-1">Almost Done!</p>
              <p className="text-green-700 dark:text-green-300">
                Once you enter your credentials, you'll be able to connect to Google Calendar and start syncing your data.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Where to find your credentials:</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>1. In Google Cloud Console, go to "APIs & Services" → "Credentials"</li>
            <li>2. Find your OAuth 2.0 Client ID in the list</li>
            <li>3. Click on it to view the Client ID and Client Secret</li>
            <li>4. Copy and paste them into the fields above</li>
          </ol>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Google Calendar Setup
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepIndicator()}
          
          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!credentials.clientId || !credentials.clientSecret}
              className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Setup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarWizard;