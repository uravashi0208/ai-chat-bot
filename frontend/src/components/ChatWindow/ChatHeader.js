import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import { getConversationName, getConversationAvatar, getOtherParticipant, formatLastSeen } from '../../utils/helpers';
import './ChatHeader.css';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

export default function ChatHeader({ conversation, typingUsers, onBack }) {
  const { user } = useAuth();
  const { isUserOnline } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);

  const name = getConversationName(conversation, user.id);
  const avatar = getConversationAvatar(conversation, user.id);
  const other = getOtherParticipant(conversation, user.id);
  const isOnline = other ? isUserOnline(other.user?.id) : false;

  const typingArr = [...typingUsers].filter((id) => id !== user.id);
  let statusText;
  if (typingArr.length > 0) {
    if (conversation.type === 'direct') {
      statusText = <span className="typing-indicator">typing<span className="dots"><span/><span/><span/></span></span>;
    } else {
      const names = typingArr.map((id) => {
        const p = conversation.participants?.find((pa) => pa.user?.id === id);
        return p?.user?.full_name?.split(' ')[0] || 'Someone';
      });
      statusText = <span className="typing-indicator">{names.join(', ')} typing...</span>;
    }
  } else if (conversation.type === 'direct' && other) {
    statusText = (
      <span className={isOnline ? 'status-online' : 'status-offline'}>
        {formatLastSeen(other.user?.last_seen, isOnline)}
      </span>
    );
  } else if (conversation.type === 'group') {
    const count = conversation.participants?.length || 0;
    statusText = <span className="status-offline">{count} participants</span>;
  }

  return (
    <div className="chat-header">
      <button className="chat-header-back" onClick={onBack}><BackIcon /></button>

      <button className="chat-header-info">
        <Avatar name={name} src={avatar} size={40} />
        <div className="chat-header-text">
          <span className="chat-header-name truncate">{name}</span>
          <span className="chat-header-status">{statusText}</span>
        </div>
      </button>

      <div className="chat-header-actions">
        <button className="header-icon-btn" title="Search"><SearchIcon /></button>
        <div className="header-menu-wrap">
          <button className="header-icon-btn" onClick={() => setMenuOpen(!menuOpen)}><DotsIcon /></button>
          {menuOpen && (
            <div className="header-dropdown">
              <button onClick={() => setMenuOpen(false)}>Contact info</button>
              <button onClick={() => setMenuOpen(false)}>Search messages</button>
              <button onClick={() => setMenuOpen(false)}>Mute notifications</button>
              <button onClick={() => setMenuOpen(false)}>Clear messages</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
