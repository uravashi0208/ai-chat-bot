import React, { useMemo } from 'react';
import {
  Box, List, ListItemButton, ListItemText,
  Typography, Chip, alpha,
} from '@mui/material';
import {
  VolumeOff as VolumeOffIcon,
  AutoAwesome as AIIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../common/UserAvatar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import {
  formatConversationTime,
  getConversationName,
  getConversationAvatar,
  getOtherParticipant,
} from '../../utils/helpers';

function MessageStatus({ status, isOwn }) {
  if (!isOwn) return null;
  const color = status === 'read' ? '#00a884' : '#8696a0';
  if (status === 'read' || status === 'delivered') {
    return <DoneAllIcon sx={{ fontSize: 15, color, flexShrink: 0 }} />;
  }
  return <DoneIcon sx={{ fontSize: 15, color, flexShrink: 0 }} />;
}

function AIChatItem({ isActive, onClick }) {
  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2, py: 1.5,
        gap: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&.Mui-selected': {
          bgcolor: alpha('#00a884', 0.12),
          '&:hover': { bgcolor: alpha('#00a884', 0.16) },
        },
      }}
    >
      {/* AI Avatar */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isActive ? '0 0 0 2px #00a884' : 'none',
          transition: 'box-shadow 0.2s',
        }}>
          <AIIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box sx={{
          position: 'absolute', bottom: 2, right: 2,
          width: 11, height: 11, borderRadius: '50%',
          bgcolor: '#00a884', border: '2px solid', borderColor: 'background.sidebar',
        }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}>
            AI Assistant
          </Typography>
          <Chip label="AI" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha('#7c3aed', 0.2), color: '#a78bfa', border: '1px solid', borderColor: alpha('#7c3aed', 0.3) }} />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.8125rem', fontStyle: 'italic' }}>
          Ask me anything ✨
        </Typography>
      </Box>
    </ListItemButton>
  );
}

export default function ConversationList({ searchQuery, onSelect, onSelectAI, isAIActive }) {
  const { conversations, activeConversation, loading, isUserOnline } = useChat();
  const { user } = useAuth();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => {
      const name = getConversationName(c, user.id).toLowerCase();
      const lastMsg = c.last_message?.content?.toLowerCase() || '';
      return name.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery, user.id]);

  if (loading) return <LoadingSpinner />;

  return (
    <List disablePadding>
      <AIChatItem isActive={isAIActive} onClick={onSelectAI} />

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon="💬"
          title={searchQuery ? 'No results found' : 'No conversations yet'}
          subtitle={searchQuery ? 'Try a different search term' : 'Start a new chat using the edit icon above'}
        />
      )}

      {filtered.map(conv => {
        const isActive = activeConversation?.id === conv.id;
        const name = getConversationName(conv, user.id);
        const avatarUrl = getConversationAvatar(conv, user.id);
        const other = getOtherParticipant(conv, user.id);
        const online = conv.type === 'direct' ? isUserOnline(other?.user?.id) : false;
        const lastMsg = conv.last_message;
        const isOwnMsg = lastMsg?.sender?.id === user.id;
        const unread = conv.unread_count || 0;

        return (
          <ListItemButton
            key={conv.id}
            onClick={() => onSelect(conv)}
            selected={isActive}
            sx={{
              px: 2, py: 1.25,
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              alignItems: 'flex-start',
              transition: 'background-color 0.15s',
              '&.Mui-selected': {
                bgcolor: alpha('#00a884', 0.1),
                '&:hover': { bgcolor: alpha('#00a884', 0.14) },
              },
            }}
          >
            <UserAvatar name={name} src={avatarUrl} size={48} online={conv.type === 'direct' ? online : undefined} />

            <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ fontWeight: unread > 0 ? 700 : 600, color: 'text.primary', fontSize: '0.9375rem', maxWidth: '60%' }}
                >
                  {name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                  {conv.is_muted && <VolumeOffIcon sx={{ fontSize: 13, color: 'text.disabled' }} />}
                  <Typography variant="caption" sx={{ color: unread > 0 ? 'primary.main' : 'text.disabled', fontSize: '0.72rem', fontWeight: unread > 0 ? 600 : 400 }}>
                    {formatConversationTime(conv.last_message_at || conv.created_at)}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                  {lastMsg && <MessageStatus status={lastMsg.status} isOwn={isOwnMsg} />}
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      color: unread > 0 ? 'text.primary' : 'text.secondary',
                      fontSize: '0.8125rem',
                      fontWeight: unread > 0 ? 500 : 400,
                      flex: 1,
                    }}
                  >
                    {lastMsg?.is_deleted
                      ? '🚫 This message was deleted'
                      : lastMsg?.type !== 'text' && lastMsg?.type
                        ? `📎 ${lastMsg.type}`
                        : lastMsg?.content || ''}
                  </Typography>
                </Box>

                {unread > 0 && (
                  <Chip
                    label={unread > 99 ? '99+' : unread}
                    size="small"
                    sx={{
                      height: 20, minWidth: 20,
                      bgcolor: conv.is_muted ? 'rgba(134,150,160,0.25)' : 'primary.main',
                      color: conv.is_muted ? 'text.secondary' : '#fff',
                      fontSize: '0.7rem', fontWeight: 700,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </Box>
            </Box>
          </ListItemButton>
        );
      })}
    </List>
  );
}
