import React from 'react';

const ChatHeader = ({ user, isOnline }) => {
  return (
    <div className="chat-header">
      <h3>{user.username}</h3>
      <div className={`online-status ${isOnline ? 'online' : 'offline'}`}></div>
    </div>
  );
};

export default ChatHeader;