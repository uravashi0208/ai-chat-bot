import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  TextField,
  useTheme,
  alpha,
  InputAdornment
} from '@mui/material';
import { Stack } from '@mui/system';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

const AuthRegister = ({ title, subtitle, subtext }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { success, error, warning, info } = useToast();
  const { register } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long and contain both letters and numbers';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear field error when user modifies it
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validate()) {
      warning('⚠️ Please fix the validation errors before submitting', {
        autoHideDuration: 4000
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Show loading toast
      info('🔄 Creating your account...', {
        autoHideDuration: 0 // Keep showing until success or error
      });

      // API call or logic goes here
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Show success toast
      success('🎉 Registration successful! Welcome to ChatApp! Redirecting...', {
        autoHideDuration: 3000
      });

      // Redirect after toast closes
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2500);
    } catch (err) {
      // Show error toast with specific error messages
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      
      if (errorMessage.toLowerCase().includes('email')) {
        error('📧 This email is already registered. Please use a different email or try logging in.', {
          autoHideDuration: 6000
        });
      } else if (errorMessage.toLowerCase().includes('username')) {
        error('👤 This username is already taken. Please choose a different username.', {
          autoHideDuration: 6000
        });
      } else {
        error(`❌ ${errorMessage}`, {
          autoHideDuration: 5000
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Registration Form */}
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>
        {title && (
          <Typography variant="h2" component="h1" gutterBottom align="center">
            {title}
          </Typography>
        )}
        
        {subtext}

        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            {/* Username field */}
            <Box>
              <Typography 
                variant="subtitle2" 
                fontWeight={600} 
                gutterBottom
                sx={{ color: alpha(theme.palette.common.white, 0.9) }}
              >
                Username
              </Typography>
              <TextField
                name="username"
                type="text"
                fullWidth
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                error={Boolean(errors.username)}
                helperText={errors.username}
                placeholder="Enter your username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: alpha(theme.palette.common.white, 0.7) }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.8),
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: alpha(theme.palette.common.white, 0.6),
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    color: alpha(theme.palette.error.main, 0.8),
                    backgroundColor: alpha(theme.palette.common.black, 0.2),
                    borderRadius: '4px',
                    px: 1,
                    mt: 0.5,
                  },
                }}
              />
            </Box>

            {/* Email field */}
            <Box>
              <Typography 
                variant="subtitle2" 
                fontWeight={600} 
                gutterBottom
                sx={{ color: alpha(theme.palette.common.white, 0.9) }}
              >
                Email Address
              </Typography>
              <TextField
                name="email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                error={Boolean(errors.email)}
                helperText={errors.email}
                placeholder="Enter your email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: alpha(theme.palette.common.white, 0.7) }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.8),
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: alpha(theme.palette.common.white, 0.6),
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    color: alpha(theme.palette.error.main, 0.8),
                    backgroundColor: alpha(theme.palette.common.black, 0.2),
                    borderRadius: '4px',
                    px: 1,
                    mt: 0.5,
                  },
                }}
              />
            </Box>

            {/* Password field */}
            <Box>
              <Typography 
                variant="subtitle2" 
                fontWeight={600} 
                gutterBottom
                sx={{ color: alpha(theme.palette.common.white, 0.9) }}
              >
                Password
              </Typography>
              <TextField
                name="password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                error={Boolean(errors.password)}
                helperText={errors.password}
                placeholder="Create a strong password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: alpha(theme.palette.common.white, 0.7) }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ 
                          minWidth: 'auto', 
                          p: 0.5,
                          color: alpha(theme.palette.common.white, 0.7),
                          '&:hover': {
                            color: alpha(theme.palette.common.white, 0.9),
                            background: 'transparent'
                          }
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.8),
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: alpha(theme.palette.common.white, 0.6),
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    color: alpha(theme.palette.error.main, 0.8),
                    backgroundColor: alpha(theme.palette.common.black, 0.2),
                    borderRadius: '4px',
                    px: 1,
                    mt: 0.5,
                  },
                }}
              />
            </Box>

            {/* Confirm Password field */}
            <Box>
              <Typography 
                variant="subtitle2" 
                fontWeight={600} 
                gutterBottom
                sx={{ color: alpha(theme.palette.common.white, 0.9) }}
              >
                Confirm Password
              </Typography>
              <TextField
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword}
                placeholder="Re-enter your password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockResetIcon sx={{ color: alpha(theme.palette.common.white, 0.7) }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        sx={{ 
                          minWidth: 'auto', 
                          p: 0.5,
                          color: alpha(theme.palette.common.white, 0.7),
                          '&:hover': {
                            color: alpha(theme.palette.common.white, 0.9),
                            background: 'transparent'
                          }
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: alpha(theme.palette.common.white, 0.8),
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: alpha(theme.palette.common.white, 0.6),
                    opacity: 1,
                  },
                  '& .MuiFormHelperText-root': {
                    color: alpha(theme.palette.error.main, 0.8),
                    backgroundColor: alpha(theme.palette.common.black, 0.2),
                    borderRadius: '4px',
                    px: 1,
                    mt: 0.5,
                  },
                }}
              />
            </Box>

            {/* Submit button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ 
                mt: 3,
                py: 1.5,
                borderRadius: '12px',
                background: alpha(theme.palette.common.white, 0.2),
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 600,
                border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`,
                '&:hover': {
                  background: alpha(theme.palette.common.white, 0.25),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.common.black, 0.15)}`,
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  background: alpha(theme.palette.common.white, 0.1),
                  color: alpha(theme.palette.common.white, 0.5),
                },
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Stack>
        </form>

        {subtitle}
      </Box>
    </>
  );
};

export default AuthRegister;