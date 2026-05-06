import React, { useState, useRef } from 'react';
import {
  Box, Typography, IconButton, Tooltip, alpha,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  SentimentSatisfiedAlt as EmojiIcon,
  Star as StarFilledIcon,
  StarBorder as StarOutlineIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { formatMessageTime } from '../../utils/helpers';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const SENDER_COLORS = ['#a78bfa','#34d399','#f472b6','#fb923c','#60a5fa','#facc15'];
function getSenderColor(id) {
  if (!id) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

function MessageTick({ status }) {
  const props = { sx: { fontSize: 15, flexShrink: 0 } };
  if (status === 'sending') return <ScheduleIcon {...props} sx={{ ...props.sx, color: alpha('#fff', 0.4) }} />;
  if (status === 'sent') return <DoneIcon {...props} sx={{ ...props.sx, color: alpha('#fff', 0.5) }} />;
  if (status === 'delivered') return <DoneAllIcon {...props} sx={{ ...props.sx, color: alpha('#fff', 0.5) }} />;
  if (status === 'read') return <DoneAllIcon {...props} sx={{ ...props.sx, color: '#00a884' }} />;
  return null;
}

export default function MessageBubble({
  message, isOwn, grouped, onReply, onDelete, onReaction,
  onMessageInfo, onStar, currentUserId, isGroup,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isStarred, setIsStarred] = useState(message.is_starred || false);
  const [starLoading, setStarLoading] = useState(false);
  const hoverTimer = useRef(null);

  const isDeleted = message.is_deleted || message.type === 'deleted';

  const handleMouseEnter = () => { hoverTimer.current = setTimeout(() => setShowActions(true), 80); };
  const handleMouseLeave = () => { clearTimeout(hoverTimer.current); setShowActions(false); setShowEmoji(false); };

  const handleStarToggle = async () => {
    if (starLoading) return;
    setStarLoading(true);
    try { await onStar(message.id, isStarred); setIsStarred(p => !p); }
    catch {} finally { setStarLoading(false); }
  };

  const reactionGroups = {};
  (message.reactions || []).forEach(({ emoji, user_id }) => {
    if (!reactionGroups[emoji]) reactionGroups[emoji] = { count: 0, mine: false };
    reactionGroups[emoji].count++;
    if (user_id === currentUserId) reactionGroups[emoji].mine = true;
  });
  const hasReactions = Object.keys(reactionGroups).length > 0;

  const bubbleBg = isOwn ? '#005c4b' : '#1e2a33';
  const bubbleRadius = isOwn
    ? (grouped ? '18px 4px 4px 18px' : '18px 4px 18px 18px')
    : (grouped ? '4px 18px 18px 4px' : '4px 18px 18px 18px');

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        px: 2,
        pb: hasReactions ? 2.5 : (grouped ? 0.25 : 0.75),
        pt: grouped ? 0.125 : 0,
        position: 'relative',
      }}
    >
      {/* Action bar */}
      {showActions && !isDeleted && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          ...(isOwn ? { right: 'calc(100% - 48px)' } : { left: 'calc(100% - 48px)' }),
          bgcolor: 'background.elevated',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          px: 0.5,
          py: 0.5,
          boxShadow: 3,
        }}>
          {/* Emoji picker trigger */}
          <Box sx={{ position: 'relative' }}>
            <Tooltip title="React">
              <IconButton size="small" onClick={() => setShowEmoji(p => !p)} sx={{ color: 'text.secondary', width: 28, height: 28 }}>
                <EmojiIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            {showEmoji && (
              <Box sx={{
                position: 'absolute',
                bottom: '100%',
                [isOwn ? 'right' : 'left']: 0,
                mb: 0.5,
                display: 'flex',
                gap: 0.5,
                bgcolor: 'background.elevated',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 0.75,
                boxShadow: 4,
                zIndex: 20,
              }}>
                {REACTIONS.map(e => (
                  <Box
                    key={e}
                    component="button"
                    onClick={() => { onReaction(e); setShowEmoji(false); }}
                    sx={{
                      fontSize: '1.2rem', width: 32, height: 32, cursor: 'pointer',
                      border: 'none', bgcolor: 'transparent', borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                      '&:hover': { transform: 'scale(1.3)', bgcolor: alpha('#8696a0', 0.12) },
                    }}
                  >
                    {e}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Tooltip title="Reply">
            <IconButton size="small" onClick={onReply} sx={{ color: 'text.secondary', width: 28, height: 28 }}>
              <ReplyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={isStarred ? 'Unstar' : 'Star'}>
            <IconButton size="small" onClick={handleStarToggle} disabled={starLoading} sx={{ color: isStarred ? 'warning.main' : 'text.secondary', width: 28, height: 28 }}>
              {isStarred ? <StarFilledIcon sx={{ fontSize: 16, color: 'warning.main' }} /> : <StarOutlineIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          {isOwn && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={onDelete} sx={{ color: 'error.main', width: 28, height: 28 }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Bubble */}
      <Box
        onClick={isOwn ? () => onMessageInfo?.(message) : undefined}
        sx={{
          maxWidth: { xs: '85%', sm: '70%', md: '60%' },
          bgcolor: bubbleBg,
          borderRadius: bubbleRadius,
          px: message.type === 'image' ? 0 : 1.5,
          pt: message.type === 'image' ? 0 : 0.75,
          pb: 0.5,
          position: 'relative',
          cursor: isOwn ? 'pointer' : 'default',
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          overflow: message.type === 'image' ? 'hidden' : 'visible',
          transition: 'opacity 0.15s',
          '&:hover': isOwn ? { opacity: 0.95 } : {},
        }}
      >
        {/* Group sender name */}
        {!isOwn && isGroup && !grouped && message.sender && (
          <Typography variant="caption" sx={{ fontWeight: 700, color: getSenderColor(message.sender.id), display: 'block', mb: 0.25, fontSize: '0.78rem' }}>
            {message.sender.full_name}
          </Typography>
        )}

        {/* Reply preview */}
        {message.reply_to && !isDeleted && (
          <Box sx={{
            bgcolor: alpha('#000', 0.2),
            borderLeft: '3px solid',
            borderColor: 'primary.main',
            borderRadius: '0 8px 8px 0',
            px: 1.25, py: 0.75, mb: 0.75,
          }}>
            <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 600, display: 'block' }}>
              {message.reply_to.sender?.full_name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
              {message.reply_to.content}
            </Typography>
          </Box>
        )}

        {/* Content */}
        {isDeleted ? (
          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', px: message.type === 'image' ? 1.5 : 0 }}>
            🚫 This message was deleted
          </Typography>
        ) : message.type === 'image' ? (
          <Box>
            <Box component="img" src={message.media_url} alt="shared" sx={{ display: 'block', maxWidth: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: grouped ? '4px 18px 0 0' : '4px 18px 0 0' }} />
            {message.content && (
              <Typography variant="body2" sx={{ px: 1.5, pt: 0.75, pb: 0.25, color: 'text.primary', fontSize: '0.875rem' }}>
                {message.content}
              </Typography>
            )}
          </Box>
        ) : message.type === 'video' ? (
          <Box sx={{ borderRadius: '4px 18px 0 0', overflow: 'hidden' }}>
            <Box component="video" src={message.media_url} controls sx={{ display: 'block', maxWidth: '100%', maxHeight: 280 }} />
            {message.content && <Typography variant="body2" sx={{ px: 1.5, pt: 0.75 }}>{message.content}</Typography>}
          </Box>
        ) : message.type === 'audio' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <Typography sx={{ fontSize: '1.2rem' }}>🎤</Typography>
            <Box component="audio" src={message.media_url} controls sx={{ height: 32 }} />
          </Box>
        ) : message.type === 'document' ? (
          <Box
            component="a"
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              bgcolor: alpha('#000', 0.2), borderRadius: 2, p: 1.25, mb: 0.5,
              textDecoration: 'none', color: 'inherit',
              '&:hover': { bgcolor: alpha('#000', 0.3) },
            }}
          >
            <Typography sx={{ fontSize: '1.5rem' }}>📄</Typography>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" noWrap sx={{ display: 'block', fontWeight: 600, color: 'text.primary' }}>
                {message.media_url ? decodeURIComponent(message.media_url.split('/').pop().split('?')[0]).replace(/^\d+_/, '') : 'Document'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>Tap to open</Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: '#e9edef', fontSize: '0.9375rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', pr: message.type !== 'text' ? 0 : 4 }}>
            {message.content}
          </Typography>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.25, px: message.type === 'image' ? 1 : 0, pb: message.type === 'image' ? 0.5 : 0 }}>
          {isStarred && <StarFilledIcon sx={{ fontSize: 10, color: 'warning.main' }} />}
          {message.edited_at && <Typography variant="caption" sx={{ color: alpha('#fff', 0.45), fontSize: '0.68rem' }}>edited</Typography>}
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), fontSize: '0.72rem' }}>
            {formatMessageTime(message.created_at)}
          </Typography>
          {isOwn && <MessageTick status={message.status} />}
        </Box>

        {/* Reactions */}
        {hasReactions && (
          <Box sx={{
            position: 'absolute',
            bottom: -18,
            [isOwn ? 'right' : 'left']: 8,
            display: 'flex',
            gap: 0.5,
            zIndex: 5,
          }}>
            {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
              <Box
                key={emoji}
                component="button"
                onClick={() => onReaction(emoji)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  bgcolor: mine ? alpha('#00a884', 0.25) : 'background.elevated',
                  border: `1px solid ${mine ? alpha('#00a884', 0.5) : alpha('#8696a0', 0.3)}`,
                  borderRadius: 3, px: 0.75, py: 0.25, cursor: 'pointer',
                  fontSize: '0.8rem', color: 'text.primary',
                  transition: 'all 0.15s',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
              >
                {emoji}
                {count > 1 && <span style={{ fontSize: '0.7rem', color: '#8696a0' }}>{count}</span>}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
