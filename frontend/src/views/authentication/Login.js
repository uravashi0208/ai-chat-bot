import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Card, 
  Stack, 
  Typography, 
  Container,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import { 
  ChatBubbleOutline as ChatIcon,
  Login as LoginIcon 
} from '@mui/icons-material';
import AuthLogin from './auth/AuthLogin';

const Login2 = () => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.1),
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.15),
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '20%',
          width: '25px',
          height: '25px',
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.08),
          animation: 'float 10s ease-in-out infinite'
        }}
      />

      <Container 
        maxWidth="sm" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4
        }}
      >
        <Fade in={true} timeout={800}>
          <Card
            elevation={0}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 450,
              background: alpha(theme.palette.background.paper, 0.15),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderRadius: '24px',
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 3s ease-in-out infinite'
              }
            }}
          >
            {/* Logo/Brand Section */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 3,
                gap: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: alpha(theme.palette.primary.main, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <ChatIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                ChatApp
              </Typography>
            </Box>

            <AuthLogin
              subtext={
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{ 
                      color: 'white', 
                      fontWeight: 600, 
                      mb: 1,
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.8),
                      fontSize: '0.95rem'
                    }}
                  >
                    Sign in to continue to your conversations
                  </Typography>
                </Box>
              }
              subtitle={
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.palette.common.white, 0.7) }}
                  >
                    Don't have an account?{' '}
                    <Typography
                      component={Link}
                      to="/register"
                      sx={{
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 600,
                        position: 'relative',
                        '&:hover': {
                          textShadow: '0 0 10px rgba(255,255,255,0.5)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: '0%',
                          height: '2px',
                          bottom: -2,
                          left: 0,
                          background: 'white',
                          transition: 'width 0.3s ease'
                        },
                        '&:hover::after': {
                          width: '100%'
                        }
                      }}
                    >
                      Create one here
                    </Typography>
                  </Typography>
                </Box>
              }
            />
          </Card>
        </Fade>
      </Container>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Box>
  );
};

export default Login2;
