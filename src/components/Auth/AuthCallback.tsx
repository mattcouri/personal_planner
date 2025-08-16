import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '../../services/googleAuth';
import { Loader2 } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/calendar?auth=error');
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          navigate('/calendar?auth=error');
          return;
        }

        // Exchange code for tokens
        await googleAuthService.exchangeCodeForTokens(code);
        
        // Redirect to calendar with success
        navigate('/calendar?auth=success');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/calendar?auth=error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Completing Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while we connect your Google Calendar...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;