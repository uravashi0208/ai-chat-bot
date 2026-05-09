import React, { useMemo } from "react";
import { Box, List, ListItemButton, Typography } from "@mui/material";
import {
  VolumeOff as VolumeOffIcon,
  AutoAwesome as AIIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  PushPin as PinIcon,
  Photo as PhotoIcon,
  Audiotrack as AudioIcon,
  Videocam as VideoIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../common/UserAvatar";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import {
  formatConversationTime,
  getConversationName,
  getConversationAvatar,
  getOtherParticipant,
} from "../../utils/helpers";

function MessageStatus({ status, isOwn }) {
  if (!isOwn) return null;
  const color = status === "read" ? "#53bdeb" : "#8696a0";
  if (status === "read" || status === "delivered")
    return <DoneAllIcon sx={{ fontSize: 15, color, flexShrink: 0 }} />;
  return <DoneIcon sx={{ fontSize: 15, color, flexShrink: 0 }} />;
}

function MediaPreviewIcon({ type }) {
  const sx = { fontSize: 14, color: "#8696a0", mr: 0.25 };
  if (type === "image") return <PhotoIcon sx={sx} />;
  if (type === "video") return <VideoIcon sx={sx} />;
  if (type === "audio") return <AudioIcon sx={sx} />;
  if (type === "document") return <FileIcon sx={sx} />;
  return null;
}

function AIChatItem({ isActive, onClick }) {
  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2,
        py: 1.25,
        gap: 1.5,
        borderBottom: "1px solid #f0f2f5",
        "&.Mui-selected": {
          bgcolor: "#f0f2f5",
          "&:hover": { bgcolor: "#eaeaea" },
        },
        "&:hover": { bgcolor: "#f5f6f6" },
      }}
    >
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AIIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: "#25d366",
            border: "2px solid #fff",
          }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.25,
          }}
        >
          <Typography
            sx={{ fontWeight: 600, fontSize: "0.9375rem", color: "#111b21" }}
          >
            AI Assistant
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#8696a0" }}>
            now
          </Typography>
        </Box>
        <Typography
          sx={{ color: "#8696a0", fontSize: "0.8125rem", fontStyle: "italic" }}
        >
          Ask me anything ✨
        </Typography>
      </Box>
    </ListItemButton>
  );
}

