import React, { useState, useEffect } from 'react';
import { googleAuthService } from '../../services/googleAuth';
import { LogIn, LogOut, User } from 'lucide-react';

const AuthButton: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = googleAuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const user = await googleAuthService.getUserInfo();
        setUserInfo(user);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await googleAuthService.initialize();
      const authUrl = googleAuthService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    googleAuthService.signOut();
    setIsAuthenticated(false);
    setUserInfo(null);
    window.location.reload();
  };

  if (isAuthenticated && userInfo) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {userInfo.picture ? (
            <img
              src={userInfo.picture}
              alt={userInfo.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {userInfo.name}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      <LogIn className="w-4 h-4" />
      <span>{isLoading ? 'Connecting...' : 'Connect Google Calendar'}</span>
    </button>
  );
};

export default AuthButton;