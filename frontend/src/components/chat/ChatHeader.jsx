import React, { useMemo } from 'react';
import {
  Box, Typography, IconButton, Tooltip, alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Videocam as VideocamIcon,
  Call as CallIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import UserAvatar from '../common/UserAvatar';
import {
  getConversationName,
  getConversationAvatar,
  getOtherParticipant,
  formatLastSeen,
} from '../../utils/helpers';

export default function ChatHeader({ conversation, typingUsers, onBack }) {
  const { user } = useAuth();
  const { isUserOnline } = useChat();

  const name = getConversationName(conversation, user.id);
  const avatarUrl = getConversationAvatar(conversation, user.id);
  const other = getOtherParticipant(conversation, user.id);
  const online = conversation.type === 'direct' ? isUserOnline(other?.user?.id) : false;

  const typingArr = useMemo(() => [...(typingUsers || [])], [typingUsers]);
  const isGroup = conversation.type === 'group';

  let statusText;
  if (typingArr.length > 0) {
    statusText = isGroup
      ? `${typingArr.length} typing…`
      : 'typing…';
  } else if (isGroup) {
    const count = conversation.participants?.length || 0;
    statusText = `${count} participant${count !== 1 ? 's' : ''}`;
  } else {
    statusText = formatLastSeen(other?.user?.last_seen, online);
  }

  return (
    <Box sx={{
      px: 2, py: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      bgcolor: 'background.elevated',
      borderBottom: '1px solid',
      borderColor: 'divider',
      minHeight: 60,
      flexShrink: 0,
    }}>
      {/* Back button (mobile) */}
      <IconButton
        size="small"
        onClick={onBack}
        sx={{ display: { md: 'none' }, color: 'text.secondary' }}
      >
        <ArrowBackIcon />
      </IconButton>

      {/* Avatar */}
      <Box sx={{ cursor: 'pointer' }}>
        <UserAvatar
          name={name}
          src={avatarUrl}
          size={40}
          online={conversation.type === 'direct' ? online : undefined}
        />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          noWrap
          sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary', lineHeight: 1.3 }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: typingArr.length > 0 ? 'primary.main' : 'text.secondary',
            fontSize: '0.78rem',
            lineHeight: 1,
            fontStyle: typingArr.length > 0 ? 'italic' : 'normal',
            transition: 'color 0.2s',
          }}
        >
          {statusText}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <Tooltip title="Voice call">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <CallIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Video call">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <VideocamIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Search">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="More options">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
