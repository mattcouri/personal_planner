// Google OAuth 2.0 Authentication Service

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

class GoogleAuthService {
  private config: AuthConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = {
      clientId: this.getClientId(),
      clientSecret: this.getClientSecret(),
      redirectUri: `${window.location.origin}/auth/callback`,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    };
  }

  private getClientId(): string {
    return localStorage.getItem('google_client_id') || 
           process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  }

  private getClientSecret(): string {
    return localStorage.getItem('google_client_secret') || 
           process.env.REACT_APP_GOOGLE_CLIENT_SECRET || '';
  }

  // Update credentials dynamically
  updateCredentials(clientId: string, clientSecret: string): void {
    this.config.clientId = clientId;
    this.config.clientSecret = clientSecret;
  }

  // Initialize the service (can be called multiple times safely)
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Update config with current credentials
    this.config.clientId = this.getClientId();
    this.config.clientSecret = this.getClientSecret();
    
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured. Please run the setup wizard first.');
    }
    
    this.initialized = true;
  }

  // Generate OAuth URL
  getAuthUrl(): string {
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured');
    }
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<AuthTokens> {
    try {
      await this.initialize();
      
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(): Promise<AuthTokens> {
    await this.initialize();
    
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      // Preserve refresh token if not returned
      if (!tokens.refresh_token) {
        tokens.refresh_token = refreshToken;
      }
      
      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(): Promise<string> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      throw new Error('No tokens available');
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = tokens.expires_at || 0;
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (now >= (expiresAt - bufferTime)) {
      const refreshedTokens = await this.refreshAccessToken();
      return refreshedTokens.access_token;
    }

    return tokens.access_token;
  }

  // Store tokens in localStorage
  private storeTokens(tokens: AuthTokens): void {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const tokenData = {
      ...tokens,
      expires_at: expiresAt
    };
    localStorage.setItem('google_auth_tokens', JSON.stringify(tokenData));
  }

  // Get stored tokens
  private getStoredTokens(): (AuthTokens & { expires_at: number }) | null {
    const stored = localStorage.getItem('google_auth_tokens');
    return stored ? JSON.parse(stored) : null;
  }

  // Get stored refresh token
  private getStoredRefreshToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.refresh_token || null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    const hasCredentials = this.getClientId() && this.getClientSecret();
    return !!tokens?.access_token && !!hasCredentials;
  }

  // Sign out
  signOut(): void {
    localStorage.removeItem('google_auth_tokens');
    // Don't remove credentials - keep them for reconnection
    // localStorage.removeItem('google_client_id');
    // localStorage.removeItem('google_client_secret');
  }

  // Get user info
  async getUserInfo(): Promise<any> {
    try {
      await this.initialize();
      const accessToken = await this.getValidAccessToken();
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  // Check if credentials are configured
  hasCredentials(): boolean {
    return !!(this.getClientId() && this.getClientSecret());
  }

  // Get stored credentials status
  getCredentialsStatus(): { hasCredentials: boolean; hasTokens: boolean } {
    return {
      hasCredentials: this.hasCredentials(),
      hasTokens: !!this.getStoredTokens()?.access_token
    };
  }
}

export const googleAuthService = new GoogleAuthService();