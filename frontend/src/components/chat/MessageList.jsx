import React, { useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress, alpha } from '@mui/material';
import MessageBubble from './MessageBubble';
import { shouldShowDateDivider, formatDateDivider } from '../../utils/helpers';

function DateDivider({ dateStr }) {
  return (
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', py:1.5 }}>
      <Box sx={{
        bgcolor: alpha('#111b21', 0.85),
        backdropFilter: 'blur(8px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        px: 2, py: 0.5,
      }}>
        <Typography variant="caption" sx={{ color:'text.secondary', fontWeight:500, fontSize:'0.78rem' }}>
          {formatDateDivider(dateStr)}
        </Typography>
      </Box>
    </Box>
  );
}

function TypingIndicator({ count }) {
  return (
    <Box sx={{ display:'flex', px:2, py:0.5 }}>
      <Box sx={{
        bgcolor: '#1e2a33',
        borderRadius: '4px 18px 18px 18px',
        px: 2, py: 1.25,
        display: 'flex', alignItems: 'center', gap: 0.5,
        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}>
        {[0,1,2].map(i => (
          <Box key={i} sx={{
            width: 7, height: 7, borderRadius: '50%',
            bgcolor: '#8696a0',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': {
              '0%,60%,100%': { transform: 'translateY(0)' },
              '30%': { transform: 'translateY(-6px)', bgcolor: '#00a884' },
            },
          }} />
        ))}
      </Box>
    </Box>
  );
}

export default function MessageList({
  messages, loading, hasMore, currentUserId,
  onLoadMore, onReply, onDelete, onReaction,
  onStar, onMessageInfo, typingUsers, conversation,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeight = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading]);

  // Preserve scroll position when loading older messages
  const handleScroll = useCallback(e => {
    const el = e.currentTarget;
    if (el.scrollTop < 80 && hasMore && !loading) {
      prevScrollHeight.current = el.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    if (prevScrollHeight.current && containerRef.current) {
      const diff = containerRef.current.scrollHeight - prevScrollHeight.current;
      containerRef.current.scrollTop += diff;
      prevScrollHeight.current = null;
    }
  }, [messages.length]);

  const typingArr = useMemo => [...(typingUsers || [])];
  const isGroup = conversation?.type === 'group';

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.chatPanel',
        backgroundImage: 'radial-gradient(ellipse at top left, rgba(0,168,132,0.03) 0%, transparent 60%)',
        py: 1,
      }}
    >
      {/* Load more indicator */}
      {(loading || hasMore) && (
        <Box sx={{ display:'flex', justifyContent:'center', py:2 }}>
          {loading && <CircularProgress size={20} sx={{ color:'primary.main' }} />}
        </Box>
      )}

      {/* Messages */}
      {messages.map((msg, index) => {
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const showDivider = shouldShowDateDivider(prev, msg);
        const grouped = prev && !showDivider && prev.sender?.id === msg.sender?.id;
        const isOwn = msg.sender_id === currentUserId || msg.sender?.id === currentUserId;

        return (
          <React.Fragment key={msg.id}>
            {showDivider && <DateDivider dateStr={msg.created_at} />}
            <MessageBubble
              message={msg}
              isOwn={isOwn}
              grouped={grouped}
              currentUserId={currentUserId}
              isGroup={isGroup}
              onReply={() => onReply(msg)}
              onDelete={() => onDelete(msg.id)}
              onReaction={emoji => onReaction(msg.id, emoji)}
              onStar={onStar}
              onMessageInfo={onMessageInfo}
            />
          </React.Fragment>
        );
      })}

      {/* Typing indicator */}
      {(typingUsers?.size > 0 || typingUsers?.length > 0) && (
        <TypingIndicator count={typingUsers.size || typingUsers.length} />
      )}

      <div ref={bottomRef} />
    </Box>
  );
}
