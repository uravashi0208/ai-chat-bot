import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Box, Typography, IconButton, InputBase, Divider } from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { formatMessageTime } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { messagesApi } from "../../services/api";
import { getSocket } from "../../services/socket";
import * as socketService from "../../services/socket";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import MessageInfoModal from "./MessageInfoModal";

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { getTypingUsersForConversation, isUserBlocked } = useChat();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [msgInfo, setMsgInfo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const loadMessages = useCallback(
    async (before = undefined) => {
      try {
        const rawData = await messagesApi.getMessages(
          conversation.id,
          50,
          before,
        );
        const data = rawData.map((m) => ({
          ...m,
          sender_id: m.sender_id || m.sender?.id,
        }));
        if (before) setMessages((prev) => [...data, ...prev]);
        else setMessages(data);
        setHasMore(data.length === 50);
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setLoading(false);
      }
    },
    [conversation.id],
  );

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setReplyTo(null);
    loadMessages();
    socketService.joinConversation(conversation.id);
    socketService.markConversationRead(conversation.id);
  }, [conversation.id, loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = ({ conversationId, message }) => {
      if (conversationId !== conversation.id) return;
      const normalized = {
        ...message,
        sender_id: message.sender_id || message.sender?.id,
      };
      setMessages((prev) => {
        if (prev.find((m) => m.id === normalized.id)) return prev;
        const tempIndex = prev.findIndex(
          (m) =>
            typeof m.id === "string" &&
            m.id.startsWith("temp-") &&
            m.sender_id === normalized.sender_id &&
            m.content === normalized.content,
        );
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = normalized;
          return updated;
        }
        return [...prev, normalized];
      });
      socketService.markConversationRead(conversation.id);
    };

    const onEdited = ({ conversationId, message }) => {
      if (conversationId !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
    };

    const onDeleted = ({ conversationId, messageId }) => {
      if (conversationId !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, type: "deleted", content: null, is_deleted: true }
            : m,
        ),
      );
    };

    const onConversationRead = ({ conversationId, userId }) => {
      if (conversationId !== conversation.id) return;
      if (userId === user.id) return;
      const readAt = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id === user.id && m.status !== "read"
            ? { ...m, status: "read", read_at: readAt }
            : m,
        ),
      );
    };

    const onMessageStatus = ({ messageId, status, deliveredAt, readAt }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            status,
            ...(deliveredAt ? { delivered_at: deliveredAt } : {}),
            ...(readAt ? { read_at: readAt } : {}),
          };
        }),
      );
    };

    const onReaction = ({
      conversationId,
      messageId,
      userId,
      emoji,
      action,
    }) => {
      if (conversationId !== conversation.id) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions ? [...m.reactions] : [];
          if (action === "add") {
            if (
              !reactions.find((r) => r.user_id === userId && r.emoji === emoji)
            )
              reactions.push({ user_id: userId, emoji });
          } else {
            const idx = reactions.findIndex(
              (r) => r.user_id === userId && r.emoji === emoji,
            );
            if (idx > -1) reactions.splice(idx, 1);
          }
          return { ...m, reactions };
        }),
      );
    };

    socket.on("message:new", onNewMessage);
    socket.on("message:edited", onEdited);
    socket.on("message:deleted", onDeleted);
    socket.on("message:reaction", onReaction);
    socket.on("conversation:read", onConversationRead);
    socket.on("message:status", onMessageStatus);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("message:edited", onEdited);
      socket.off("message:deleted", onDeleted);
      socket.off("message:reaction", onReaction);
      socket.off("conversation:read", onConversationRead);
      socket.off("message:status", onMessageStatus);
    };
  }, [conversation.id, user.id]);

  const handleSend = useCallback(
    async ({ content, type = "text", mediaUrl, replyToId, messageId }) => {
      if (type === "edit") {
        socketService.editMessage({
          messageId,
          content,
          conversationId: conversation.id,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content, edited_at: new Date().toISOString() }
              : m,
          ),
        );
        return;
      }
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        content,
        type,
        media_url: mediaUrl,
        sender_id: user.id,
        sender: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          avatar_url: user.avatar_url,
        },
        reply_to: replyTo,
        created_at: new Date().toISOString(),
        status: "sending",
        reactions: [],
      };
      setMessages((prev) => [...prev, optimistic]);
      setReplyTo(null);
      try {
        socketService.sendMessage({
          conversationId: conversation.id,
          content,
          type,
          mediaUrl,
          replyToId: replyToId || replyTo?.id,
        });
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
        );
      }
    },
    [conversation.id, user, replyTo],
  );

  const handleDeleteMessage = useCallback(
    (messageId) => {
      socketService.deleteMessage({
        messageId,
        conversationId: conversation.id,
      });
    },
    [conversation.id],
  );

  const handleReaction = useCallback(
    (messageId, emoji) => {
      const msg = messages.find((m) => m.id === messageId);
      const hasReaction = msg?.reactions?.find(
        (r) => r.user_id === user.id && r.emoji === emoji,
      );
      if (hasReaction)
        socketService.removeReaction({
          messageId,
          conversationId: conversation.id,
          emoji,
        });
      else
        socketService.addReaction({
          messageId,
          conversationId: conversation.id,
          emoji,
        });
    },
    [conversation.id, messages, user.id],
  );

  const handleStar = useCallback(
    async (messageId, currentlyStarred) => {
      if (currentlyStarred)
        await messagesApi.unstar(conversation.id, messageId);
      else await messagesApi.star(conversation.id, messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_starred: !currentlyStarred } : m,
        ),
      );
    },
    [conversation.id],
  );

  const handleEdit = useCallback((message) => {
    setEditingMessage(message);
    setReplyTo(null);
  }, []);

  const handleForward = useCallback((message) => {
    // Forward handler - can be extended to show conversation picker
    console.log("Forward message:", message);
  }, []);

  const typingUsers = getTypingUsersForConversation(conversation.id);

  // Check if the other participant in a direct chat is blocked
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants?.find((p) => p.user?.id !== user?.id)
      : null;
  const isBlocked = otherParticipant
    ? isUserBlocked(otherParticipant.user?.id)
    : false;

  // ── In-chat search ──────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter(
        (m) =>
          !m.is_deleted &&
          m.type === "text" &&
          m.content?.toLowerCase().includes(q),
      )
      .slice()
      .reverse();
  }, [messages, searchQuery]);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Highlight matched text
  const highlight = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ color: "#25d366", fontWeight: 700 }}>
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Main chat area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <ChatHeader
          conversation={conversation}
          typingUsers={typingUsers}
          onBack={onBack}
          onSearchOpen={() => setSearchOpen(true)}
          onClearChat={() => setMessages([])}
        />
        <MessageList
          messages={messages}
          loading={loading}
          hasMore={hasMore}
          currentUserId={user.id}
          onLoadMore={() => {
            if (messages.length > 0) loadMessages(messages[0].created_at);
          }}
          onReply={setReplyTo}
          onDelete={handleDeleteMessage}
          onReaction={handleReaction}
          onStar={handleStar}
          onMessageInfo={setMsgInfo}
          onEdit={handleEdit}
          onForward={handleForward}
          typingUsers={typingUsers}
          conversation={conversation}
        />
        {isBlocked ? (
          <Box
            sx={{
              flexShrink: 0,
              bgcolor: "#f0f2f5",
              borderTop: "1px solid #e9edef",
              py: 2.5,
              px: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: "#8696a0",
                textAlign: "center",
              }}
            >
              🚫 You blocked this contact. Unblock to send messages.
            </Typography>
          </Box>
        ) : (
          <MessageInput
            onSend={handleSend}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            conversationId={conversation.id}
            editingMessage={editingMessage}
            onCancelEdit={() => setEditingMessage(null)}
          />
        )}
        {msgInfo && (
          <MessageInfoModal
            message={msgInfo}
            onClose={() => setMsgInfo(null)}
          />
        )}
      </Box>

      {/* Search Panel */}
      {searchOpen && (
        <Box
          sx={{
            width: { xs: "100%", md: 320 },
            position: { xs: "absolute", md: "relative" },
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: { xs: 100, md: "auto" },
            display: "flex",
            flexDirection: "column",
            bgcolor: "#111b21",
            borderLeft: "1px solid #2a3942",
            height: "100vh",
            flexShrink: 0,
          }}
        >
          {/* Search Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 1,
              bgcolor: "#202c33",
              minHeight: 60,
              flexShrink: 0,
            }}
          >
            <IconButton onClick={handleCloseSearch} sx={{ color: "#aebac1" }}>
              <CloseIcon />
            </IconButton>
            <Typography
              sx={{ color: "#e9edef", fontWeight: 600, fontSize: "1rem" }}
            >
              Search messages
            </Typography>
          </Box>

          {/* Search Input */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: "#111b21", flexShrink: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "#2a3942",
                borderRadius: "10px",
                px: 1.5,
                py: 0.75,
              }}
            >
              <SearchIcon sx={{ color: "#8696a0", fontSize: 18 }} />
              <InputBase
                inputRef={searchInputRef}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  flex: 1,
                  fontSize: "0.9rem",
                  color: "#e9edef",
                  "& input::placeholder": { color: "#8696a0" },
                }}
              />
              {searchQuery && (
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
                  sx={{ color: "#8696a0", p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: "#2a3942" }} />

          {/* Results */}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {searchQuery.trim() === "" ? (
              <Box sx={{ px: 3, pt: 4, textAlign: "center" }}>
                <SearchIcon sx={{ fontSize: 48, color: "#3b4a54", mb: 1 }} />
                <Typography sx={{ color: "#8696a0", fontSize: "0.85rem" }}>
                  Search for messages in this chat
                </Typography>
              </Box>
            ) : searchResults.length === 0 ? (
              <Box sx={{ px: 3, pt: 4, textAlign: "center" }}>
                <Typography sx={{ color: "#8696a0", fontSize: "0.85rem" }}>
                  No messages found
                </Typography>
              </Box>
            ) : (
              searchResults.map((msg) => {
                const dateStr = new Date(msg.created_at).toLocaleDateString(
                  "en-US",
                  {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  },
                );
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderBottom: "1px solid #2a3942",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#2a3942" },
                    }}
                  >
                    <Typography
                      sx={{ fontSize: "0.72rem", color: "#8696a0", mb: 0.4 }}
                    >
                      {dateStr}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.875rem",
                        color: "#e9edef",
                        lineHeight: 1.5,
                      }}
                    >
                      {highlight(msg.content, searchQuery.trim())}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
