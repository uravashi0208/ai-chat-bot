import React, { useEffect, useRef, useCallback } from "react";
import { Box, Typography, CircularProgress, alpha } from "@mui/material";
import MessageBubble from "./MessageBubble";
import { shouldShowDateDivider, formatDateDivider } from "../../utils/helpers";

function DateDivider({ dateStr }) {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, px: 2 }}
    >
      <Box sx={{ flex: 1, height: 1 }} />
      <Box
        sx={{
          bgcolor: "#e1f0e7",
          border: "none",
          borderRadius: 2.5,
          px: 1.75,
          py: 0.4,
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: "#667781", fontWeight: 500, fontSize: "0.75rem" }}
        >
          {formatDateDivider(dateStr)}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, height: 1 }} />
    </Box>
  );
}

function TypingIndicator({ count }) {
  return (
    <Box sx={{ display: "flex", px: 2, py: 0.5 }}>
      <Box
        sx={{
          bgcolor: "#ffffff",
          borderRadius: "4px 12px 12px 12px",
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          boxShadow: "0 1px 2px rgba(0,0,0,0.10)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "#8696a0",
              animation: "bounce 1.2s infinite",
              animationDelay: `${i * 0.2}s`,
              "@keyframes bounce": {
                "0%,60%,100%": { transform: "translateY(0)" },
                "30%": { transform: "translateY(-6px)", bgcolor: "#00a884" },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function MessageList({
  messages,
  loading,
  hasMore,
  currentUserId,
  onLoadMore,
  onReply,
  onDelete,
  onReaction,
  onStar,
  onMessageInfo,
  onForward,
  onEdit,
  typingUsers,
  conversation,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeight = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  // Preserve scroll position when loading older messages
  const handleScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (el.scrollTop < 80 && hasMore && !loading) {
        prevScrollHeight.current = el.scrollHeight;
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore],
  );

  useEffect(() => {
    if (prevScrollHeight.current && containerRef.current) {
      const diff = containerRef.current.scrollHeight - prevScrollHeight.current;
      containerRef.current.scrollTop += diff;
      prevScrollHeight.current = null;
    }
  }, [messages.length]);

  const typingArr = (useMemo) => [...(typingUsers || [])];
  const isGroup = conversation?.type === "group";

  return (
    <Box
      ref={containerRef}
      onScroll={handleScroll}
      sx={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#efeae2",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23d4c9be' opacity='0.45'/%3E%3C/svg%3E")`,
        py: 1,
      }}
    >
      {/* Load more indicator */}
      {(loading || hasMore) && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          {loading && (
            <CircularProgress size={20} sx={{ color: "primary.main" }} />
          )}
        </Box>
      )}

      {/* Empty state — shown after clear chat or in brand-new conversations */}
      {!loading && messages.length === 0 && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            pb: 4,
          }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(255,255,255,0.85)',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Typography
              sx={{ color: '#667781', fontSize: '0.8125rem', textAlign: 'center' }}
            >
              🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Messages */}
      {messages.map((msg, index) => {
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const showDivider = shouldShowDateDivider(prev, msg);
        const grouped =
          prev && !showDivider && prev.sender?.id === msg.sender?.id;
        const isOwn =
          msg.sender_id === currentUserId || msg.sender?.id === currentUserId;

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
              onReaction={(emoji) => onReaction(msg.id, emoji)}
              onStar={onStar}
              onMessageInfo={onMessageInfo}
              onForward={onForward}
              onEdit={onEdit}
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
