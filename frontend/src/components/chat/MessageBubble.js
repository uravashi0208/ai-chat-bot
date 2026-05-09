import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Box, Typography } from "@mui/material";
import {
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  Star as StarFilledIcon,
  StarBorder as StarOutlineIcon,
  DoneAll as DoneAllIcon,
  Done as DoneIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Info as InfoIcon,
  Forward as ForwardIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from "@mui/icons-material";
import { formatMessageTime } from "../../utils/helpers";
import { useAudioPlayer } from "../../context/AudioPlayerContext";

// WhatsApp-style audio bubble
function AudioBubble({ src, isOwn, sender }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);
  const { registerPlay, unregister } = useAudioPlayer();
  const waveBarCount = 30;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => {
      if (!dragging) setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    // When another audio stops this one externally
    const onPause = () => {
      setPlaying(false);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      unregister(audio);
    };
  }, [dragging, unregister]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      registerPlay(audio); // stops any other playing audio first
      audio.play();
      setPlaying(true);
    }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const accentColor = isOwn ? "#25d366" : "#53bdeb";
  const trackColor = isOwn ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.12)";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        py: 0.5,
        px: 0.25,
        minWidth: 220,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Avatar / mic icon */}
      <Box
        onClick={toggle}
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          bgcolor: isOwn ? "#25d366" : "#00a884",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "transform 0.1s",
          "&:active": { transform: "scale(0.93)" },
        }}
      >
        {playing ? (
          <PauseIcon sx={{ color: "#fff", fontSize: 22 }} />
        ) : (
          <PlayIcon sx={{ color: "#fff", fontSize: 24 }} />
        )}
      </Box>

      {/* Waveform + time */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Waveform bars */}
        <Box
          onClick={seek}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            height: 28,
            cursor: "pointer",
            mb: 0.25,
          }}
        >
          {Array.from({ length: waveBarCount }).map((_, i) => {
            const barProgress = i / waveBarCount;
            const filled = barProgress <= progress;
            // Pseudo-random bar heights for natural look
            const heights = [
              10, 14, 8, 18, 12, 22, 9, 16, 20, 11, 17, 13, 21, 8, 15, 19, 10,
              23, 12, 16, 9, 14, 20, 11, 18, 13, 22, 8, 17, 15,
            ];
            const h = heights[i % heights.length];
            return (
              <Box
                key={i}
                sx={{
                  width: "2.5px",
                  height: `${h}px`,
                  borderRadius: "2px",
                  bgcolor: filled ? accentColor : trackColor,
                  transition: "background-color 0.1s",
                  flexShrink: 0,
                }}
              />
            );
          })}
        </Box>

        {/* Time display */}
        <Typography
          sx={{ fontSize: "0.68rem", color: "#8696a0", lineHeight: 1 }}
        >
          {playing || currentTime > 0 ? fmt(currentTime) : fmt(duration)}
        </Typography>
      </Box>

      {/* Mic icon top right */}
      <Typography
        sx={{
          fontSize: "1rem",
          flexShrink: 0,
          alignSelf: "flex-start",
          mt: 0.25,
        }}
      >
        🎤
      </Typography>
    </Box>
  );
}

const SENDER_COLORS = [
  "#7c3aed",
  "#0d9488",
  "#db2777",
  "#2563eb",
  "#b45309",
  "#059669",
];
function getSenderColor(id) {
  if (!id) return SENDER_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return SENDER_COLORS[Math.abs(h) % SENDER_COLORS.length];
}

function MessageTick({ status, isOwn }) {
  const color = status === "read" ? "#53bdeb" : "rgba(0,0,0,0.35)";
  if (status === "sending")
    return (
      <ScheduleIcon
        sx={{ fontSize: 13, color: "rgba(0,0,0,0.35)", flexShrink: 0 }}
      />
    );
  if (status === "sent")
    return <DoneIcon sx={{ fontSize: 13, color, flexShrink: 0 }} />;
  if (status === "delivered" || status === "read")
    return <DoneAllIcon sx={{ fontSize: 13, color, flexShrink: 0 }} />;
  return null;
}

