import React, { useState, useCallback } from 'react';
import { usersApi } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import './ContactSearch.css';

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  </svg>
);

export default function ContactSearch({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openConversation } = useChat();

  const search = useCallback(async (q) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await usersApi.search(q);
      setResults(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const handleSelect = async (user) => {
    const conv = await openConversation(user.id);
    if (conv) onSelect(conv);
  };

  return (
    <div className="contact-search">
      <div className="contact-search-header">
        <button onClick={onClose} className="back-btn"><BackIcon /></button>
        <h3>New Chat</h3>
      </div>
      <div className="contact-search-input">
        <input
          autoFocus
          placeholder="Search by name or username..."
          value={query}
          onChange={(e) => search(e.target.value)}
        />
      </div>
      <div className="contact-results">
        {loading && (
          <div className="contact-loading">Searching...</div>
        )}
        {!loading && query && results.length === 0 && (
          <div className="contact-empty">No users found for "{query}"</div>
        )}
        {results.map((u) => (
          <button key={u.id} className="contact-item" onClick={() => handleSelect(u)}>
            <div style={{ position: 'relative' }}>
              <Avatar name={u.full_name} src={u.avatar_url} size={46} />
              {u.status === 'online' && <span className="contact-online-dot" />}
            </div>
            <div className="contact-info">
              <span className="contact-name">{u.full_name}</span>
              <span className="contact-username">@{u.username}</span>
              {u.about && <span className="contact-about truncate">{u.about}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
