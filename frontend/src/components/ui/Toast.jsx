import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Fade,
  Slide,
  useTheme,
  alpha
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Toast = ({ 
  isOpen, 
  message, 
  severity = 'success', 
  onClose,
  autoHideDuration = 4000,
  position = 'top-right',
  stackIndex = 0,
  totalToasts = 1
}) => {
  const theme = useTheme();

  const getSeverityColors = () => {
    switch (severity) {
      case 'success':
        return {
          primary: '#4caf50',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(139, 195, 74, 0.1) 100%)',
          border: alpha('#4caf50', 0.3),
          shadow: alpha('#4caf50', 0.2),
          glow: '0 0 20px rgba(76, 175, 80, 0.3)'
        };
      case 'error':
        return {
          primary: '#f44336',
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(229, 57, 53, 0.1) 100%)',
          border: alpha('#f44336', 0.3),
          shadow: alpha('#f44336', 0.2),
          glow: '0 0 20px rgba(244, 67, 54, 0.3)'
        };
      case 'warning':
        return {
          primary: '#ff9800',
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%)',
          border: alpha('#ff9800', 0.3),
          shadow: alpha('#ff9800', 0.2),
          glow: '0 0 20px rgba(255, 152, 0, 0.3)'
        };
      case 'info':
        return {
          primary: '#2196f3',
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(3, 169, 244, 0.1) 100%)',
          border: alpha('#2196f3', 0.3),
          shadow: alpha('#2196f3', 0.2),
          glow: '0 0 20px rgba(33, 150, 243, 0.3)'
        };
      default:
        return {
          primary: '#2196f3',
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(3, 169, 244, 0.1) 100%)',
          border: alpha('#2196f3', 0.3),
          shadow: alpha('#2196f3', 0.2),
          glow: '0 0 20px rgba(33, 150, 243, 0.3)'
        };
    }
  };

  const colors = getSeverityColors();

  const getIcon = () => {
    const iconProps = { 
      sx: { 
        fontSize: 22, 
        color: colors.primary,
        filter: `drop-shadow(0 0 4px ${alpha(colors.primary, 0.3)})`,
        animation: stackIndex === 0 ? 'iconPulse 2s ease-in-out infinite' : 'none'
      } 
    };
    
    switch (severity) {
      case 'success':
        return <SuccessIcon {...iconProps} />;
      case 'error':
        return <ErrorIcon {...iconProps} />;
      case 'warning':
        return <WarningIcon {...iconProps} />;
      case 'info':
        return <InfoIcon {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  // Calculate stacking transforms for multiple toasts
  const getStackTransforms = () => {
    const baseOffset = stackIndex * 8; // Slight offset for stacking
    const scaleReduction = Math.max(0.95, 1 - (stackIndex * 0.05)); // Slight scale reduction
    const opacity = Math.max(0.8, 1 - (stackIndex * 0.1)); // Slight opacity reduction
    
    return {
      transform: `translateY(${baseOffset}px) scale(${scaleReduction})`,
      opacity,
      zIndex: 10000 - stackIndex // Higher stack index = lower z-index
    };
  };

  // Auto hide functionality
  React.useEffect(() => {
    if (isOpen && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoHideDuration, onClose]);

  return (
    <Fade in={isOpen} timeout={{ enter: 400, exit: 300 }}>
      <Slide 
        direction={position.includes('right') ? 'left' : position.includes('left') ? 'right' : 'down'} 
        in={isOpen} 
        timeout={{ enter: 400, exit: 300 }}
      >
        <Box
          sx={{
            position: 'relative',
            minWidth: 320,
            maxWidth: 450,
            background: colors.background,
            backdropFilter: 'blur(25px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '20px',
            boxShadow: `
              0 12px 40px ${colors.shadow},
              ${colors.glow},
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2.5,
            color: 'white',
            overflow: 'hidden',
            pointerEvents: 'auto', // Allow interactions with this toast
            cursor: 'default',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: stackIndex === 0 ? 'toastEntrance 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            ...getStackTransforms(),
            '&:hover': {
              transform: `${getStackTransforms().transform} translateY(-4px)`,
              boxShadow: `
                0 16px 48px ${colors.shadow},
                ${colors.glow},
                inset 0 1px 0 rgba(255, 255, 255, 0.15)
              `,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
              animation: stackIndex === 0 ? 'shimmer 3s ease-in-out infinite' : 'none',
              borderRadius: '20px 20px 0 0'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '5px',
              height: '100%',
              background: `linear-gradient(180deg, ${colors.primary}, ${alpha(colors.primary, 0.7)})`,
              borderRadius: '20px 0 0 20px',
              boxShadow: `2px 0 8px ${alpha(colors.primary, 0.3)}`
            }
          }}
        >
          {/* Icon */}
          <Box sx={{ 
            flexShrink: 0, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '12px',
            background: `radial-gradient(circle, ${alpha(colors.primary, 0.2)} 0%, transparent 70%)`,
            border: `1px solid ${alpha(colors.primary, 0.2)}`
          }}>
            {getIcon()}
          </Box>

          {/* Message */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                wordBreak: 'break-word',
                lineHeight: 1.4,
                mb: message.length > 50 ? 0.5 : 0
              }}
            >
              {message}
            </Typography>
            
            {message.length > 50 && (
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.palette.common.white, 0.8),
                  fontSize: '0.75rem',
                  display: 'block'
                }}
              >
                Click to dismiss
              </Typography>
            )}
          </Box>

          {/* Close button */}
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: alpha(theme.palette.common.white, 0.7),
                padding: 1,
                borderRadius: '10px',
                background: alpha(theme.palette.common.white, 0.05),
                border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                '&:hover': {
                  color: 'white',
                  backgroundColor: alpha(theme.palette.common.white, 0.15),
                  transform: 'scale(1.1)',
                  boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}

          {/* Progress bar for auto-hide */}
          {autoHideDuration > 0 && stackIndex === 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 5,
                right: 5,
                height: '4px',
                background: `linear-gradient(90deg, ${colors.primary}, ${alpha(colors.primary, 0.7)})`,
                borderRadius: '0 0 15px 15px',
                animation: `shrink ${autoHideDuration}ms linear`,
                transformOrigin: 'left',
                boxShadow: `0 0 8px ${alpha(colors.primary, 0.5)}`
              }}
            />
          )}
        </Box>
      </Slide>
    </Fade>
  );
};

export default Toast;

// Add enhanced CSS keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { 
      transform: translateX(-100%);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% { 
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes shrink {
    from { 
      transform: scaleX(1);
      opacity: 0.8;
    }
    to { 
      transform: scaleX(0);
      opacity: 0.4;
    }
  }
  
  @keyframes toastEntrance {
    0% {
      transform: translateY(-20px) scale(0.95);
      opacity: 0;
    }
    50% {
      transform: translateY(2px) scale(1.02);
      opacity: 0.8;
    }
    100% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
`;
document.head.appendChild(style);