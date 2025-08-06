// src/components/ToastTester.jsx
// Development component to test toast notifications
import React from 'react';
import { 
  Box, 
  Button, 
  Stack, 
  Typography,
  Paper 
} from '@mui/material';
import { 
  CheckCircle,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useToast } from '../context/ToastContext';

// Only show in development
const isDevelopment = import.meta.env.MODE === 'development';

const ToastTester = () => {
  const { success, error, warning, info } = useToast();

  const testMessages = {
    success: [
      '✅ Login successful! Welcome back.',
      '🎉 Profile updated successfully.',
      '💾 Data saved successfully.',
      '🚀 Message sent!'
    ],
    error: [
      '❌ Login failed. Please check your credentials.',
      '🔒 Your session has expired. Please login again.',
      '🚫 Access denied. Please check your permissions.',
      '💥 Network error. Please try again.'
    ],
    warning: [
      '⏰ Your session will expire soon. Please save any work.',
      '⚠️ File size is too large. Maximum 10MB allowed.',
      '🔄 Connection unstable. Some features may not work properly.',
      '📱 This feature is not available on mobile devices.'
    ],
    info: [
      '🔄 Restoring your session...',
      '📥 New message received from John.',
      '🔔 You have 3 unread notifications.',
      '💡 Tip: Use Ctrl+S to save your work.'
    ]
  };

  const getRandomMessage = (type) => {
    const messages = testMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!isDevelopment) {
    return null;
  }

  return (
    <Paper 
      sx={{ 
        position: 'fixed',
        bottom: 20,
        left: 20,
        p: 2,
        zIndex: 9998,
        minWidth: 280,
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        🧪 Toast Tester
      </Typography>
      
      <Stack spacing={1.5}>
        <Button
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={() => success(getRandomMessage('success'), { position: 'top-center' })}
          sx={{
            background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
            '&:hover': { background: 'linear-gradient(135deg, #45a049, #7cb342)' }
          }}
        >
          Success Toast
        </Button>
        
        <Button
          variant="contained"
          startIcon={<ErrorIcon />}
          onClick={() => error(getRandomMessage('error'), { position: 'top-center' })}
          sx={{
            background: 'linear-gradient(135deg, #f44336, #e57373)',
            '&:hover': { background: 'linear-gradient(135deg, #d32f2f, #c62828)' }
          }}
        >
          Error Toast
        </Button>
        
        <Button
          variant="contained"
          startIcon={<WarningIcon />}
          onClick={() => warning(getRandomMessage('warning'), { position: 'top-center' })}
          sx={{
            background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
            '&:hover': { background: 'linear-gradient(135deg, #f57c00, #fb8c00)' }
          }}
        >
          Warning Toast
        </Button>
        
        <Button
          variant="contained"
          startIcon={<InfoIcon />}
          onClick={() => info(getRandomMessage('info'), { position: 'top-center' })}
          sx={{
            background: 'linear-gradient(135deg, #2196f3, #64b5f6)',
            '&:hover': { background: 'linear-gradient(135deg, #1976d2, #1565c0)' }
          }}
        >
          Info Toast
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => {
            success('🎯 Multiple toasts test!', { position: 'top-right' });
            setTimeout(() => error('⚡ Second toast!', { position: 'top-right' }), 500);
            setTimeout(() => warning('🔥 Third toast!', { position: 'top-right' }), 1000);
          }}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'white',
            '&:hover': { borderColor: 'white', background: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          Multiple Toasts
        </Button>

        <Typography variant="caption" sx={{ textAlign: 'center', opacity: 0.7, mt: 1 }}>
          Development Mode Only
        </Typography>
      </Stack>
    </Paper>
  );
};

export default ToastTester;