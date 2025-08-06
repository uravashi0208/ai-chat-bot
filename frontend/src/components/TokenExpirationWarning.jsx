// src/components/TokenExpirationWarning.jsx
import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Typography,
  LinearProgress,
  Box
} from '@mui/material';
import { AccessTime, Refresh } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getTimeUntilExpiration, formatTimeUntilExpiration, isTokenExpiringSoon } from '../utils/tokenUtils';

const TokenExpirationWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progressValue, setProgressValue] = useState(100);
  const { refreshToken, logout } = useAuth();

  useEffect(() => {
    const checkTokenStatus = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const timeUntilExpiration = getTimeUntilExpiration(token);
      setTimeLeft(timeUntilExpiration);

      // Show warning if token expires within 5 minutes
      if (isTokenExpiringSoon(token, 5)) {
        setShowWarning(true);
        
        // Calculate progress (0-100%)
        const fiveMinutesMs = 5 * 60 * 1000;
        const progress = Math.max(0, (timeUntilExpiration / fiveMinutesMs) * 100);
        setProgressValue(progress);
      } else {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkTokenStatus();

    // Check every 30 seconds
    const interval = setInterval(checkTokenStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    try {
      await refreshToken();
      setShowWarning(false);
      setProgressValue(100);
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(245, 124, 0, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
          boxShadow: `
            0 20px 60px rgba(255, 152, 0, 0.3),
            0 0 40px rgba(255, 152, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #ff9800, transparent)',
            animation: 'shimmer 2s ease-in-out infinite'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(245, 124, 0, 0.6) 100%)',
        color: 'white',
        py: 3,
        textAlign: 'center',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
        }
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          animation: 'iconPulse 2s ease-in-out infinite'
        }}>
          <AccessTime sx={{ fontSize: 24 }} />
        </Box>
        
        <Typography variant="h5" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          Session Expiring Soon
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ 
        pt: 4, 
        pb: 2,
        background: 'rgba(0, 0, 0, 0.02)',
        position: 'relative'
      }}>
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 3,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            boxShadow: '0 4px 16px rgba(255, 193, 7, 0.15)',
            '& .MuiAlert-icon': {
              fontSize: '24px'
            },
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 600
            }
          }}
        >
          Your session will expire in {formatTimeUntilExpiration(localStorage.getItem('token'))}.
        </Alert>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 3,
            color: 'white',
            textAlign: 'center',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          To continue using the application, please refresh your session or you will be automatically logged out.
        </Typography>

        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1,
              color: 'white',
              fontWeight: 600,
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Time remaining: {formatTimeUntilExpiration(localStorage.getItem('token'))}
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={progressValue}
            sx={{ 
              height: 12, 
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                background: progressValue > 50 
                  ? 'linear-gradient(90deg, #4caf50, #8bc34a)' 
                  : progressValue > 20 
                  ? 'linear-gradient(90deg, #ff9800, #ffc107)'
                  : 'linear-gradient(90deg, #f44336, #e57373)',
                borderRadius: 6,
                boxShadow: `0 0 8px ${
                  progressValue > 50 ? 'rgba(76, 175, 80, 0.5)' 
                  : progressValue > 20 ? 'rgba(255, 152, 0, 0.5)'
                  : 'rgba(244, 67, 54, 0.5)'
                }`,
                transition: 'all 0.3s ease'
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        gap: 2,
        background: 'rgba(255, 255, 255, 0.02)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Button 
          onClick={handleLogout} 
          variant="outlined"
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'white',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'rgba(244, 67, 54, 0.5)',
              background: 'rgba(244, 67, 54, 0.1)',
              color: '#f44336'
            }
          }}
        >
          Logout Now
        </Button>
        
        <Button 
          onClick={handleRefresh}
          variant="contained"
          startIcon={<Refresh />}
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
            boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
            fontWeight: 700,
            fontSize: '0.95rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #45a049 0%, #7cb342 100%)',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          Refresh Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenExpirationWarning;