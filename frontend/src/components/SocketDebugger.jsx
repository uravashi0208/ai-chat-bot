import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, TextField, Card, CardContent } from '@mui/material';

const SocketDebugger = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (!socket) return;

    const logEvent = (eventName, data) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [...prev.slice(-9), { timestamp, event: eventName, data }]);
    };

    const events = ['connect', 'disconnect', 'connect_error', 'receive_message', 'message_sent'];
    
    events.forEach(eventName => {
      socket.on(eventName, (data) => logEvent(eventName, data));
    });

    socket.onAny((eventName, ...args) => {
      logEvent(`ANY: ${eventName}`, args);
    });

    return () => {
      events.forEach(eventName => socket.off(eventName));
      socket.offAny();
    };
  }, [socket]);

  const sendTestMessage = () => {
    if (socket && testMessage) {
      socket.emit('send_message', {
        receiverId: user.id, // Send to self for testing
        content: testMessage,
        tempId: Date.now()
      });
      setTestMessage('');
    }
  };

  if (!user) return null;

  return (
    <Card sx={{ m: 2, maxWidth: 400 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Socket Debugger
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          Status: {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          User: {user.username} (ID: {user.id})
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Test message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Button 
            variant="contained" 
            size="small" 
            onClick={sendTestMessage}
            disabled={!socket?.connected || !testMessage}
          >
            Send Test Message
          </Button>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Recent Events:
        </Typography>
        
        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
          {events.map((event, index) => (
            <Typography key={index} variant="caption" display="block" sx={{ fontSize: '10px', mb: 0.5 }}>
              <strong>{event.timestamp}</strong> - {event.event}: {JSON.stringify(event.data).slice(0, 50)}...
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SocketDebugger;