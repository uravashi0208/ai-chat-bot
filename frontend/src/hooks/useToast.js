// src/hooks/useToast.js
// This file is deprecated. Please use the ToastContext from '../context/ToastContext' instead.
// Example: import { useToast } from '../context/ToastContext';

import { useToast as useModernToast } from '../context/ToastContext';

// Legacy compatibility wrapper - use ToastContext directly for new code
export const useToast = () => {
  const { success, error, warning, info, showToast, removeToast, removeAllToasts } = useModernToast();
  
  // Legacy format compatibility
  const legacyShowToast = (messageOrOptions, options = {}) => {
    if (typeof messageOrOptions === 'string') {
      return showToast(messageOrOptions, options);
    } else {
      // Handle legacy object format: { message, severity, duration }
      const { message, severity = 'success', duration } = messageOrOptions;
      const modernOptions = { autoHideDuration: duration, ...options };
      
      switch (severity) {
        case 'success':
          return success(message, modernOptions);
        case 'error':
          return error(message, modernOptions);
        case 'warning':
          return warning(message, modernOptions);
        case 'info':
          return info(message, modernOptions);
        default:
          return showToast(message, modernOptions);
      }
    }
  };

  return { 
    toast: { isOpen: false }, // Legacy compatibility
    showToast: legacyShowToast,
    hideToast: removeAllToasts,
    // Modern methods
    success,
    error,
    warning,
    info
  };
};