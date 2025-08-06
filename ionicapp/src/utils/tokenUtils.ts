import jwtDecode from 'jwt-decode';

interface TokenPayload {
  userId: string;
  username: string;
  email?: string;
  exp: number;
  iat: number;
}

import type { User } from '../types/user';

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Check if a JWT token will expire soon (within specified minutes)
 */
export const isTokenExpiringSoon = (token: string, minutesThreshold: number = 15): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    const thresholdTime = currentTime + (minutesThreshold * 60);
    return decoded.exp < thresholdTime;
  } catch (error) {
    console.error('Error decoding token for expiration check:', error);
    return true;
  }
};

/**
 * Get user data from JWT token
 */
export const getUserFromToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return {
      id: decoded.userId,
      username: decoded.username,
      email: decoded.email
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Get time until token expiration in minutes
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000;
    const timeUntilExp = decoded.exp - currentTime;
    return Math.max(0, Math.floor(timeUntilExp / 60)); // Return minutes
  } catch (error) {
    console.error('Error calculating time until expiration:', error);
    return null;
  }
};

/**
 * Format time until expiration as human-readable string
 */
export const formatTimeUntilExpiration = (token: string): string => {
  const minutes = getTimeUntilExpiration(token);
  if (minutes === null) return 'Unknown';
  
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 1 && remainingMinutes === 0) return '1 hour';
  if (remainingMinutes === 0) return `${hours} hours`;
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  const keysToRemove = [
    'token',
    'refreshToken',
    'rememberToken',
    'rememberMe',
    'user'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also clear any session storage items
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  console.log('🧹 Authentication data cleared');
};

/**
 * Store token securely with optional remember me functionality
 */
export const storeToken = (token: string, rememberMe: boolean = false): void => {
  localStorage.setItem('token', token);
  
  if (rememberMe) {
    localStorage.setItem('rememberToken', token);
    localStorage.setItem('rememberMe', 'true');
  } else {
    localStorage.removeItem('rememberToken');
    localStorage.removeItem('rememberMe');
  }
  
  console.log('🔐 Token stored securely');
};

/**
 * Get stored token with fallback to remembered token
 */
export const getStoredToken = (): string | null => {
  const token = localStorage.getItem('token');
  
  if (token && !isTokenExpired(token)) {
    return token;
  }
  
  // Try remembered token
  const rememberedToken = localStorage.getItem('rememberToken');
  if (rememberedToken && !isTokenExpired(rememberedToken)) {
    localStorage.setItem('token', rememberedToken);
    return rememberedToken;
  }
  
  return null;
};

/**
 * Check if user has remember me enabled
 */
export const hasRememberMe = (): boolean => {
  return localStorage.getItem('rememberMe') === 'true';
};