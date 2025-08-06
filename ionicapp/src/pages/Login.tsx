import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonCheckbox,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/react';
import { 
  personOutline, 
  lockClosedOutline, 
  mailOutline,
  eyeOutline,
  eyeOffOutline,
  chatbubbleEllipsesOutline
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const Login: React.FC = () => {
  const { user, login, register, loading, error, clearError } = useAuth();
  const { error: showError, success } = useToast();
  
  // Form state
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in, redirect to chat
  if (user) {
    return <Redirect to="/chat" />;
  }

  // Clear error when switching modes
  useEffect(() => {
    clearError();
  }, [isLogin, clearError]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Basic validation
    if (!formData.email.trim() || !formData.password.trim()) {
      showError('Please fill in all required fields');
      return;
    }
    
    if (!isLogin) {
      if (!formData.username.trim()) {
        showError('Please enter a username');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        showError('Passwords do not match');
        return;
      }
      
      if (formData.password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password, rememberMe);
      } else {
        await register(formData.username, formData.email, formData.password);
      }
    } catch (err) {
      // Error handling is done in AuthContext
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="gradient-background">
          <IonTitle color="light">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={chatbubbleEllipsesOutline} />
              Chat App
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="gradient-background">
        <IonGrid style={{ height: '100%' }}>
          <IonRow className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
            <IonCol size="12" sizeMd="8" sizeLg="6" sizeXl="4">
              <IonCard className="glass-effect" style={{ margin: '20px' }}>
                <IonCardContent>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <IonIcon 
                      icon={chatbubbleEllipsesOutline} 
                      style={{ 
                        fontSize: '3rem', 
                        color: 'var(--ion-color-primary)',
                        marginBottom: '1rem'
                      }} 
                    />
                    <h2 style={{ margin: '0', color: 'white' }}>
                      {isLogin ? 'Welcome Back' : 'Join Chat App'}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0.5rem 0 0 0' }}>
                      {isLogin ? 'Sign in to continue chatting' : 'Create your account to get started'}
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    {/* Username field (register only) */}
                    {!isLogin && (
                      <IonItem className="glass-effect" style={{ marginBottom: '1rem' }}>
                        <IonIcon icon={personOutline} slot="start" color="light" />
                        <IonLabel position="stacked" color="light">Username</IonLabel>
                        <IonInput
                          type="text"
                          value={formData.username}
                          onIonInput={(e) => handleInputChange('username', e.detail.value!)}
                          placeholder="Enter your username"
                          clearInput
                          required={!isLogin}
                        />
                      </IonItem>
                    )}

                    {/* Email field */}
                    <IonItem className="glass-effect" style={{ marginBottom: '1rem' }}>
                      <IonIcon icon={mailOutline} slot="start" color="light" />
                      <IonLabel position="stacked" color="light">Email</IonLabel>
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                        placeholder="Enter your email"
                        clearInput
                        required
                      />
                    </IonItem>

                    {/* Password field */}
                    <IonItem className="glass-effect" style={{ marginBottom: '1rem' }}>
                      <IonIcon icon={lockClosedOutline} slot="start" color="light" />
                      <IonLabel position="stacked" color="light">Password</IonLabel>
                      <IonInput
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                        placeholder="Enter your password"
                        required
                      />
                      <IonIcon
                        icon={showPassword ? eyeOffOutline : eyeOutline}
                        slot="end"
                        color="light"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: 'pointer' }}
                      />
                    </IonItem>

                    {/* Confirm password field (register only) */}
                    {!isLogin && (
                      <IonItem className="glass-effect" style={{ marginBottom: '1rem' }}>
                        <IonIcon icon={lockClosedOutline} slot="start" color="light" />
                        <IonLabel position="stacked" color="light">Confirm Password</IonLabel>
                        <IonInput
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
                          placeholder="Confirm your password"
                          required={!isLogin}
                        />
                        <IonIcon
                          icon={showConfirmPassword ? eyeOffOutline : eyeOutline}
                          slot="end"
                          color="light"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ cursor: 'pointer' }}
                        />
                      </IonItem>
                    )}

                    {/* Remember me (login only) */}
                    {isLogin && (
                      <IonItem className="glass-effect" style={{ marginBottom: '1.5rem' }}>
                        <IonCheckbox
                          checked={rememberMe}
                          onIonChange={(e) => setRememberMe(e.detail.checked)}
                          slot="start"
                        />
                        <IonLabel color="light">Remember me</IonLabel>
                      </IonItem>
                    )}

                    {/* Submit button */}
                    <IonButton
                      expand="block"
                      type="submit"
                      disabled={isSubmitting || loading}
                      style={{ 
                        '--background': 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))',
                        '--border-radius': '12px',
                        height: '48px',
                        fontWeight: 'bold',
                        marginBottom: '1rem'
                      }}
                    >
                      {(isSubmitting || loading) ? (
                        <>
                          <IonSpinner name="crescent" />
                          <span style={{ marginLeft: '8px' }}>
                            {isLogin ? 'Signing in...' : 'Creating account...'}
                          </span>
                        </>
                      ) : (
                        isLogin ? 'Sign In' : 'Create Account'
                      )}
                    </IonButton>

                    {/* Error display */}
                    {error && (
                      <IonText color="danger" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>
                        <p>{error}</p>
                      </IonText>
                    )}

                    {/* Switch mode button */}
                    <div style={{ textAlign: 'center' }}>
                      <IonText color="light">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                      </IonText>
                      <IonButton
                        fill="clear"
                        color="primary"
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ textDecoration: 'underline' }}
                      >
                        {isLogin ? 'Sign up' : 'Sign in'}
                      </IonButton>
                    </div>
                  </form>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;