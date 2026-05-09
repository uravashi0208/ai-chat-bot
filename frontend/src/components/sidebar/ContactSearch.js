import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, InputBase, List, ListItemButton,
  CircularProgress, Divider, IconButton, alpha,
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { usersApi, conversationsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import EmptyState from '../common/EmptyState';

export default function ContactSearch({ onSelect, onClose }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    usersApi.getContacts().then(data => setContacts(data || [])).catch(() => {});
  }, []);

  const handleSearch = useCallback(async q => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await usersApi.search(q);
      setResults(data.filter(u => u.id !== user.id));
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, handleSearch]);

  const handleOpen = async (userId) => {
    setOpening(userId);
    try {
      const conv = await conversationsApi.findOrCreateDirect(userId);
      onSelect(conv);
    } catch {} finally { setOpening(null); }
  };

  const displayList = query.trim() ? results : contacts.map(c => c.contact);

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <Box sx={{ px:2, py:1.5, display:'flex', alignItems:'center', gap:1.5, borderBottom:'1px solid', borderColor:'divider', bgcolor:'background.elevated' }}>
        <IconButton size="small" onClick={onClose} sx={{ color:'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight:600, color:'text.primary' }}>
          New Chat
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ px:2, py:1.25 }}>
        <Box sx={{
          display:'flex', alignItems:'center', gap:1,
          bgcolor: alpha('#8696a0', 0.08), borderRadius:3, px:1.5, py:0.75,
          border:'1px solid transparent', transition:'all 0.2s',
          '&:focus-within': { bgcolor: alpha('#8696a0', 0.12), borderColor: alpha('#00a884', 0.4) },
        }}>
          <SearchIcon sx={{ color:'text.disabled', fontSize:20 }} />
          <InputBase
            autoFocus
            placeholder="Search name or number..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            sx={{ flex:1, fontSize:'0.875rem', color:'text.primary', '& input::placeholder': { color:'text.disabled' } }}
          />
          {loading && <CircularProgress size={16} sx={{ color:'primary.main' }} />}
        </Box>
      </Box>

      {!query && contacts.length > 0 && (
        <Typography variant="caption" sx={{ px:2, py:0.5, color:'text.disabled', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.7px' }}>
          Contacts on WhatsApp
        </Typography>
      )}

      <Box sx={{ flex:1, overflowY:'auto' }}>
        {displayList.length === 0 && !loading ? (
          <EmptyState
            icon={<PersonAddIcon sx={{ fontSize:40, color:'text.disabled' }} />}
            title={query ? 'No users found' : 'No contacts yet'}
            subtitle={query ? 'Try a different name or number' : 'Search for people to start chatting'}
          />
        ) : (
          <List disablePadding>
            {displayList.map(u => u && (
              <ListItemButton
                key={u.id}
                onClick={() => handleOpen(u.id)}
                disabled={opening === u.id}
                sx={{ px:2, py:1.25, gap:1.5, borderBottom:'1px solid', borderColor:'divider' }}
              >
                <UserAvatar name={u.full_name} src={u.avatar_url} size={46} />
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight:600, fontSize:'0.9375rem' }}>
                    {u.full_name}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ color:'text.secondary', fontSize:'0.8125rem' }}>
                    {u.about || u.username || u.phone || ''}
                  </Typography>
                </Box>
                {opening === u.id && <CircularProgress size={18} sx={{ color:'primary.main' }} />}
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
