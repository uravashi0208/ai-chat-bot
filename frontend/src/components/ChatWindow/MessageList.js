import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { shouldShowDateDivider, formatDateDivider } from "../../utils/helpers";
import "./MessageList.css";

export default function MessageList({
  messages,
  loading,
  hasMore,
  currentUserId,
  onLoadMore,
  onReply,
  onDelete,
  onReaction,
  onMessageInfo,
  typingUsers,
  conversation,
}) {
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const isNewMsg = messages.length > prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (isNewMsg && listRef.current) {
      // Smooth scroll to bottom without jumping to top first
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Initial scroll to bottom - instant, no animation to avoid top-jump
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [conversation?.id]);

  const handleScroll = (e) => {
    if (e.target.scrollTop < 80 && hasMore && !loading) {
      onLoadMore();
    }
  };

  const typingArr = [...typingUsers].filter((id) => id !== currentUserId);

  if (loading) {
    return (
      <div className="message-list loading">
        <div className="messages-loading-spinner">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="message-list chat-wallpaper"
      ref={listRef}
      onScroll={handleScroll}
    >
      {hasMore && (
        <div className="load-more-btn-wrap">
          <button className="load-more-btn" onClick={onLoadMore}>
            Load older messages
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="messages-empty">
          <div className="messages-empty-inner">
            <span>🔒</span>
            <p>
              Messages are end-to-end encrypted. No one outside of this chat can
              read them.
            </p>
          </div>
        </div>
      )}

      <div className="messages-inner">
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showDivider = shouldShowDateDivider(prev, msg);
          // BUG FIX: Supabase join returns sender as object {id, ...}, not a flat sender_id field.
          // Always resolve the sender's id from both sender_id and sender.id for reliability.
          const getMsgSenderId = (m) => m.sender_id || m.sender?.id;
          const prevSameSender =
            prev &&
            getMsgSenderId(prev) === getMsgSenderId(msg) &&
            !shouldShowDateDivider(prev, msg) &&
            new Date(msg.created_at) - new Date(prev.created_at) < 60000;

          return (
            <React.Fragment key={msg.id}>
              {showDivider && (
                <div className="date-divider">
                  <span>{formatDateDivider(msg.created_at)}</span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwn={(msg.sender_id || msg.sender?.id) === currentUserId}
                grouped={prevSameSender}
                onReply={() => onReply(msg)}
                onDelete={() => onDelete(msg.id)}
                onReaction={(emoji) => onReaction(msg.id, emoji)}
                onMessageInfo={onMessageInfo}
                currentUserId={currentUserId}
                isGroup={conversation?.type === "group"}
              />
            </React.Fragment>
          );
        })}

        {typingArr.length > 0 && (
          <div className="typing-bubble">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