function ContextMenuPortal({
  open,
  onClose,
  isOwn,
  message,
  isDeleted,
  isStarred,
  onAction,
  bubbleRect,
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !bubbleRect) return null;

  const menuItems = [
    { id: "reply", label: "Reply", icon: <ReplyIcon sx={{ fontSize: 20 }} /> },
    {
      id: "star",
      label: isStarred ? "Unstar" : "Star",
      icon: <StarOutlineIcon sx={{ fontSize: 20 }} />,
    },
    {
      id: "forward",
      label: "Forward",
      icon: <ForwardIcon sx={{ fontSize: 20 }} />,
    },
    ...(message.type === "text" && !isDeleted
      ? [
          {
            id: "copy",
            label: "Copy",
            icon: <CopyIcon sx={{ fontSize: 20 }} />,
          },
        ]
      : []),
    ...(isOwn && !isDeleted && message.type === "text"
      ? [
          {
            id: "edit",
            label: "Edit",
            icon: <EditIcon sx={{ fontSize: 20 }} />,
          },
        ]
      : []),
    { id: "info", label: "Info", icon: <InfoIcon sx={{ fontSize: 20 }} /> },
    {
      id: "delete",
      label: "Delete",
      icon: <DeleteIcon sx={{ fontSize: 20 }} />,
      danger: true,
      divider: true,
    },
  ];

  const MENU_W = 200,
    ITEM_H = 48,
    PAD = 8;
  const MENU_H = menuItems.length * ITEM_H + PAD;
  const GAP = 6,
    VP_H = window.innerHeight,
    VP_W = window.innerWidth;
  const spaceBelow = VP_H - bubbleRect.bottom;
  const showBelow = spaceBelow >= MENU_H + GAP || spaceBelow >= bubbleRect.top;
  const menuTop = showBelow
    ? bubbleRect.bottom + GAP
    : bubbleRect.top - MENU_H - GAP;
  let menuLeft = isOwn ? bubbleRect.right - MENU_W : bubbleRect.left;
  menuLeft = Math.max(8, Math.min(menuLeft, VP_W - MENU_W - 8));

  return ReactDOM.createPortal(
    <>
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1290,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          bgcolor: "rgba(0,0,0,0.4)",
        }}
      />
      <Box
        onClick={onClose}
        sx={{
          position: "fixed",
          top: bubbleRect.top - 4,
          left: bubbleRect.left - 4,
          width: bubbleRect.width + 8,
          height: bubbleRect.height + 8,
          zIndex: 1292,
          cursor: "default",
          borderRadius: 2,
        }}
      />
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "fixed",
          top: menuTop,
          left: menuLeft,
          width: MENU_W,
          zIndex: 1300,
          bgcolor: "#fff",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 6px 32px rgba(0,0,0,0.18)",
          animation: "pop 0.14s cubic-bezier(0.34,1.56,0.64,1)",
          "@keyframes pop": {
            from: { opacity: 0, transform: "scale(0.9)" },
            to: { opacity: 1, transform: "scale(1)" },
          },
        }}
      >
        {menuItems.map((item) => (
          <React.Fragment key={item.id}>
            {item.divider && (
              <Box sx={{ height: "0.5px", bgcolor: "#e9edef" }} />
            )}
            <Box
              component="button"
              onClick={() => {
                onAction(item.id);
                onClose();
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                px: 2,
                py: 1.25,
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.9375rem",
                color: item.danger ? "#ef4444" : "#111b21",
                textAlign: "left",
                "&:hover": { bgcolor: "#f5f6f6" },
              }}
            >
              <span>{item.label}</span>
              <Box
                sx={{
                  color: item.danger ? "#ef4444" : "#8696a0",
                  display: "flex",
                  ml: 2,
                }}
              >
                {item.icon}
              </Box>
            </Box>
          </React.Fragment>
        ))}
      </Box>
    </>,
    document.body,
  );
}

