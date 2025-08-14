// src/utils/tokenUtils.js
/**
 * Utility functions for JWT token management
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration time
    if (!payload.exp) return true;
    
    // Compare with current time (convert to seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < currentTime;
    
    // Log for debugging
    if (isExpired) {
      console.log('🕐 Token expired at:', new Date(payload.exp * 1000).toLocaleString());
    }
    
    return isExpired;
  } catch (error) {
    return true; // If token is malformed, consider it expired
  }
};

/**
 * Get token expiration time in milliseconds
 * @param {string} token - JWT token
 * @returns {number|null} - Expiration timestamp in milliseconds, null if invalid
 */
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get time until token expires
 * @param {string} token - JWT token
 * @returns {number} - Time in milliseconds until expiration, 0 if expired
 */
export const getTimeUntilExpiration = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  
  const timeLeft = expiration - Date.now();
  return Math.max(0, timeLeft);
};

/**
 * Check if token will expire soon
 * @param {string} token - JWT token
 * @param {number} thresholdMinutes - Minutes before expiration to consider "soon"
 * @returns {boolean} - True if token expires within threshold
 */
export const isTokenExpiringSoon = (token, thresholdMinutes = 5) => {
  const timeLeft = getTimeUntilExpiration(token);
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return timeLeft > 0 && timeLeft <= thresholdMs;
};

/**
 * Format time until expiration in human-readable format
 * @param {string} token - JWT token
 * @returns {string} - Formatted time string
 */
export const formatTimeUntilExpiration = (token) => {
  const timeLeft = getTimeUntilExpiration(token);
  
  if (timeLeft <= 0) return 'Expired';
  
  const minutes = Math.floor(timeLeft / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  return 'Less than a minute';
};

/**
 * Get token payload safely
 * @param {string} token - JWT token
 * @returns {object|null} - Token payload or null if invalid
 */
export const getTokenPayload = (token) => {
  if (!token) return null;
  
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
};

/**
 * Validate token format without checking expiration
 * @param {string} token - JWT token
 * @returns {boolean} - True if token format is valid
 */
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Try to decode each part
    atob(parts[0]); // header
    atob(parts[1]); // payload
    // signature is not base64url decoded as it's binary
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('rememberToken');
  localStorage.removeItem('refreshToken');
};

/**
 * Get user info from token
 * @param {string} token - JWT token
 * @returns {object|null} - User information from token payload
 */
export const getUserFromToken = (token) => {
  const payload = getTokenPayload(token);
  if (!payload) return null;
  
  // Extract common user fields from JWT payload
  return {
    id: payload.sub || payload.userId || payload.id,
    username: payload.username || payload.name,
    email: payload.email,
    role: payload.role,
    iat: payload.iat,
    exp: payload.exp
  };
};