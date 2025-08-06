import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('No user or user token, skipping socket connection');
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping socket connection');
      setSocket(null);
      setIsConnected(false);
      setConnectionError('No authentication token');
      return;
    }

    console.log('🔌 Connecting socket for user:', user.username, 'with ID:', user.id);
    
    // Use environment variable or default to localhost for development
    const serverUrl = import.meta.env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('🔗 Connecting to:', serverUrl);

    const newSocket = io(serverUrl, {
      auth: {
        token: token
      },
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully:', newSocket.id);
      console.log('📡 Connected user:', user.username, 'ID:', user.id);
      console.log('🌐 Socket transport:', newSocket.io.engine.transport.name);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('🔍 Error details:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        console.log('🔄 Reconnecting due to server disconnect...');
        newSocket.connect();
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
      setConnectionError(`Reconnecting... (attempt ${attemptNumber})`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message);
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after maximum attempts');
      setConnectionError('Connection failed after maximum attempts');
      setIsConnected(false);
    });

    // Authentication error handling
    newSocket.on('auth_error', (error) => {
      console.error('🔒 Socket authentication error:', error);
      setConnectionError('Authentication failed');
      setIsConnected(false);
      
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    });

    // Set socket in state
    setSocket(newSocket);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.removeAllListeners();
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
    };
  }, [user?.id]); // Only depend on user.id to avoid unnecessary reconnections

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};