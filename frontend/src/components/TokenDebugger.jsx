// src/components/TokenDebugger.jsx
// This is a development-only component for testing token expiration
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { 
  BugReport, 
  Token, 
  Schedule,
  Refresh,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { 
  getTokenPayload, 
  formatTimeUntilExpiration, 
  isTokenExpired,
  isTokenExpiringSoon,
  clearAuthData 
} from '../utils/tokenUtils';

// Only show in development
const isDevelopment = import.meta.env.MODE === 'development';

const TokenDebugger = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const { handleTokenExpiration, checkTokenExpiration } = useAuth();

  const refreshTokenInfo = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = getTokenPayload(token);
      setTokenInfo({
        payload,
        expired: isTokenExpired(token),
        expiringSoon: isTokenExpiringSoon(token, 5),
        timeLeft: formatTimeUntilExpiration(token)
      });
    } else {
      setTokenInfo(null);
    }
  };

  useEffect(() => {
    refreshTokenInfo();
    const interval = setInterval(refreshTokenInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  // Create an expired token for testing
  const createExpiredToken = () => {
    const expiredPayload = {
      sub: "test-user",
      username: "test",
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200  // Issued 2 hours ago
    };
    
    // Create a fake JWT (this won't work with backend, but tests frontend logic)
    const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
    const payload = btoa(JSON.stringify(expiredPayload));
    const signature = "fake_signature";
    
    const fakeExpiredToken = `${header}.${payload}.${signature}`;
    localStorage.setItem('token', fakeExpiredToken);
    refreshTokenInfo();
  };

  // Create a token that expires soon for testing
  const createExpiringSoonToken = () => {
    const expiringSoonPayload = {
      sub: "test-user", 
      username: "test",
      exp: Math.floor(Date.now() / 1000) + 120, // Expires in 2 minutes
      iat: Math.floor(Date.now() / 1000) - 3600  // Issued 1 hour ago
    };
    
    const header = btoa(JSON.stringify({ typ: "JWT", alg: "HS256" }));
    const payload = btoa(JSON.stringify(expiringSoonPayload));
    const signature = "fake_signature";
    
    const fakeExpiringSoonToken = `${header}.${payload}.${signature}`;
    localStorage.setItem('token', fakeExpiringSoonToken);
    refreshTokenInfo();
  };

  if (!isDevelopment || !tokenInfo) {
    return null;
  }

  return (
    <Paper 
      sx={{ 
        position: 'fixed',
        top: 10,
        right: 10,
        p: 2,
        zIndex: 9999,
        minWidth: 300,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReport fontSize="small" />
        Token Debugger
      </Typography>
      
      <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
      
      <Stack spacing={1}>
        <Box>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Token fontSize="small" />
            Status:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip 
              label={tokenInfo.expired ? "Expired" : "Valid"}
              color={tokenInfo.expired ? "error" : "success"}
              size="small"
            />
            {tokenInfo.expiringSoon && (
              <Chip 
                label="Expires Soon"
                color="warning"
                size="small"
              />
            )}
          </Stack>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule fontSize="small" />
            Time Left: {tokenInfo.timeLeft}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
            User: {tokenInfo.payload?.username || 'Unknown'}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

        <Stack spacing={1}>
          <Button 
            size="small" 
            onClick={refreshTokenInfo}
            startIcon={<Refresh />}
          >
            Refresh Info
          </Button>
          
          <Button 
            size="small" 
            color="warning"
            onClick={createExpiringSoonToken}
          >
            Test Expiring Soon
          </Button>
          
          <Button 
            size="small" 
            color="error"
            onClick={createExpiredToken}
          >
            Test Expired Token
          </Button>
          
          <Button 
            size="small" 
            onClick={handleTokenExpiration}
            startIcon={<Delete />}
          >
            Trigger Expiration
          </Button>
          
          <Button 
            size="small" 
            onClick={checkTokenExpiration}
          >
            Check Expiration
          </Button>
          
          <Button 
            size="small" 
            color="secondary"
            onClick={() => {
              clearAuthData();
              refreshTokenInfo();
            }}
          >
            Clear All Tokens
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default TokenDebugger;