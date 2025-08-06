import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { getUsers, getMessages, sendMessage, markMessagesAsRead } from '../../../api/chat';
import { 
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  Paper,
  InputBase,
  Button,
  Popover,
  Menu,
  MenuItem,
  Chip,
  Fade,
  Slide,
  Grow,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Logout as LogoutIcon,
  InsertEmoticon as EmoticonIcon,
  ChatBubbleOutline as ChatIcon,
  CheckCircle as CheckCircleIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
  Circle as CircleIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const ChatPage = () => {
  const theme = useTheme();
  
  // Context hooks
  const { user, logout } = useAuth();
  const socket = useSocket();
  const { success, error, info, warning } = useToast();
  
  // State management
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Enhanced utility functions
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 55%)`;
  };

  const getGradientForUser = (str) => {
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const hue1 = Math.abs(hash % 360);
    const hue2 = Math.abs((hash + 60) % 360);
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 70%))`;
  };

  const formatGroupHeader = useCallback((dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d');
  }, []);

  const formatMessageTime = useCallback((dateString) => {
    return format(parseISO(dateString), 'h:mm a');
  }, []);

  const formatLastSeen = useCallback((lastSeen) => {
    if (!lastSeen) return 'recently';
    const date = parseISO(lastSeen);
    return isToday(date) 
      ? `today at ${format(date, 'h:mm a')}`
      : format(date, 'MMM d, yyyy');
  }, []);

  // Helper function to format message preview
  const formatMessagePreview = useCallback((message, currentUserId) => {
    if (!message || !message.content) return 'Media message';
    
    const content = message.content.trim();
    if (!content) return 'Media message';
    
    const maxLength = 30;
    const preview = content.length > maxLength 
      ? `${content.substring(0, maxLength)}...` 
      : content;
    
    // Add "You: " prefix for messages sent by current user
    const prefix = message.sender_id === currentUserId ? 'You: ' : '';
    
    return `${prefix}${preview}`;
  }, []);

  // Data fetching
  const fetchUsers = useCallback(async () => {
    try {
      const usersList = await getUsers();
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      error('Failed to load users. Please refresh the page.', {
        autoHideDuration: 4000
      });
    }
  }, [error]);

  // Fetch recent messages for conversation previews (optimized)
  const fetchConversationPreviews = useCallback(async () => {
    if (users.length === 0) return;
    
    try {
      console.log('📨 Fetching conversation previews...');
      
      // Limit concurrent requests to avoid overwhelming the server
      const maxConcurrent = 3;
      const usersToFetch = users.slice(0, 10); // Limit to first 10 users for performance
      
      for (let i = 0; i < usersToFetch.length; i += maxConcurrent) {
        const batch = usersToFetch.slice(i, i + maxConcurrent);
        
        const promises = batch.map(async (userItem) => {
          try {
            // Fetch only recent messages (API might support limiting)
            const userMessages = await getMessages(userItem.id);
            return userMessages.slice(-5); // Keep only last 5 messages per conversation
          } catch (err) {
            console.warn(`Failed to fetch messages for user ${userItem.username}:`, err);
            return [];
          }
        });
        
        const batchResults = await Promise.allSettled(promises);
        const batchMessages = batchResults
          .filter(result => result.status === 'fulfilled')
          .flatMap(result => result.value);
        
        if (batchMessages.length > 0) {
          setMessages(prevMessages => {
            const messageMap = new Map();
            
            // Add existing messages
            prevMessages.forEach(msg => messageMap.set(msg.id, msg));
            
            // Add new batch messages
            batchMessages.forEach(msg => messageMap.set(msg.id, msg));
            
            return Array.from(messageMap.values()).sort((a, b) => 
              new Date(a.sent_at) - new Date(b.sent_at)
            );
          });
        }
        
        // Add a small delay between batches to prevent rate limiting
        if (i + maxConcurrent < usersToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log('✅ Conversation previews loaded');
    } catch (err) {
      console.error("Error fetching conversation previews:", err);
    }
  }, [users]);

  const fetchMessages = useCallback(async () => {
    if (!selectedUser) return;
    
    try {
      const chatMessages = await getMessages(selectedUser.id);
      setMessages(chatMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      error(`Failed to load messages with ${selectedUser.username}`, {
        autoHideDuration: 4000
      });
    }
  }, [selectedUser, error]);

  // Effects
  useEffect(() => { 
    fetchUsers(); 
  }, [fetchUsers]);
  
  useEffect(() => { 
    fetchMessages(); 
  }, [fetchMessages]);

  // Fetch conversation previews when users list changes
  useEffect(() => {
    if (users.length > 0) {
      // Debounce the preview fetching to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        fetchConversationPreviews();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [users.length, fetchConversationPreviews]); // Include dependency but limit to user count

  // WebSocket connection status tracking
  useEffect(() => {
    if (!socket) {
      setConnectionStatus('disconnected');
      return;
    }

    const updateConnectionStatus = () => {
      if (socket.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('connecting');
      }
    };

    socket.on('connect', () => {
      setConnectionStatus('connected');
      console.log('🔗 Socket connected');
      success('✨ Connected to chat server!', { autoHideDuration: 2000 });
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('🔌 Socket disconnected');
      warning('⚡ Connection lost. Trying to reconnect...', { autoHideDuration: 3000 });
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
      console.log('❌ Socket connection error');
      error('❌ Connection failed. Please check your internet connection.', { autoHideDuration: 4000 });
    });

    updateConnectionStatus();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket, success, warning, error]);

  // WebSocket handling
  useEffect(() => {
    if (!socket || !user?.id) {
      console.log('⚠️ Socket or user not available for message handling');
      return;
    }

    const handleNewMessage = (message) => {
      console.log('📩 Received message from socket:', message);
      console.log('👤 Current user ID:', user.id);
      console.log('💬 Current selected user:', selectedUser?.id);
      console.log('📤 Message sender:', message.sender_id);
      console.log('📥 Message receiver:', message.receiver_id);
      
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log('⚠️ Duplicate message prevented:', message.id);
          return prev;
        }
        
        // IMPORTANT: Store ALL messages that involve the current user
        // We'll filter them in the UI, but we need to keep all messages
        const isForCurrentUser = (
          message.sender_id === user.id || message.receiver_id === user.id
        );
        
        if (isForCurrentUser) {
          console.log('✅ Message is for current user, adding to messages');
          const newMessages = [...prev, message].sort((a, b) => 
            new Date(a.sent_at) - new Date(b.sent_at)
          );
          
          // If this message is for the currently selected conversation, ensure UI updates
          const isForCurrentConversation = selectedUser && (
            (message.sender_id === selectedUser.id && message.receiver_id === user.id) ||
            (message.sender_id === user.id && message.receiver_id === selectedUser.id)
          );
          
          if (isForCurrentConversation) {
            console.log('🎯 Message is for current conversation - UI will update');
          }
          
          return newMessages;
        }
        
        console.log('⏭️ Message not for current user, ignoring');
        return prev;
      });
      
      // Force scroll to bottom for new messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    console.log('🔗 Setting up socket listeners for user:', user.id);
    socket.on('receive_message', handleNewMessage);
    
    // Add connection status listeners
    socket.on('connect', () => {
      console.log('🟢 Socket connected in ChatPage');
      setConnectionStatus('connected');
    });
    
    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected in ChatPage');
      setConnectionStatus('disconnected');
    });
    
    socket.on('connect_error', () => {
      console.log('❌ Socket connection error in ChatPage');
      setConnectionStatus('error');
    });
    
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('receive_message', handleNewMessage);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket, user?.id]); // Removed selectedUser?.id from dependencies

  // Auto-scroll and typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing simulation
  useEffect(() => {
    let typingTimer;
    if (inputValue.length > 0) {
      setIsTyping(true);
      typingTimer = setTimeout(() => setIsTyping(false), 1000);
    } else {
      setIsTyping(false);
    }
    return () => clearTimeout(typingTimer);
  }, [inputValue]);

  // Event handlers
  const handleEmojiClick = useCallback((emojiData) => {
    setInputValue(prev => prev + emojiData.emoji);
    setEmojiAnchorEl(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !selectedUser || !user?.id) return;

    const currentInput = inputValue;
    const tempId = Date.now();
    
    console.log('📤 Sending message:', currentInput, 'to user:', selectedUser.id);

    const tempMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: currentInput,
      sent_at: new Date().toISOString(),
      sending: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');

    try {
      if (socket && socket.connected) {
        console.log('🔌 Using socket connection');
        socket.emit('send_message', {
          receiverId: selectedUser.id,
          content: currentInput,
          tempId
        }, (response) => {
          console.log('📨 Socket response:', response);
          if (response?.success) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === tempId ? { ...response.message, sending: false } : msg
              )
            );
            console.log('✅ Message sent via socket successfully');
          } else {
            console.error('❌ Socket send failed:', response?.error);
            fallbackToAPI(currentInput);
          }
        });
      } else {
        console.log('🌐 Socket not available, using HTTP API');
        fallbackToAPI(currentInput);
      }
    } catch (err) {
      console.error("❌ Error in handleSend:", err);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setInputValue(currentInput);
      error('Failed to send message. Please try again.', {
        autoHideDuration: 3000
      });
    }

    async function fallbackToAPI(messageContent) {
      try {
        console.log('🔄 Falling back to HTTP API');
        const newMessage = await sendMessage({
          receiverId: selectedUser.id,
          content: messageContent
        });
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId ? { ...newMessage, sending: false } : msg
          )
        );
        console.log('✅ Message sent via HTTP API successfully');
      } catch (apiError) {
        console.error("❌ HTTP API fallback failed:", apiError);
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setInputValue(messageContent);
        error('Message delivery failed. Please check your connection and try again.', {
          autoHideDuration: 4000
        });
      }
    }
  }, [inputValue, selectedUser, socket, user?.id, error]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEmojiOpen = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  // Memoized data
  const filteredUsers = useMemo(() => 
    users.filter(userItem => 
      userItem.username.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [users, searchTerm]
  );

  const lastMessagesMap = useMemo(() => {
    if (!user?.id) return {};
    
    const map = {};
    users.forEach(userItem => {
      // Find messages in the conversation between current user and this userItem
      const conversationMessages = messages.filter(
        msg => (
          (msg.sender_id === user.id && msg.receiver_id === userItem.id) ||
          (msg.sender_id === userItem.id && msg.receiver_id === user.id)
        )
      );
      
      if (conversationMessages.length > 0) {
        // Get the most recent message in this conversation
        map[userItem.id] = [...conversationMessages].sort((a, b) => 
          new Date(b.sent_at) - new Date(a.sent_at)
        )[0];
      }
    });
    return map;
  }, [users, messages, user?.id]);

  // Early return if user is not available (during logout)
  if (!user?.id) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* Left Sidebar with Glass Effect */}
      <Box sx={{ 
        width: 380, 
        display: 'flex', 
        flexDirection: 'column',
        background: alpha(theme.palette.background.paper, 0.15),
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        position: 'relative'
      }}>
        {/* Header */}
        <Box sx={{ 
          p: 2.5, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: alpha(theme.palette.background.paper, 0.1),
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: getGradientForUser(user.username),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: '50%',
                  background: getGradientForUser(user.username),
                  filter: 'blur(4px)',
                  zIndex: -1,
                  opacity: 0.6
                }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}>
                {user.username}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircleIcon sx={{ 
                  fontSize: 8, 
                  color: connectionStatus === 'connected' ? '#4ade80' : 
                         connectionStatus === 'connecting' ? '#fbbf24' : '#ef4444'
                }} />
                <Typography variant="caption" sx={{ 
                  color: alpha(theme.palette.common.white, 0.8),
                  textTransform: 'capitalize'
                }}>
                  {connectionStatus}
                </Typography>
              </Box>
            </Box>
          </Box>
          <IconButton 
            onClick={handleMenuOpen}
            sx={{ 
              color: 'white',
              '&:hover': {
                background: alpha(theme.palette.common.white, 0.1)
              }
            }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
              }
            }}
          >
            <MenuItem onClick={() => { logout(); handleMenuClose(); }}>
              <LogoutIcon sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2.5, pt: 2 }}>
          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: alpha(theme.palette.common.white, 0.7), mr: 1 }} />,
              sx: {
                background: alpha(theme.palette.background.paper, 0.1),
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: `2px solid ${alpha(theme.palette.common.white, 0.4)}`
                },
                '& input::placeholder': {
                  color: alpha(theme.palette.common.white, 0.6)
                }
              }
            }}
            variant="outlined"
            size="small"
          />
        </Box>

        {/* User List */}
        <Box sx={{ flex: 1, overflow: 'hidden', px: 1 }}>
          <List 
            className="glass-scrollbar-thin"
            sx={{ 
              height: '100%', 
              overflow: 'auto'
            }}>
          {filteredUsers.map((userItem) => {
            const lastMessage = lastMessagesMap[userItem.id];
            const isSelected = selectedUser?.id === userItem.id;
            
            return (
              <Fade in={true} timeout={300} key={userItem.id}>
                <Box>
                  <ListItem 
                    button 
                    selected={isSelected}
                    onClick={() => setSelectedUser(userItem)}
                    sx={{
                      borderRadius: 2.5,
                      mb: 1,
                      background: isSelected 
                        ? alpha(theme.palette.common.white, 0.15)
                        : 'transparent',
                      backdropFilter: isSelected ? 'blur(10px)' : 'none',
                      border: isSelected 
                        ? `1px solid ${alpha(theme.palette.common.white, 0.2)}`
                        : '1px solid transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(theme.palette.common.white, 0.1),
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          userItem.online && (
                            <Box sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: '#4ade80',
                              border: '2px solid white',
                              boxShadow: '0 0 0 1px rgba(74, 222, 128, 0.4)'
                            }} />
                          )
                        }
                      >
                        <Box
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            background: getGradientForUser(userItem.username),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.2)'
                          }}
                        >
                          <Typography 
                            sx={{ 
                              color: 'white', 
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}
                          >
                            {userItem.username.charAt(0).toUpperCase()}
                          </Typography>
                        </Box>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: isSelected ? 600 : 500,
                            color: 'white',
                            mb: 0.5
                          }}
                        >
                          {userItem.username}
                        </Typography>
                      }
                      secondary={
                        lastMessage ? (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: alpha(theme.palette.common.white, 0.75),
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px',
                              fontSize: '0.875rem'
                            }}
                          >
                            {formatMessagePreview(lastMessage, user?.id)}
                          </Typography>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: alpha(theme.palette.common.white, 0.5),
                              fontStyle: 'italic',
                              fontSize: '0.875rem'
                            }}
                          >
                            Click to start chatting
                          </Typography>
                        )
                      }
                    />
                    {lastMessage && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: alpha(theme.palette.common.white, 0.6),
                            fontSize: '0.75rem'
                          }}
                        >
                          {formatMessageTime(lastMessage.sent_at)}
                        </Typography>
                        {userItem.unreadCount > 0 && (
                          <Chip 
                            label={userItem.unreadCount} 
                            size="small" 
                            sx={{ 
                              background: '#4ade80',
                              color: 'white',
                              minWidth: 20, 
                              height: 20,
                              mt: 0.5,
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </ListItem>
                </Box>
              </Fade>
            );
          })}
          </List>
        </Box>
      </Box>

      {/* Right Chat Area */}
      {selectedUser ? (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: alpha(theme.palette.background.default, 0.05)
        }}>
          {/* Chat Header */}
          <Box sx={{ 
            p: 2.5, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: alpha(theme.palette.background.paper, 0.1),
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: getGradientForUser(selectedUser.username),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2.5,
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}
                >
                  {selectedUser.username.charAt(0).toUpperCase()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}>
                  {selectedUser.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircleIcon sx={{ 
                    fontSize: 8, 
                    color: selectedUser.online ? '#4ade80' : alpha(theme.palette.common.white, 0.5)
                  }} />
                  <Typography variant="caption" sx={{ 
                    color: alpha(theme.palette.common.white, 0.8)
                  }}>
                    {selectedUser.online ? 'Online' : `Last seen ${formatLastSeen(selectedUser.lastSeen)}`}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ 
                color: 'white',
                '&:hover': { background: alpha(theme.palette.common.white, 0.1) }
              }}>
                <PhoneIcon />
              </IconButton>
              <IconButton sx={{ 
                color: 'white',
                '&:hover': { background: alpha(theme.palette.common.white, 0.1) }
              }}>
                <VideoCallIcon />
              </IconButton>
              <IconButton sx={{ 
                color: 'white',
                '&:hover': { background: alpha(theme.palette.common.white, 0.1) }
              }}>
                <InfoIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Messages Container */}
          <Box 
            ref={messagesContainerRef}
            className="glass-scrollbar"
            sx={{ 
              flex: 1, 
              p: 2.5, 
              overflow: 'auto',
              background: alpha(theme.palette.background.default, 0.02),
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `radial-gradient(circle at 20% 30%, ${alpha('#667eea', 0.1)} 0%, transparent 50%),
                                 radial-gradient(circle at 80% 70%, ${alpha('#764ba2', 0.1)} 0%, transparent 50%)`,
                pointerEvents: 'none'
              }
            }}
          >
            {messages
              .filter(message => selectedUser && (
                (message.sender_id === selectedUser.id && message.receiver_id === user?.id) ||
                (message.sender_id === user?.id && message.receiver_id === selectedUser.id)
              ))
              .map((message, index, filteredMessages) => {
              const showDateHeader = index === 0 || 
                formatGroupHeader(filteredMessages[index-1].sent_at) !== formatGroupHeader(message.sent_at);
              const isSent = message.sender_id === user?.id;

              return (
                <Fade in={true} timeout={500} key={message.id}>
                  <Box>
                    {showDateHeader && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        my: 3
                      }}>
                        <Chip 
                          label={formatGroupHeader(message.sent_at)}
                          size="small"
                          sx={{
                            background: alpha(theme.palette.background.paper, 0.2),
                            backdropFilter: 'blur(10px)',
                            color: alpha(theme.palette.common.white, 0.9),
                            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    )}

                    <Slide 
                      direction={isSent ? "left" : "right"} 
                      in={true} 
                      timeout={300}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: isSent ? 'flex-end' : 'flex-start',
                          mb: 2.5,
                          position: 'relative'
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            maxWidth: '75%',
                            minWidth: '100px',
                            background: isSent 
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : alpha(theme.palette.background.paper, 0.15),
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            color: isSent ? 'white' : 'white',
                            borderRadius: isSent 
                              ? '24px 24px 8px 24px' 
                              : '24px 24px 24px 8px',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`
                            },
                            '&::before': isSent ? {
                              content: '""',
                              position: 'absolute',
                              top: -1,
                              left: -1,
                              right: -1,
                              bottom: -1,
                              borderRadius: '24px 24px 8px 24px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              filter: 'blur(8px)',
                              zIndex: -1,
                              opacity: 0.3
                            } : {}
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              mb: 1,
                              lineHeight: 1.5,
                              wordBreak: 'break-word'
                            }}
                          >
                            {message.content}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: isSent 
                                  ? alpha(theme.palette.common.white, 0.8)
                                  : alpha(theme.palette.common.white, 0.7),
                                fontSize: '0.7rem'
                              }}
                            >
                              {formatMessageTime(message.sent_at)}
                            </Typography>
                            {isSent && (
                              message.sending ? (
                                <Box sx={{ 
                                  width: 14, 
                                  height: 14, 
                                  border: '2px solid rgba(255, 255, 255, 0.3)',
                                  borderTop: '2px solid rgba(255, 255, 255, 0.8)',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                  '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' }
                                  }
                                }} />
                              ) : (
                                <CheckCircleIcon 
                                  sx={{ 
                                    fontSize: 14,
                                    color: message.read 
                                      ? '#4ade80' 
                                      : alpha(theme.palette.common.white, 0.6)
                                  }} 
                                />
                              )
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    </Slide>
                  </Box>
                </Fade>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ 
            p: 2.5, 
            background: alpha(theme.palette.background.paper, 0.1),
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Paper
              component="form"
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                alignItems: 'center',
                borderRadius: 4,
                background: alpha(theme.palette.background.paper, 0.15),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                },
                '&:focus-within': {
                  border: `2px solid ${alpha('#667eea', 0.5)}`,
                  boxShadow: `0 0 0 3px ${alpha('#667eea', 0.1)}`
                }
              }}
            >
              <IconButton 
                onClick={handleEmojiOpen}
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.7),
                  '&:hover': { 
                    background: alpha(theme.palette.common.white, 0.1),
                    color: 'white'
                  }
                }}
              >
                <EmoticonIcon />
              </IconButton>
              
              <IconButton 
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.7),
                  '&:hover': { 
                    background: alpha(theme.palette.common.white, 0.1),
                    color: 'white'
                  }
                }}
              >
                <AttachFileIcon />
              </IconButton>

              <Popover
                open={Boolean(emojiAnchorEl)}
                anchorEl={emojiAnchorEl}
                onClose={handleEmojiClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    background: alpha(theme.palette.background.paper, 0.95),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                  }
                }}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  previewConfig={{ showPreview: false }}
                  width={320}
                  height={380}
                  skinTonesDisabled
                  searchDisabled={false}
                  lazyLoadEmojis
                  theme="dark"
                />
              </Popover>

              <InputBase
                sx={{ 
                  ml: 1, 
                  flex: 1,
                  color: 'white',
                  '& input::placeholder': {
                    color: alpha(theme.palette.common.white, 0.6)
                  }
                }}
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSend(); 
                  } 
                }}
                multiline
                maxRows={4}
              />
              
              <Grow in={inputValue.trim().length > 0}>
                <IconButton 
                  type="submit"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    width: 44,
                    height: 44,
                    ml: 1,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      transform: 'scale(1.05)'
                    },
                    '&:disabled': {
                      background: alpha(theme.palette.action.disabled, 0.2),
                      color: alpha(theme.palette.action.disabled, 0.5)
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Grow>
            </Paper>
          </Box>
        </Box>
      ) : (
        /* Welcome Screen */
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: alpha(theme.palette.background.default, 0.02),
          position: 'relative'
        }}>
          <Box sx={{
            textAlign: 'center', 
            maxWidth: 500,
            background: alpha(theme.palette.background.paper, 0.1),
            backdropFilter: 'blur(20px)',
            p: 5,
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Grow in={true} timeout={1000}>
              <Box>
                <ChatIcon sx={{ 
                  fontSize: 100, 
                  color: alpha(theme.palette.common.white, 0.7), 
                  mb: 3,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }} />
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'white',
                    mb: 2
                  }}
                >
                  Welcome to Messenger
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: alpha(theme.palette.common.white, 0.8),
                    lineHeight: 1.6
                  }}
                >
                  Select a conversation from the sidebar to start chatting with your friends and colleagues
                </Typography>
              </Box>
            </Grow>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ChatPage;