import React from 'react';

const Message = ({ message, isCurrentUser }) => {
  return (
    <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default Message;