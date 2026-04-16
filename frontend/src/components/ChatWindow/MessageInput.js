import React, { useState, useRef, useCallback, useEffect } from "react";
import * as socketService from "../../services/socket";
import "./MessageInput.css";

const EmojiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
  </svg>
);
const AttachIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);
const ReplyPreviewIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </svg>
);

const EMOJI_CATEGORIES = [
  {
    id: "recent",
    label: "⏱ Recent",
    emojis: ["😂", "❤️", "👍", "🔥", "😭", "🙏", "😍", "🥺", "✨", "💯"],
  },
  {
    id: "faces",
    label: "😀 Faces",
    emojis: [
      "😀",
      "😁",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😎",
      "🥳",
      "😏",
      "😒",
      "😞",
      "😔",
      "😟",
      "😕",
      "🙁",
      "😣",
      "😖",
      "😫",
      "😩",
      "🥱",
      "😴",
      "😌",
      "😛",
      "😜",
      "😝",
      "🤤",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🤧",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "🤯",
      "🤠",
      "🥸",
      "😎",
      "🤓",
      "🧐",
    ],
  },
  {
    id: "gestures",
    label: "👋 Gestures",
    emojis: [
      "👋",
      "🤚",
      "🖐",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝",
      "👍",
      "👎",
      "✊",
      "👊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "🫶",
      "🤲",
      "🤝",
      "🙏",
      "💅",
      "🤳",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🫀",
      "🫁",
      "🧠",
      "🦷",
      "🦴",
      "👀",
      "👁",
      "👅",
      "👄",
      "🫦",
    ],
  },
  {
    id: "hearts",
    label: "❤️ Hearts",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "☮️",
      "✝️",
      "☯️",
      "🫀",
      "💌",
      "💋",
      "💯",
      "🔴",
      "🟠",
      "🟡",
      "🟢",
      "🔵",
      "🟣",
      "⚫",
      "⚪",
      "🟤",
    ],
  },
  {
    id: "unique",
    label: "🪄 Unique",
    emojis: [
      "🫠",
      "🫣",
      "🫡",
      "🫢",
      "🫤",
      "🥹",
      "🫥",
      "🫨",
      "🩷",
      "🩵",
      "🩶",
      "🪸",
      "🫧",
      "🪬",
      "🧿",
      "🪩",
      "🫙",
      "🪭",
      "🪮",
      "🪇",
      "🪗",
      "🫸",
      "🫷",
      "🫳",
      "🫴",
      "🩻",
      "🩼",
      "🫵",
      "🪷",
      "🌸",
      "🫐",
      "🫒",
      "🫑",
      "🫚",
      "🫛",
      "🪺",
      "🪹",
      "🦤",
      "🪶",
      "🦭",
      "🪲",
      "🪳",
      "🪰",
      "🫎",
      "🪼",
      "🐦‍🔥",
    ],
  },
  {
    id: "activities",
    label: "🎮 Fun",
    emojis: [
      "🎮",
      "🕹",
      "🎲",
      "🎯",
      "🎳",
      "🎻",
      "🎸",
      "🥁",
      "🎺",
      "🎷",
      "🪗",
      "🎹",
      "🪘",
      "🎵",
      "🎶",
      "🎼",
      "🎤",
      "🎧",
      "📻",
      "🎙",
      "🎚",
      "🎛",
      "📺",
      "📷",
      "📸",
      "📹",
      "🎞",
      "📽",
      "🎬",
      "🔭",
      "🔬",
      "🧬",
      "💊",
      "💉",
      "🩺",
      "🩹",
      "🩻",
      "🧪",
      "🧫",
      "🧲",
      "🔋",
      "💡",
      "🔦",
      "🕯",
      "🪔",
      "💰",
      "💳",
      "🏆",
      "🥇",
      "🎖",
      "🏅",
    ],
  },
  {
    id: "nature",
    label: "🌿 Nature",
    emojis: [
      "🌸",
      "🌺",
      "🌻",
      "🌹",
      "🌷",
      "🌱",
      "🌿",
      "🍀",
      "🍁",
      "🍂",
      "🍃",
      "🌾",
      "🌵",
      "🎋",
      "🎍",
      "🍄",
      "🐚",
      "🪨",
      "🪵",
      "🌊",
      "🌈",
      "⭐",
      "🌙",
      "☀️",
      "🌤",
      "⛅",
      "🌦",
      "🌧",
      "⛈",
      "🌩",
      "❄️",
      "💧",
      "🌊",
      "🔥",
      "🌪",
      "🌫",
      "🌈",
      "🌍",
      "🌎",
      "🌏",
      "🪐",
      "💫",
      "⭐",
      "🌟",
      "✨",
      "☄️",
      "🌠",
    ],
  },
  {
    id: "food",
    label: "🍕 Food",
    emojis: [
      "🍕",
      "🍔",
      "🍟",
      "🌭",
      "🌮",
      "🌯",
      "🥙",
      "🧆",
      "🥚",
      "🍳",
      "🥘",
      "🍲",
      "🫕",
      "🥣",
      "🥗",
      "🍿",
      "🧂",
      "🥫",
      "🍱",
      "🍘",
      "🍙",
      "🍚",
      "🍛",
      "🍜",
      "🍝",
      "🍠",
      "🍢",
      "🍣",
      "🍤",
      "🍥",
      "🥮",
      "🍡",
      "🥟",
      "🥠",
      "🥡",
      "🍦",
      "🍧",
      "🍨",
      "🍩",
      "🍪",
      "🎂",
      "🍰",
      "🧁",
      "🥧",
      "🍫",
      "🍬",
      "🍭",
      "🍮",
      "🍯",
    ],
  },
];

