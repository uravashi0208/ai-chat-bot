import React, { useState, useEffect } from 'react';
import {
  Box, IconButton, InputBase, Tooltip, Menu, MenuItem,
  Divider, Badge, alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import ConversationList from './ConversationList';
import ContactSearch from './ContactSearch';
import { statusApi } from '../../services/api';

export default function Sidebar({ onSelectConversation, onSelectAI, isAIActive }) {
  const { user, logout } = useAuth();
  const [view, setView] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [hasMyStatus, setHasMyStatus] = useState(false);

  useEffect(() => {
    statusApi.getMyStatuses().then(s => setHasMyStatus(s?.length > 0)).catch(() => {});
  }, []);

  const handleMenuOpen = e => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  return (
    <Box sx={{
      width: { xs: '100%', md: 380 },
      minWidth: { md: 340 },
      maxWidth: { md: 420 },
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.sidebar',
      borderRight: '1px solid',
      borderColor: 'divider',
      flexShrink: 0,
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Box sx={{
        px: 2, py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.elevated',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 60,
      }}>
        <Tooltip title="Profile & Settings" placement="right">
          <Box
            onClick={() => setView(v => v === 'settings' ? 'chats' : 'settings')}
            sx={{ cursor: 'pointer', borderRadius: '50%', '&:hover': { opacity: 0.85 } }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                hasMyStatus ? (
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', border: '2px solid', borderColor: 'background.elevated' }} />
                ) : null
              }
            >
              <UserAvatar name={user?.full_name} src={user?.avatar_url} size={40} />
            </Badge>
          </Box>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="New chat">
            <IconButton
              size="small"
              onClick={() => setView(v => v === 'contacts' ? 'chats' : 'contacts')}
              sx={{ color: view === 'contacts' ? 'primary.main' : 'text.secondary' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Menu">
            <IconButton size="small" onClick={handleMenuOpen} sx={{ color: 'text.secondary' }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { setView('status'); handleMenuClose(); }}>Status</MenuItem>
          <MenuItem onClick={() => { setView('settings'); handleMenuClose(); }}>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={() => { logout(); handleMenuClose(); }} sx={{ color: 'error.main' }}>
            Log out
          </MenuItem>
        </Menu>
      </Box>

      {/* ── Search ─────────────────────────────────────────────── */}
      {view === 'chats' && (
        <Box sx={{ px: 2, py: 1.25, bgcolor: 'background.sidebar' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: alpha('#8696a0', 0.08),
            borderRadius: 3,
            px: 1.5,
            py: 0.75,
            border: '1px solid transparent',
            transition: 'all 0.2s',
            '&:focus-within': {
              bgcolor: alpha('#8696a0', 0.12),
              borderColor: alpha('#00a884', 0.4),
            },
          }}>
            <SearchIcon sx={{ color: 'text.disabled', fontSize: 20, flexShrink: 0 }} />
            <InputBase
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.875rem', color: 'text.primary', '& input::placeholder': { color: 'text.disabled' } }}
            />
          </Box>
        </Box>
      )}

      {/* ── Content ────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {view === 'chats' && (
          <ConversationList
            searchQuery={searchQuery}
            onSelect={conv => { onSelectConversation(conv); }}
            onSelectAI={onSelectAI}
            isAIActive={isAIActive}
          />
        )}
        {view === 'contacts' && (
          <ContactSearch
            onSelect={conv => { onSelectConversation(conv); setView('chats'); }}
            onClose={() => setView('chats')}
          />
        )}
        {view === 'settings' && (
          <LazySettings onClose={() => setView('chats')} />
        )}
        {view === 'status' && (
          <LazyStatusList onClose={() => setView('chats')} />
        )}
      </Box>
    </Box>
  );
}

// Lazy-loaded to avoid circular deps at module level
function LazySettings({ onClose }) {
  const Settings = React.lazy(() => import('../settings/Settings'));
  return (
    <React.Suspense fallback={null}>
      <Settings onClose={onClose} />
    </React.Suspense>
  );
}
function LazyStatusList({ onClose }) {
  const StatusList = React.lazy(() => import('../status/StatusList'));
  return (
    <React.Suspense fallback={null}>
      <StatusList onClose={onClose} />
    </React.Suspense>
  );
}
