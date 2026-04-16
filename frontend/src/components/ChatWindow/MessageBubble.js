import React, { useState, useRef } from "react";
import { formatMessageTime } from "../../utils/helpers";
import "./MessageBubble.css";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const CheckIcon = ({ status }) => {
  if (status === "sending")
    return (
      <svg viewBox="0 0 24 24" fill="#555a72" width="14" height="14">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  if (status === "sent")
    return (
      <svg viewBox="0 0 18 18" fill="#6b7194" width="14" height="14">
        <path d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076L8.97 15.17l-1.35-1.124-.001.002-3.20-2.665a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l3.877 3.229a.434.434 0 00.562-.016L17.47 5.644a.434.434 0 00-.076-.609z" />
      </svg>
    );
  if (status === "delivered" || status === "read") {
    const color = status === "read" ? "#a78bfa" : "#6b7194";
    return (
      <svg viewBox="0 0 18 18" fill={color} width="14" height="14">
        <path d="M17.394 5.035l-.57-.444a.434.434 0 00-.609.076L8.97 15.17l-4.08-3.397a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l4.873 4.057a.434.434 0 00.609-.076L17.47 5.644a.434.434 0 00-.076-.609z" />
        <path d="M12.395 5.035l-.57-.444a.434.434 0 00-.609.076L3.97 15.17l-1.5-1.248a.434.434 0 00-.609.076l-.44.571a.434.434 0 00.076.609l2.293 1.909a.434.434 0 00.609-.076L12.47 5.644a.434.434 0 00-.076-.609z" />
      </svg>
    );
  }
  return null;
};

const ReplyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);
const EmojiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
  </svg>
);

export default function MessageBubble({
  message,
  isOwn,
  grouped,
  onReply,
  onDelete,
  onReaction,
  onMessageInfo,
  currentUserId,
  isGroup,
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const hoverTimer = useRef(null);

  const isDeleted = message.is_deleted || message.type === "deleted";

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => setShowActions(true), 100);
  };
  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setShowActions(false);
    setShowEmojiPicker(false);
  };

  // Group reactions by emoji
  const reactionGroups = {};
  (message.reactions || []).forEach(({ emoji, user_id }) => {
    if (!reactionGroups[emoji])
      reactionGroups[emoji] = { count: 0, mine: false };
    reactionGroups[emoji].count++;
    if (user_id === currentUserId) reactionGroups[emoji].mine = true;
  });

  const hasReactions = Object.keys(reactionGroups).length > 0;

  return (
    <div
      className={`msg-row ${isOwn ? "own" : "other"} ${grouped ? "grouped" : ""} ${hasReactions ? "has-reactions" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Action bar */}
      {showActions && !isDeleted && (
        <div
          className={`msg-actions ${isOwn ? "actions-left" : "actions-right"}`}
        >
          <button
            className="msg-action-btn"
            title="React"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <EmojiIcon />
          </button>
          <button className="msg-action-btn" title="Reply" onClick={onReply}>
            <ReplyIcon />
          </button>
          {isOwn && (
            <button
              className="msg-action-btn danger"
              title="Delete"
              onClick={onDelete}
            >
              <TrashIcon />
            </button>
          )}
          {showEmojiPicker && (
            <div className="quick-reactions">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    onReaction(e);
                    setShowEmojiPicker(false);
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`msg-bubble ${isOwn ? "bubble-own" : "bubble-other"} ${grouped ? "bubble-grouped" : ""} ${isOwn ? "bubble-clickable" : ""}`}
        onClick={isOwn ? () => onMessageInfo && onMessageInfo(message) : undefined}
      >
        {/* Group sender name */}
        {!isOwn && isGroup && !grouped && message.sender && (
          <div
            className="msg-sender-name"
            style={{ color: getSenderColor(message.sender.id) }}
          >
            {message.sender.full_name}
          </div>
        )}

        {/* Reply preview */}
        {message.reply_to && !isDeleted && (
          <div className="msg-reply-preview">
            <div className="reply-sender">
              {message.reply_to.sender?.full_name}
            </div>
            <div className="reply-content truncate">
              {message.reply_to.content}
            </div>
          </div>
        )}

        {/* Content */}
        {isDeleted ? (
          <span className="msg-deleted">🚫 This message was deleted</span>
        ) : message.type === "image" ? (
          <div className="msg-image-wrap">
            <img src={message.media_url} alt="shared" className="msg-image" />
            {message.content && (
              <p className="msg-caption">{message.content}</p>
            )}
          </div>
        ) : (
          <p className="msg-text">{message.content}</p>
        )}

        {/* Footer */}
        <div className="msg-footer">
          {message.edited_at && <span className="msg-edited">edited</span>}
          <span className="msg-time">
            {formatMessageTime(message.created_at)}
          </span>
          {isOwn && <CheckIcon status={message.status} />}
        </div>

        {/* ── Reactions: float OUTSIDE bubble, pinned to bottom ── */}
        {hasReactions && (
          <div className="msg-reactions">
            {Object.entries(reactionGroups).map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                className={`reaction-chip ${mine ? "mine" : ""}`}
                onClick={() => onReaction(emoji)}
              >
                {emoji}
                {count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SENDER_COLORS = [
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fb923c",
  "#60a5fa",
  "#facc15",
];
function getSenderColor(id) {
  if (!id) return SENDER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}
