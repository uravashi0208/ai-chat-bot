import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Card, 
  Typography, 
  Container,
  useTheme,
  alpha,
  Fade
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon,
  ChatBubbleOutline as ChatIcon 
} from '@mui/icons-material';
import AuthRegister from './auth/AuthRegister';

const Register2 = () => {
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
          top: '15%',
          left: '8%',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.12),
          animation: 'float 7s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '12%',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.1),
          animation: 'float 9s ease-in-out infinite reverse'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.14),
          animation: 'float 11s ease-in-out infinite'
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
                  background: alpha(theme.palette.secondary.main, 0.2),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                }}
              >
                <PersonAddIcon sx={{ fontSize: 32, color: 'white' }} />
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

            <AuthRegister
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
                    Join ChatApp
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ 
                      color: alpha(theme.palette.common.white, 0.8),
                      fontSize: '0.95rem'
                    }}
                  >
                    Create your account to start chatting
                  </Typography>
                </Box>
              }
              subtitle={
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: alpha(theme.palette.common.white, 0.7) }}
                  >
                    Already have an account?{' '}
                    <Typography
                      component={Link}
                      to="/"
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
                      Sign in here
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

export default Register2;