export default function MessageBubble({
  message,
  isOwn,
  grouped,
  onReply,
  onDelete,
  onReaction,
  onMessageInfo,
  onStar,
  onForward,
  onEdit,
  currentUserId,
  isGroup,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [bubbleRect, setBubbleRect] = useState(null);
  const [isStarred, setIsStarred] = useState(message.is_starred || false);
  const [starLoading, setStarLoading] = useState(false);
  const bubbleRef = useRef(null);

  const isDeleted = message.is_deleted || message.type === "deleted";

  const openMenu = () => {
    if (bubbleRef.current) {
      setBubbleRect(bubbleRef.current.getBoundingClientRect());
      setShowMenu(true);
    }
  };

  const handleStarToggle = async () => {
    if (starLoading) return;
    setStarLoading(true);
    try {
      await onStar(message.id, isStarred);
      setIsStarred((p) => !p);
    } catch {
    } finally {
      setStarLoading(false);
    }
  };

  const handleAction = (action) => {
    if (action === "reply") onReply?.();
    if (action === "star") handleStarToggle();
    if (action === "info") onMessageInfo?.(message);
    if (action === "delete") onDelete?.();
    if (action === "copy")
      navigator.clipboard?.writeText(message.content || "").catch(() => {});
    if (action === "forward") onForward?.(message);
    if (action === "edit") onEdit?.(message);
  };

  const reactionGroups = {};
  (message.reactions || []).forEach(({ emoji, user_id }) => {
    if (!reactionGroups[emoji])
      reactionGroups[emoji] = { count: 0, mine: false };
    reactionGroups[emoji].count++;
    if (user_id === currentUserId) reactionGroups[emoji].mine = true;
  });
  const hasReactions = Object.keys(reactionGroups).length > 0;

  // WhatsApp bubble colors
  const bubbleBg = isOwn ? "#d9fdd3" : "#ffffff";
  const bubbleRadius = isOwn
    ? grouped
      ? "8px 2px 2px 8px"
      : "8px 8px 2px 8px"
    : grouped
      ? "2px 8px 8px 2px"
      : "2px 8px 8px 8px";

  const DotBtn = () => (
    <Box
      component="button"
      onClick={openMenu}
      sx={{
        width: 24,
        height: 24,
        border: "none",
        bgcolor: "transparent",
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#8696a0",
        alignSelf: "flex-start",
        mt: 0.5,
        "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
        opacity: 0,
        ".wa-msg-row:hover &": { opacity: 1 },
      }}
    >
      <MoreVertIcon sx={{ fontSize: 16 }} />
    </Box>
  );

  return (
    <>
      <ContextMenuPortal
        open={showMenu}
        onClose={() => setShowMenu(false)}
        isOwn={isOwn}
        message={message}
        isDeleted={isDeleted}
        isStarred={isStarred}
        onAction={handleAction}
        bubbleRect={bubbleRect}
      />

      <Box
        className="wa-msg-row"
        sx={{
          display: "flex",
          justifyContent: isOwn ? "flex-end" : "flex-start",
          alignItems: "flex-start",
          gap: 0.5,
          px: 2,
          pb: hasReactions ? 2.5 : grouped ? 0.2 : 0.6,
          pt: grouped ? 0.1 : 0.4,
          position: "relative",
          "&:hover .wa-dot-btn": { opacity: 1 },
        }}
      >
        {isOwn && (
          <Box
            className="wa-dot-btn"
            sx={{ opacity: 0, transition: "opacity 0.15s" }}
          >
            <DotBtn />
          </Box>
        )}

        {/* Bubble */}
        <Box
          ref={bubbleRef}
          sx={{
            maxWidth: { xs: "78%", sm: "65%", md: "58%" },
            bgcolor: bubbleBg,
            borderRadius: bubbleRadius,
            px: message.type === "image" ? 0 : 1.25,
            pt: message.type === "image" ? 0 : 0.625,
            pb: 0.375,
            position: "relative",
            boxShadow: "0 1px 2px rgba(0,0,0,0.10)",
            overflow: message.type === "image" ? "hidden" : "visible",
            zIndex: showMenu ? 1295 : "auto",
          }}
        >
          {/* Group sender name */}
          {!isOwn && isGroup && !grouped && message.sender && (
            <Typography
              sx={{
                fontWeight: 600,
                color: getSenderColor(message.sender.id),
                display: "block",
                mb: 0.2,
                fontSize: "0.8rem",
              }}
            >
              {message.sender.full_name}
            </Typography>
          )}

          {/* Reply preview */}
          {message.reply_to && !isDeleted && (
            <Box
              sx={{
                bgcolor: "rgba(0,0,0,0.05)",
                borderLeft: "4px solid",
                borderColor: isOwn ? "#00a884" : "#00a884",
                borderRadius: "0 6px 6px 0",
                px: 1,
                py: 0.5,
                mb: 0.5,
              }}
            >
              <Typography
                sx={{
                  color: "#00a884",
                  fontWeight: 600,
                  display: "block",
                  fontSize: "0.75rem",
                }}
              >
                {message.reply_to.sender?.full_name}
              </Typography>
              <Typography
                noWrap
                sx={{ color: "#54656f", display: "block", fontSize: "0.8rem" }}
              >
                {message.reply_to.content}
              </Typography>
            </Box>
          )}

          {/* Message content */}
          {isDeleted ? (
            <Typography
              variant="body2"
              sx={{ color: "#8696a0", fontStyle: "italic" }}
            >
              🚫 This message was deleted
            </Typography>
          ) : message.type === "image" ? (
            <Box>
              <Box
                component="img"
                src={message.media_url}
                alt="shared"
                sx={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: 300,
                  objectFit: "cover",
                }}
              />
              {message.content && (
                <Typography
                  variant="body2"
                  sx={{
                    px: 1.25,
                    pt: 0.625,
                    pb: 0.25,
                    color: "#111b21",
                    fontSize: "0.875rem",
                  }}
                >
                  {message.content}
                </Typography>
              )}
            </Box>
          ) : message.type === "video" ? (
            <Box sx={{ overflow: "hidden" }}>
              <Box
                component="video"
                src={message.media_url}
                controls
                sx={{ display: "block", maxWidth: "100%", maxHeight: 260 }}
              />
              {message.content && (
                <Typography
                  variant="body2"
                  sx={{ px: 1.25, pt: 0.625, color: "#111b21" }}
                >
                  {message.content}
                </Typography>
              )}
            </Box>
          ) : message.type === "audio" ? (
            <AudioBubble
              src={message.media_url}
              isOwn={isOwn}
              sender={message.sender}
            />
          ) : message.type === "document" ? (
            <Box
              component="a"
              href={message.media_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 1.5,
                p: 1,
                mb: 0.375,
                textDecoration: "none",
                color: "inherit",
                "&:hover": { bgcolor: "rgba(0,0,0,0.07)" },
              }}
            >
              <Typography sx={{ fontSize: "1.5rem" }}>📄</Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    display: "block",
                    fontWeight: 600,
                    color: "#111b21",
                    fontSize: "0.8rem",
                  }}
                >
                  {message.media_url
                    ? decodeURIComponent(
                        message.media_url.split("/").pop().split("?")[0],
                      ).replace(/^\d+_/, "")
                    : "Document"}
                </Typography>
                <Typography sx={{ color: "#8696a0", fontSize: "0.72rem" }}>
                  Tap to open
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#111b21",
                fontSize: "0.9375rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                pr: 2.5,
              }}
            >
              {message.content}
            </Typography>
          )}

          {/* Meta (time + tick) */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.4,
              mt: 0.2,
              px: message.type === "image" ? 0.75 : 0,
              pb: message.type === "image" ? 0.375 : 0,
            }}
          >
            {isStarred && (
              <StarFilledIcon sx={{ fontSize: 10, color: "#f59e0b" }} />
            )}
            {message.edited_at && (
              <Typography sx={{ color: "#8696a0", fontSize: "0.65rem" }}>
                edited
              </Typography>
            )}
            <Typography sx={{ color: "#8696a0", fontSize: "0.7rem" }}>
              {formatMessageTime(message.created_at)}
            </Typography>
            {isOwn && <MessageTick status={message.status} isOwn={isOwn} />}
          </Box>

          {/* Reactions */}
          {hasReactions && (
            <Box
              sx={{
                position: "absolute",
                bottom: -18,
                [isOwn ? "right" : "left"]: 8,
                display: "flex",
                gap: 0.5,
                zIndex: 5,
              }}
            >
              {Object.entries(reactionGroups).map(
                ([emoji, { count, mine }]) => (
                  <Box
                    key={emoji}
                    component="button"
                    onClick={() => onReaction(emoji)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: mine ? "rgba(0,168,132,0.12)" : "#fff",
                      border: `1px solid ${mine ? "rgba(0,168,132,0.3)" : "rgba(0,0,0,0.1)"}`,
                      borderRadius: 3,
                      px: 0.75,
                      py: 0.25,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      color: "#111b21",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    {emoji}
                    {count > 1 && (
                      <span style={{ fontSize: "0.7rem", color: "#8696a0" }}>
                        {count}
                      </span>
                    )}
                  </Box>
                ),
              )}
            </Box>
          )}
        </Box>

        {!isOwn && (
          <Box
            className="wa-dot-btn"
            sx={{ opacity: 0, transition: "opacity 0.15s" }}
          >
            <DotBtn />
          </Box>
        )}
      </Box>
    </>
  );
}
