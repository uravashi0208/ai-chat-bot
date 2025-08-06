import React, { createContext, useContext, ReactNode } from 'react';
import { useIonToast } from '@ionic/react';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  color?: 'success' | 'warning' | 'danger' | 'primary';
  icon?: string;
}

interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [present] = useIonToast();

  const showToast = (message: string, options: ToastOptions = {}) => {
    const {
      duration = 3000,
      position = 'top',
      color = 'primary',
      icon
    } = options;

    present({
      message,
      duration,
      position,
      color,
      icon,
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ],
      cssClass: 'custom-toast',
      animated: true,
      swipeGesture: 'vertical'
    });
  };

  const success = (message: string, options: ToastOptions = {}) => {
    showToast(message, {
      ...options,
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
  };

  const error = (message: string, options: ToastOptions = {}) => {
    showToast(message, {
      ...options,
      color: 'danger',
      icon: 'close-circle-outline',
      duration: options.duration || 4000
    });
  };

  const warning = (message: string, options: ToastOptions = {}) => {
    showToast(message, {
      ...options,
      color: 'warning',
      icon: 'warning-outline'
    });
  };

  const info = (message: string, options: ToastOptions = {}) => {
    showToast(message, {
      ...options,
      color: 'primary',
      icon: 'information-circle-outline'
    });
  };

  const value: ToastContextType = {
    success,
    error,
    warning,
    info,
    showToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};