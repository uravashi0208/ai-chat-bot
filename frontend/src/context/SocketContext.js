import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('No user or user token, skipping socket connection');
      setSocket(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping socket connection');
      setSocket(null);
      return;
    }

    console.log('🔌 Connecting socket for user:', user.username, 'with ID:', user.id);
    console.log('🔗 Connecting to:', import.meta.env.VITE_API_URL || 'http://localhost:5000');

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      timeout: 20000,
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully:', newSocket.id);
      console.log('📡 Connected user:', user.username, 'ID:', user.id);
      console.log('🌐 Socket transport:', newSocket.io.engine.transport.name);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      console.error('🔍 Error details:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        console.log('🔄 Reconnecting due to server disconnect...');
        newSocket.connect();
      }
    });

    // Enhanced debugging for all socket events
    newSocket.onAny((event, ...args) => {
      console.log('🔔 Socket event received:', event, args);
    });

    // Test connection immediately
    newSocket.on('connect', () => {
      console.log('🧪 Testing socket connection with ping...');
      newSocket.emit('ping', 'test', (response) => {
        console.log('🏓 Socket ping response:', response);
      });
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, [user?.id, user?.username]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);