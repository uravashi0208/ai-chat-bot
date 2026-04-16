import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ConversationList from './ConversationList';
import ContactSearch from './ContactSearch';
import UserProfile from './UserProfile';
import Avatar from '../common/Avatar';
import './Sidebar.css';

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </svg>
);
const IconContacts = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);
const IconNewChat = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zm-8-4h-2v-2h2v2zm0-4h-2V4h2v4z"/>
    <path d="M13 11h-2v-2h2v2zm0-4h-2V4h2v4z" style={{display:'none'}}/>
  </svg>
);
const IconMenuDots = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

export default function Sidebar({ onSelectConversation }) {
  const { user, logout } = useAuth();
  const [view, setView] = useState('chats'); // 'chats' | 'contacts' | 'profile' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <button className="sidebar-avatar-btn" onClick={() => setView(view === 'profile' ? 'chats' : 'profile')}>
          <Avatar name={user?.full_name} src={user?.avatar_url} size={40} />
        </button>
        <div className="sidebar-header-actions">
          <button
            className={`sidebar-icon-btn ${view === 'contacts' ? 'active' : ''}`}
            onClick={() => setView(view === 'contacts' ? 'chats' : 'contacts')}
            title="New chat"
          >
            <IconNewChat />
          </button>
          <div className="sidebar-menu-wrapper">
            <button className="sidebar-icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <IconMenuDots />
            </button>
            {menuOpen && (
              <div className="sidebar-dropdown">
                <button onClick={() => { setView('profile'); setMenuOpen(false); }}>Profile</button>
                <button onClick={() => { logout(); setMenuOpen(false); }}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      {view === 'chats' && (
        <div className="sidebar-search">
          <div className="search-input-wrap">
            <IconSearch />
            <input
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="sidebar-content">
        {view === 'chats' && (
          <ConversationList
            searchQuery={searchQuery}
            onSelect={(conv) => { onSelectConversation(conv); }}
          />
        )}
        {view === 'contacts' && (
          <ContactSearch
            onSelect={(conv) => { onSelectConversation(conv); setView('chats'); }}
            onClose={() => setView('chats')}
          />
        )}
        {view === 'profile' && (
          <UserProfile onClose={() => setView('chats')} />
        )}
      </div>
    </div>
  );
}
