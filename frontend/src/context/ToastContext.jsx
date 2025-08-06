import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

// Helper function to get container position styles
const getContainerPositionStyles = (position) => {
  switch (position) {
    case 'top-right':
      return { top: '24px', right: '24px' };
    case 'top-left':
      return { top: '24px', left: '24px' };
    case 'top-center':
      return { top: '24px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-left':
      return { bottom: '24px', left: '24px' };
    case 'bottom-center':
      return { bottom: '24px', left: '50%', transform: 'translateX(-50%)' };
    case 'bottom-right':
    default:
      return { bottom: '24px', right: '24px' };
  }
};

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      severity: options.severity || 'success',
      autoHideDuration: options.autoHideDuration || 4000,
      position: options.position || 'top-right',
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration if specified
    if (toast.autoHideDuration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.autoHideDuration + 500); // Add 500ms for animation
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods for different types
  const success = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'success' });
  }, [showToast]);

  const error = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'error' });
  }, [showToast]);

  const warning = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'warning' });
  }, [showToast]);

  const info = useCallback((message, options = {}) => {
    return showToast(message, { ...options, severity: 'info' });
  }, [showToast]);

  const value = {
    showToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Render toast containers by position */}
      {Object.entries(
        toasts.reduce((groups, toast) => {
          const position = toast.position || 'top-right';
          if (!groups[position]) groups[position] = [];
          groups[position].push(toast);
          return groups;
        }, {})
      ).map(([position, positionToasts]) => (
        <div 
          key={position}
          style={{
            position: 'fixed',
            ...getContainerPositionStyles(position),
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none' // Allow clicks to pass through container
          }}
        >
          {positionToasts.map((toast, index) => (
            <Toast
              key={toast.id}
              isOpen={true}
              message={toast.message}
              severity={toast.severity}
              position={position}
              autoHideDuration={0} // Handled by context
              onClose={() => removeToast(toast.id)}
              stackIndex={index}
              totalToasts={positionToasts.length}
            />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};