function ConvItem({
  conv,
  name,
  avatarUrl,
  online,
  isActive,
  unread,
  lastMsg,
  isOwnMsg,
  onClick,
}) {
  const previewContent = () => {
    if (!lastMsg) return "";
    if (lastMsg.is_deleted) return "🚫 This message was deleted";
    if (lastMsg.type && lastMsg.type !== "text") return lastMsg.type;
    return lastMsg.content || "";
  };

  const mediaType = lastMsg?.type !== "text" ? lastMsg?.type : null;

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2,
        py: 1,
        gap: 1.5,
        borderBottom: "1px solid #f0f2f5",
        alignItems: "center",
        "&:hover": { bgcolor: "#f5f6f6" },
        "&.Mui-selected": {
          bgcolor: "#f0f2f5",
          "&:hover": { bgcolor: "#eaeaea" },
        },
      }}
    >
      <UserAvatar name={name} src={avatarUrl} size={50} online={online} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Name + time */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.25,
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              color: "#111b21",
              fontSize: "0.9375rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "62%",
            }}
          >
            {name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            {conv.is_pinned && (
              <PinIcon
                sx={{
                  fontSize: 12,
                  color: "#8696a0",
                  transform: "rotate(45deg)",
                }}
              />
            )}
            {conv.is_muted && (
              <VolumeOffIcon sx={{ fontSize: 12, color: "#8696a0" }} />
            )}
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: unread > 0 ? "#25d366" : "#8696a0",
                fontWeight: unread > 0 ? 600 : 400,
              }}
            >
              {formatConversationTime(conv.last_message_at || conv.created_at)}
            </Typography>
          </Box>
        </Box>

        {/* Preview + badge */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flex: 1,
              minWidth: 0,
            }}
          >
            {lastMsg && (
              <MessageStatus status={lastMsg.status} isOwn={isOwnMsg} />
            )}
            {mediaType && !lastMsg?.is_deleted && (
              <MediaPreviewIcon type={mediaType} />
            )}
            <Typography
              sx={{
                color: unread > 0 ? "#111b21" : "#8696a0",
                fontSize: "0.8125rem",
                fontWeight: unread > 0 ? 500 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {previewContent()}
            </Typography>
          </Box>

          {unread > 0 && (
            <Box
              sx={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                px: 0.75,
                bgcolor: conv.is_muted ? "#c8c8c8" : "#25d366",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {unread > 99 ? "99+" : unread}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </ListItemButton>
  );
}

export default function ConversationList({
  searchQuery,
  activeTab,
  onSelect,
  onSelectAI,
  isAIActive,
}) {
  const {
    conversations,
    activeConversation,
    loading,
    isUserOnline,
    contactsMap,
  } = useChat();
  const { user } = useAuth();

  const filtered = useMemo(() => {
    let list = conversations;

    // Apply tab filter
    if (activeTab === "Unread") {
      list = list.filter((c) => (c.unread_count || 0) > 0);
    } else if (activeTab === "Favourites") {
      list = list.filter((c) => c.is_favourite || c.is_favorited);
    } else if (activeTab === "Groups") {
      list = list.filter((c) => c.type === "group");
    }

    // Apply search filter
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => {
      const name = getConversationName(c, user.id, contactsMap).toLowerCase();
      const lastMsg = c.last_message?.content?.toLowerCase() || "";
      return name.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, searchQuery, activeTab, user.id]);

  if (loading) return <LoadingSpinner />;

  const pinned = filtered.filter((c) => c.is_pinned);
  const all = filtered.filter((c) => !c.is_pinned);

  const renderConv = (conv) => {
    const isActive = activeConversation?.id === conv.id;
    const name = getConversationName(conv, user.id, contactsMap);
    const avatarUrl = getConversationAvatar(conv, user.id);
    const other = getOtherParticipant(conv, user.id);
    const online =
      conv.type === "direct" ? isUserOnline(other?.user?.id) : false;
    const lastMsg = conv.last_message;
    const isOwnMsg = lastMsg?.sender?.id === user.id;
    const unread = conv.unread_count || 0;
    return (
      <ConvItem
        key={conv.id}
        conv={conv}
        name={name}
        avatarUrl={avatarUrl}
        online={conv.type === "direct" ? online : undefined}
        isActive={isActive}
        unread={unread}
        lastMsg={lastMsg}
        isOwnMsg={isOwnMsg}
        onClick={() => onSelect(conv)}
      />
    );
  };

  return (
    <List disablePadding>
      <AIChatItem isActive={isAIActive} onClick={onSelectAI} />

      {filtered.length === 0 && !loading && (
        <EmptyState
          icon={
            activeTab === "Groups"
              ? "👥"
              : activeTab === "Unread"
                ? "✅"
                : activeTab === "Favourites"
                  ? "⭐"
                  : "💬"
          }
          title={
            searchQuery
              ? "No results found"
              : activeTab !== "All"
                ? `No ${activeTab} yet`
                : "No conversations yet"
          }
          subtitle={
            searchQuery
              ? "Try a different search term"
              : activeTab === "Groups"
                ? "Create a group using the + button above"
                : activeTab === "Unread"
                  ? "All caught up! No unread messages"
                  : activeTab === "Favourites"
                    ? "Mark conversations as favourite to see them here"
                    : "Start a new chat using the + button above"
          }
        />
      )}

      {pinned.length > 0 && (
        <>
          <Box
            sx={{
              px: 2.5,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <PinIcon
              sx={{
                fontSize: 11,
                color: "#8696a0",
                transform: "rotate(45deg)",
              }}
            />
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#8696a0",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Pinned
            </Typography>
          </Box>
          {pinned.map(renderConv)}
        </>
      )}

      {all.length > 0 && pinned.length > 0 && (
        <Box sx={{ px: 2.5, py: 0.75 }}>
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#8696a0",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            All
          </Typography>
        </Box>
      )}

      {all.map(renderConv)}

      {pinned.length === 0 &&
        all.length === 0 &&
        filtered.length > 0 &&
        filtered.map(renderConv)}
    </List>
  );
}