export default function MessageInput({
  onSend,
  replyTo,
  onCancelReply,
  conversationId,
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeCategory, setActiveCategory] = useState("recent");
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.startTyping(conversationId);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketService.stopTyping(conversationId);
    }, 1500);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) {
        socketService.stopTyping(conversationId);
      }
    };
  }, [conversationId]);

  const handleChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ content: trimmed, type: "text" });
    setText("");
    setShowEmoji(false);
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    socketService.stopTyping(conversationId);
    inputRef.current?.focus();
  }, [text, onSend, conversationId]);

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="message-input-area">
      {/* Reply preview */}
      {replyTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content">
            <ReplyPreviewIcon />
            <div className="reply-preview-text">
              <span className="reply-preview-name">
                {replyTo.sender?.full_name}
              </span>
              <span className="reply-preview-msg truncate">
                {replyTo.type !== "text"
                  ? `📎 ${replyTo.type}`
                  : replyTo.content}
              </span>
            </div>
          </div>
          <button className="reply-cancel-btn" onClick={onCancelReply}>
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="emoji-panel">
          <div className="emoji-category-tabs">
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`emoji-tab ${activeCategory === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.id)}
                title={cat.label}
              >
                {cat.label.split(" ")[0]}
              </button>
            ))}
          </div>
          <div className="emoji-grid">
            {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map(
              (e) => (
                <button
                  key={e}
                  className="emoji-btn"
                  onClick={() => insertEmoji(e)}
                >
                  {e}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="input-row">
        <button
          className={`input-icon-btn ${showEmoji ? "active" : ""}`}
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emoji"
        >
          <EmojiIcon />
        </button>

        <button className="input-icon-btn" title="Attach">
          <AttachIcon />
        </button>

        <div className="input-box">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            className="msg-textarea"
          />
        </div>

        <button
          className={`send-btn ${hasText ? "visible" : ""}`}
          onClick={hasText ? handleSend : undefined}
          title={hasText ? "Send" : "Voice message"}
        >
          {hasText ? <SendIcon /> : <MicIcon />}
        </button>
      </div>
    </div>
  );
}
