import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getUsers, getMessages, sendMessage } from '../api/chat';
import { FiSend, FiSearch, FiMoreVertical, FiLogOut } from 'react-icons/fi';
import { BsEmojiSmile, BsCheck2All } from 'react-icons/bs';
import { RiChatNewLine } from 'react-icons/ri';
import EmojiPicker from 'emoji-picker-react';
import '../assets/styles/chat.css';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersList = await getUsers();
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const chatMessages = await getMessages(selectedUser.id);
          setMessages(chatMessages);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };
      fetchMessages();
    }
  }, [selectedUser]);

  // Socket message handling
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleNewMessage = (message) => {
      if (message.sender_id === selectedUser.id || 
          (message.sender_id === user.id && message.receiver_id === selectedUser.id)) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, selectedUser, user.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
          !event.target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiData) => {
    setInputValue(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedUser) return;

    try {
      const newMessage = await sendMessage({
        receiverId: selectedUser.id,
        content: inputValue
      });

      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getLastMessage = useMemo(() => {
    const lastMessages = {};
    users.forEach(userItem => {
      const userMessages = messages.filter(
        msg => msg.sender_id === userItem.id || msg.receiver_id === userItem.id
      );
      if (userMessages.length > 0) {
        lastMessages[userItem.id] = [...userMessages].sort((a, b) => 
          new Date(b.sent_at) - new Date(a.sent_at)
        )[0];
      }
    });
    return (userId) => lastMessages[userId] || null;
  }, [users, messages]);

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const filteredUsers = users.filter(userItem => 
    userItem.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-chat-app">
      {/* Left sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="avatar-circle" style={{ backgroundColor: stringToColor(user.username) }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="username">{user.username}</span>
              <span className={`user-status ${user.online ? 'online' : 'offline'}`}>
                {user.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="profile-actions" ref={dropdownRef}>
            <FiMoreVertical 
              className="action-icon" 
              onClick={() => setShowDropdown(!showDropdown)}
            />
            
            {showDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={logout}>
                  <FiLogOut />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="user-list">
          {filteredUsers.map((userItem) => {
            const lastMessage = getLastMessage(userItem.id);
            const isCurrentUser = userItem.id === user.id;
            
            return (
              <div 
                key={userItem.id} 
                className={`user-item ${selectedUser?.id === userItem.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(userItem)}
              >
                <div className="user-avatar" style={{ backgroundColor: stringToColor(userItem.username) }}>
                  {userItem.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h4>{userItem.username}</h4>
                  <p className="last-message">
                    {lastMessage ? (
                      <>
                        {lastMessage.sender_id === user.id && 'You: '}
                        {lastMessage.content.length > 25 
                          ? `${lastMessage.content.substring(0, 25)}...` 
                          : lastMessage.content}
                      </>
                    ) : 'Start chatting!'}
                  </p>
                </div>
                <div className="message-time">
                  {lastMessage && formatMessageTime(lastMessage.sent_at)}
                </div>
                {userItem.unreadCount > 0 && (
                  <div className="unread-badge">{userItem.unreadCount}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right chat area */}
      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="header-left">
                <div className="user-avatar" style={{ backgroundColor: stringToColor(selectedUser.username) }}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3>{selectedUser.username}</h3>
                  <p className={`status ${selectedUser.online ? 'online' : 'offline'}`}>
                    {selectedUser.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="header-right">
                <FiSearch className="icon" />
                <div className="dropdown-container">
                  <FiMoreVertical className="icon" />
                </div>
              </div>
            </div>

            <div className="messages-container">
              <div className="messages">
                {messages.map((message, index) => {
                  const isSameSender = index > 0 && messages[index - 1].sender_id === message.sender_id;
                  const timeDiff = index > 0 ? 
                    (new Date(message.sent_at) - new Date(messages[index - 1].sent_at)) / (1000 * 60) : 
                    Infinity;
                  
                  const showHeader = !isSameSender || timeDiff > 5;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`message ${message.sender_id === user.id ? 'sent' : 'received'}`}
                    >
                      {showHeader && message.sender_id !== user.id && (
                        <div className="message-header">
                          <div className="message-sender">
                            {selectedUser.username}
                          </div>
                          <div className="message-time">
                            {formatMessageTime(message.sent_at)}
                          </div>
                        </div>
                      )}
                      <div className="message-content">
                        {message.content}
                        {message.sender_id === user.id && (
                          <span className="message-status">
                            <BsCheck2All className={`read-icon ${message.read ? 'read' : ''}`} />
                            <span className="time-sent">
                              {formatMessageTime(message.sent_at)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="message-input-container">
              <div className="input-actions">
                <div className="emoji-picker-container" ref={emojiPickerRef}>
                  <button
                    type="button"
                    className={`emoji-button ${showEmojiPicker ? 'active' : ''}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    aria-label="Toggle emoji picker"
                  >
                    <BsEmojiSmile className="icon" />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="emoji-picker-wrapper">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        previewConfig={{ showPreview: false }}
                        width="100%"
                        height={350}
                        skinTonesDisabled
                        searchDisabled={false}
                        lazyLoadEmojis
                        theme="light"
                        className="custom-emoji-picker"
                      />
                    </div>
                  )}
                </div>
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
              />
              <button 
                className={`send-button ${inputValue.trim() ? 'active' : ''}`}
                onClick={handleSend}
                disabled={!inputValue.trim()}
              >
                <FiSend />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-chat">
            <div className="empty-content">
              <div className="empty-icon">
                <RiChatNewLine />
              </div>
              <h2>Welcome to Messenger</h2>
              <p>Select a conversation or start a new one to begin chatting</p>
              <div className="empty-features">
                <div className="feature">
                  <div className="feature-icon">🔒</div>
                  <div className="feature-text">End-to-end encrypted</div>
                </div>
                <div className="feature">
                  <div className="feature-icon">⚡</div>
                  <div className="feature-text">Lightning fast</div>
                </div>
                <div className="feature">
                  <div className="feature-icon">🎨</div>
                  <div className="feature-text">Beautiful design</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

export default ChatPage;