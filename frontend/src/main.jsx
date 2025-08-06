import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';

// Debug boundary component
const DebugBoundary = ({ children }) => {
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DebugBoundary>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <DebugBoundary>
                <App />
              </DebugBoundary>
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </DebugBoundary>
  </React.StrictMode>
);