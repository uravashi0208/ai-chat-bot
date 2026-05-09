import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Drawer,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Call as AudioCallIcon,
  Videocam as VideoCallIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  CheckBox as SelectIcon,
  Timer as DisappearIcon,
  Block as BlockIcon,
  CleaningServices as ClearIcon,
  Delete as DeleteIcon,
  Flag as ReportIcon,
  Close as CloseIcon,
  PushPin as PinIcon,
  Favorite as FavIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import UserAvatar from "../common/UserAvatar";
import ContactProfile from "./ContactProfile";
import {
  getConversationName,
  getConversationAvatar,
  getOtherParticipant,
  formatLastSeen,
} from "../../utils/helpers";
import { conversationsApi, usersApi } from "../../services/api";

export default function ChatHeader({
  conversation,
  typingUsers,
  onBack,
  onSearchOpen,
  onClearChat,
}) {
  const { user } = useAuth();
  const {
    isUserOnline,
    setConversations,
    blockUser,
    unblockUser,
    isUserBlocked,
    contactsMap,
    updateContactNickname,
  } = useChat();
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [disappearDialog, setDisappearDialog] = useState(false);
  const [disappearDuration, setDisappearDuration] = useState("off");
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [clearDialog, setClearDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });

  const name = getConversationName(conversation, user.id, contactsMap);
  const avatarUrl = getConversationAvatar(conversation, user.id);
  const other = getOtherParticipant(conversation, user.id);
  const online =
    conversation.type === "direct" ? isUserOnline(other?.user?.id) : false;
  const isMuted = conversation.is_muted;
  const isPinned = conversation.is_pinned;
  const isFavourite = conversation.is_favourite;

  const typingArr = useMemo(() => [...(typingUsers || [])], [typingUsers]);
  const isGroup = conversation.type === "group";
  const isBlocked = !isGroup && isUserBlocked(other?.user?.id);

  let statusText;
  if (isBlocked) {
    statusText = ""; // WhatsApp hides last seen when blocked
  } else if (typingArr.length > 0) {
    statusText = isGroup ? `${typingArr.length} typing…` : "typing…";
  } else if (isGroup) {
    const members = conversation.participants
      ?.map((p) => p.user?.full_name?.split(" ")[0])
      .filter(Boolean)
      .join(", ");
    statusText =
      members || `${conversation.participants?.length || 0} participants`;
  } else {
    statusText = formatLastSeen(other?.user?.last_seen, online);
  }
  const isTyping = typingArr.length > 0;

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  // Update local conversation state helper
  const patchConv = (patch) => {
    if (setConversations) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, ...patch } : c)),
      );
    }
  };

  const handleMute = async () => {
    setMenuAnchor(null);
    try {
      await conversationsApi.muteConversation(conversation.id, !isMuted);
      patchConv({ is_muted: !isMuted });
      showSnack(isMuted ? "Notifications unmuted" : "Notifications muted");
    } catch {
      showSnack("Failed", "error");
    }
  };

  const handlePin = async () => {
    setMenuAnchor(null);
    try {
      await conversationsApi.pinConversation(conversation.id, !isPinned);
      patchConv({ is_pinned: !isPinned });
      showSnack(isPinned ? "Unpinned" : "Chat pinned");
    } catch {
      showSnack("Failed", "error");
    }
  };

  const handleFavourite = async () => {
    setMenuAnchor(null);
    try {
      await conversationsApi.favouriteConversation(
        conversation.id,
        !isFavourite,
      );
      patchConv({ is_favourite: !isFavourite });
      showSnack(
        isFavourite ? "Removed from favourites" : "Added to favourites",
      );
    } catch {
      showSnack("Failed", "error");
    }
  };

  const handleBlock = async () => {
    setMenuAnchor(null);
    const targetId = other?.user?.id;
    if (!targetId) return;
    try {
      await blockUser(targetId, "Blocked from chat");
      showSnack("Contact blocked");
    } catch {
      showSnack("Failed to block", "error");
    }
  };

  const handleUnblock = async () => {
    setMenuAnchor(null);
    const targetId = other?.user?.id;
    if (!targetId) return;
    try {
      await unblockUser(targetId);
      showSnack("Contact unblocked");
    } catch {
      showSnack("Failed to unblock", "error");
    }
  };

  const handleClearChat = async () => {
    setClearDialog(false);
    try {
      await conversationsApi.clearChat(conversation.id);
      // Immediately clear messages in the chat window
      onClearChat?.();
      // Clear last_message preview in the sidebar for this conversation only
      patchConv({ last_message: null, last_message_id: null, unread_count: 0 });
      showSnack("Chat cleared");
    } catch {
      showSnack("Failed", "error");
    }
  };

  const handleDeleteConversation = async () => {
    setDeleteDialog(false);
    try {
      await conversationsApi.deleteConversation(conversation.id);
      patchConv({ _deleted: true });
      showSnack("Chat deleted");
      if (onBack) onBack();
    } catch {
      showSnack("Failed", "error");
    }
  };

  const handleDisappear = async () => {
    setDisappearDialog(false);
    try {
      await conversationsApi.setDisappearingMessages(
        conversation.id,
        disappearDuration,
      );
      showSnack(
        disappearDuration === "off"
          ? "Disappearing messages off"
          : `Messages disappear after ${disappearDuration}`,
      );
    } catch {
      showSnack("Failed", "error");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportDialog(false);
    try {
      const targetId = other?.user?.id || conversation.id;
      await usersApi.reportUser(targetId, reportReason);
      showSnack("Report submitted");
    } catch {
      showSnack("Failed", "error");
    }
  };

  const iconBtnSx = {
    color: "#54656f",
    width: 38,
    height: 38,
    "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
  };

  const menuItems = [
    {
      label: "Contact info",
      icon: <InfoIcon sx={{ fontSize: 20 }} />,
      action: () => {
        setMenuAnchor(null);
        setProfileOpen(true);
      },
    },
    {
      label: "Search",
      icon: <SearchIcon sx={{ fontSize: 20 }} />,
      action: () => {
        setMenuAnchor(null);
        onSearchOpen?.();
      },
    },
    {
      label: isMuted ? "Unmute notifications" : "Mute notifications",
      icon: isMuted ? (
        <UnmuteIcon sx={{ fontSize: 20 }} />
      ) : (
        <MuteIcon sx={{ fontSize: 20 }} />
      ),
      action: handleMute,
      hasArrow: false,
    },
    {
      label: "Disappearing messages",
      icon: <DisappearIcon sx={{ fontSize: 20 }} />,
      action: () => {
        setMenuAnchor(null);
        setDisappearDialog(true);
      },
      hasArrow: true,
    },
    {
      label: "Close chat",
      icon: <CloseIcon sx={{ fontSize: 20 }} />,
      action: () => {
        setMenuAnchor(null);
        onBack?.();
      },
    },
    { divider: true },
    ...(!isGroup
      ? [
          {
            label: "Report",
            icon: <ReportIcon sx={{ fontSize: 20 }} />,
            action: () => {
              setMenuAnchor(null);
              setReportDialog(true);
            },
          },
          isBlocked
            ? {
                label: "Unblock",
                icon: <BlockIcon sx={{ fontSize: 20 }} />,
                action: handleUnblock,
              }
            : {
                label: "Block",
                icon: <BlockIcon sx={{ fontSize: 20 }} />,
                action: handleBlock,
              },
        ]
      : []),
    {
      label: "Clear chat",
      icon: <ClearIcon sx={{ fontSize: 20 }} />,
      action: () => {
        setMenuAnchor(null);
        setClearDialog(true);
      },
      danger: true,
    },
    {
      label: "Delete chat",
      icon: <DeleteIcon sx={{ fontSize: 20 }} />,
      action: () => {
        setMenuAnchor(null);
        setDeleteDialog(true);
      },
      danger: true,
    },
  ];

  return (
    <>
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "#f0f2f5",
          borderBottom: "1px solid #e9edef",
          minHeight: 60,
          flexShrink: 0,
        }}
      >
        <IconButton
          size="small"
          onClick={onBack}
          sx={{ display: { md: "none" }, color: "#54656f", mr: 0 }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box
          onClick={() => setProfileOpen(true)}
          sx={{
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <UserAvatar
            name={name}
            src={isBlocked ? null : avatarUrl}
            size={42}
            online={
              conversation.type === "direct" && !isBlocked ? online : undefined
            }
          />
        </Box>

        <Box
          onClick={() => setProfileOpen(true)}
          sx={{ flex: 1, minWidth: 0, cursor: "pointer", ml: 1 }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.9375rem",
              color: "#111b21",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.35,
            }}
          >
            {isPinned && "📌 "}
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.78rem",
              color: isTyping ? "#00a884" : online ? "#00a884" : "#8696a0",
              fontStyle: isTyping ? "italic" : "normal",
              lineHeight: 1,
              transition: "color 0.2s",
            }}
          >
            {statusText}
          </Typography>
        </Box>

        <Tooltip title="Video call">
          <IconButton size="small" sx={iconBtnSx}>
            <VideoCallIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Audio call">
          <IconButton size="small" sx={iconBtnSx}>
            <AudioCallIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Search">
          <IconButton size="small" onClick={onSearchOpen} sx={iconBtnSx}>
            <SearchIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="More">
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={iconBtnSx}
          >
            <MoreVertIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 3-dot Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            bgcolor: "#202c33",
            color: "#e9edef",
            minWidth: 220,
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
            borderRadius: 1.5,
          },
        }}
      >
        {menuItems.map((item, i) =>
          item.divider ? (
            <Divider
              key={i}
              sx={{ borderColor: "rgba(255,255,255,0.08)", my: 0.5 }}
            />
          ) : (
            <MenuItem
              key={item.label}
              onClick={item.action}
              sx={{
                py: 1.25,
                px: 2,
                gap: 2,
                color: item.danger ? "#ef4444" : "#e9edef",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                fontSize: "0.9rem",
              }}
            >
              <Box
                sx={{
                  color: item.danger ? "#ef4444" : "#aebac1",
                  display: "flex",
                }}
              >
                {item.icon}
              </Box>
              <Box sx={{ flex: 1 }}>{item.label}</Box>
              {item.hasArrow && (
                <Box sx={{ color: "#aebac1", fontSize: 12 }}>›</Box>
              )}
            </MenuItem>
          ),
        )}
      </Menu>

      {/* Disappearing Messages Dialog */}
      <Dialog
        open={disappearDialog}
        onClose={() => setDisappearDialog(false)}
        PaperProps={{
          sx: { bgcolor: "#202c33", color: "#e9edef", minWidth: 320 },
        }}
      >
        <DialogTitle sx={{ color: "#e9edef" }}>
          Disappearing messages
        </DialogTitle>
        <DialogContent>
          <RadioGroup
            value={disappearDuration}
            onChange={(e) => setDisappearDuration(e.target.value)}
          >
            {["off", "24 hours", "7 days", "90 days"].map((d) => (
              <FormControlLabel
                key={d}
                value={d}
                control={
                  <Radio
                    sx={{
                      color: "#00a884",
                      "&.Mui-checked": { color: "#00a884" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: "#e9edef" }}>
                    {d === "off" ? "Off" : d}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDisappearDialog(false)}
            sx={{ color: "#aebac1" }}
          >
            Cancel
          </Button>
          <Button onClick={handleDisappear} sx={{ color: "#00a884" }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        PaperProps={{
          sx: { bgcolor: "#202c33", color: "#e9edef", minWidth: 340 },
        }}
      >
        <DialogTitle sx={{ color: "#e9edef" }}>Report {name}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#aebac1", mb: 2, fontSize: "0.875rem" }}>
            Tell us why you're reporting this contact. Your report will remain
            anonymous.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Describe the reason..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#e9edef",
                "& fieldset": { borderColor: "#3b4a54" },
                "&:hover fieldset": { borderColor: "#00a884" },
              },
              "& textarea::placeholder": { color: "#8696a0" },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReportDialog(false)}
            sx={{ color: "#aebac1" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReport}
            sx={{ color: "#ef4444" }}
            disabled={!reportReason.trim()}
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Chat Confirm */}
      <Dialog
        open={clearDialog}
        onClose={() => setClearDialog(false)}
        PaperProps={{ sx: { bgcolor: "#202c33", color: "#e9edef" } }}
      >
        <DialogTitle sx={{ color: "#e9edef" }}>Clear chat?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#aebac1" }}>
            All messages will be permanently cleared. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setClearDialog(false)}
            sx={{ color: "#aebac1" }}
          >
            Cancel
          </Button>
          <Button onClick={handleClearChat} sx={{ color: "#ef4444" }}>
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Conversation Confirm */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{ sx: { bgcolor: "#202c33", color: "#e9edef" } }}
      >
        <DialogTitle sx={{ color: "#e9edef" }}>Delete chat?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#aebac1" }}>
            This chat will be permanently deleted for you. This cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog(false)}
            sx={{ color: "#aebac1" }}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteConversation} sx={{ color: "#ef4444" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Profile Drawer */}
      <Drawer
        anchor="right"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100vw", sm: 400 }, bgcolor: "#f0f2f5" },
        }}
      >
        <ContactProfile
          conversation={conversation}
          other={other}
          name={name}
          avatarUrl={avatarUrl}
          online={online}
          onClose={() => setProfileOpen(false)}
          onAudioCall={() => setProfileOpen(false)}
          onVideoCall={() => setProfileOpen(false)}
          onNicknameSaved={updateContactNickname}
        />
      </Drawer>

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
