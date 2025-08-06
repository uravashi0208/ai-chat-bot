import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Button,
    Stack,
    Checkbox,
    TextField,
    useTheme,
    alpha,
    InputAdornment
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

// API configuration

const AuthLogin = ({ title = 'Login', subtitle, subtext }) => {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { success, error: showError, info } = useToast();
    const navigate = useNavigate();

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            if (!formData.email || !formData.password) {
            throw new Error('Please fill in all fields');
            }

            const response = await login({
            email: formData.email,
            password: formData.password
            });

            if (rememberMe && response.data.token) {
            localStorage.setItem('rememberToken', response.data.token);
            }
            
            success('🎉 Login successful! Redirecting to dashboard...', { 
                autoHideDuration: 2000 
            });

            // Small delay to show the success toast before navigation
            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.message ||
                                err.message ||
                                'Login failed. Please try again.';
            
            if (err.response?.status === 401) {
                showError('🔒 Invalid email or password. Please check your credentials.', { 
                    autoHideDuration: 5000 
                });
            } else {
                showError(`❌ ${errorMessage}`, { 
                    autoHideDuration: 5000 
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                {title && (
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        {title}
                    </Typography>
                )}

                {subtext}

                <form onSubmit={handleSubmit} noValidate>
                    <Stack spacing={2}>
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
                                variant="outlined"
                                fullWidth
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
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
                                }}
                            />
                        </Box>

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
                                variant="outlined"
                                fullWidth
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                                placeholder="Enter your password"
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
                                }}
                            />
                        </Box>

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            sx={{
                                                color: alpha(theme.palette.common.white, 0.7),
                                                '&.Mui-checked': {
                                                    color: 'white',
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography sx={{ color: alpha(theme.palette.common.white, 0.8), fontSize: '0.9rem' }}>
                                            Remember me
                                        </Typography>
                                    }
                                />
                            </FormGroup>
                            <Typography
                                component={Link}
                                to="/forgot-password"
                                sx={{ 
                                    textDecoration: 'none',
                                    color: alpha(theme.palette.common.white, 0.8),
                                    fontSize: '0.9rem',
                                    '&:hover': {
                                        color: 'white',
                                        textShadow: '0 0 5px rgba(255,255,255,0.5)'
                                    }
                                }}
                            >
                                Forgot password?
                            </Typography>
                        </Stack>

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
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </Stack>
                </form>

                {subtitle && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        {subtitle}
                    </Box>
                )}
            </Box>
    );
};

export default AuthLogin;