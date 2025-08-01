import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = '7f9b0d52c40944878346f258892e14d3';
const SPOTIFY_REDIRECT_URI = 'http://localhost:8081/auth';

// Spotify API endpoints
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// Scopes for the app
const SPOTIFY_SCOPES = [
  'user-library-read',
  'user-library-modify', 
  'user-read-private',
  'user-read-email',
  'playlist-read-private'
].join(' ');

export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export class SpotifyAuthService {
  private static instance: SpotifyAuthService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  static getInstance(): SpotifyAuthService {
    if (!SpotifyAuthService.instance) {
      SpotifyAuthService.instance = new SpotifyAuthService();
    }
    return SpotifyAuthService.instance;
  }

  async authenticate(): Promise<SpotifyAuthResponse | null> {
    try {
      console.log('Redirect URI:', SPOTIFY_REDIRECT_URI);
      
      // Generate PKCE code verifier
      const generateCodeVerifier = () => {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode(...array))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      };

      const codeVerifier = generateCodeVerifier();
      
      // Generate PKCE challenge
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      ).then(hash => 
        hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      );

      // Create auth request
      const authUrl = new URL(SPOTIFY_AUTH_ENDPOINT);
      authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
      authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('code_challenge', codeChallenge);

      // Start auth session using WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        SPOTIFY_REDIRECT_URI
      );

      if (result.type === 'success' && result.url) {
        // Extract code from URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Exchange code for tokens
          const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);
        
          if (tokenResponse) {
            this.accessToken = tokenResponse.access_token;
            this.refreshToken = tokenResponse.refresh_token || null;
            this.tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000);
            
            return tokenResponse;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return null;
    }
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<SpotifyAuthResponse | null> {
    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          code_verifier: codeVerifier,
        }).toString(),
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Token exchange failed:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }).toString(),
      });

      if (response.ok) {
        const tokenData = await response.json();
        this.accessToken = tokenData.access_token;
        this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        return this.accessToken;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return null;
  }

  getAccessToken(): string | null {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  async getUserDetails(): Promise<any | null> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch user details:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }
}

export const spotifyAuth = SpotifyAuthService.getInstance(); 