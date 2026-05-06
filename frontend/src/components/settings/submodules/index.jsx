import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Switch,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Divider,
  alpha,
  Select,
  MenuItem,
  InputBase,
  LinearProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
  Campaign as BroadcastIcon,
  Add as AddIcon,
  QrCode as QrCodeIcon,
  Devices as DevicesIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Notifications as NotifIcon,
  Storage as StorageIcon,
  Help as HelpIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useChatPrefs } from "../../../context/ChatPrefsContext";
import {
  messagesApi,
  userPrefsApi,
  broadcastApi,
  devicesApi,
  privacyApi,
} from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { formatMessageTime } from "../../../utils/helpers";

function SubShell({ title, onClose, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.sidebar",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.75,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "background.elevated",
          borderBottom: "1px solid",
          borderColor: "divider",
          minHeight: 60,
          flexShrink: 0,
        }}
      >
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "text.secondary" }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, fontSize: "1.05rem", color: "text.primary" }}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>{children}</Box>
    </Box>
  );
}

// ─── Starred Messages ────────────────────────────────────────────────────────
export function StarredMessages({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi
      .getStarred()
      .then((d) => setMessages(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unstar = async (id) => {
    await messagesApi.unstarById(id).catch(() => {});
    setMessages((p) => p.filter((m) => m.id !== id));
  };

  return (
    <SubShell title="Starred Messages" onClose={onClose}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} sx={{ color: "primary.main" }} />
        </Box>
      ) : messages.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, px: 3 }}>
          <StarIcon
            sx={{ fontSize: 48, color: "text.disabled", opacity: 0.4, mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No starred messages
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Star messages to save them here
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
              }}
            >
              <StarIcon
                sx={{
                  fontSize: 16,
                  color: "warning.main",
                  mt: 0.5,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.light",
                    fontWeight: 600,
                    display: "block",
                  }}
                >
                  {msg.sender?.full_name || "You"}
                </Typography>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ color: "text.primary" }}
                >
                  {msg.content || `[${msg.type}]`}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {formatMessageTime(msg.created_at)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => unstar(msg.id)}
                sx={{ color: "text.disabled", flexShrink: 0 }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </List>
      )}
    </SubShell>
  );
}

// ─── Broadcast Messages ──────────────────────────────────────────────────────
export function BroadcastMessages({ onClose }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    broadcastApi
      .list()
      .then((d) => setBroadcasts(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const b = await broadcastApi.create({ name: name.trim() });
      setBroadcasts((p) => [b, ...p]);
      setName("");
      setCreating(false);
    } catch {}
  };

  return (
    <SubShell title="Broadcast Messages" onClose={onClose}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {creating ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              autoFocus
              placeholder="Broadcast name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <IconButton onClick={create} sx={{ color: "primary.main" }}>
              <CheckIcon />
            </IconButton>
            <IconButton
              onClick={() => setCreating(false)}
              sx={{ color: "text.secondary" }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
        ) : (
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => setCreating(true)}
            sx={{
              borderColor: alpha("#00a884", 0.4),
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: alpha("#00a884", 0.08),
              },
            }}
          >
            New Broadcast
          </Button>
        )}
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} sx={{ color: "primary.main" }} />
        </Box>
      ) : broadcasts.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <BroadcastIcon
            sx={{ fontSize: 48, color: "text.disabled", opacity: 0.4, mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No broadcasts yet
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {broadcasts.map((b) => (
            <ListItemButton
              key={b.id}
              sx={{
                px: 2,
                py: 1.25,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  bgcolor: alpha("#3b82f6", 0.12),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1.75,
                  flexShrink: 0,
                }}
              >
                <BroadcastIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
              </Box>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    {b.name}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {b.recipient_count || 0} recipients
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </SubShell>
  );
}

// ─── Linked Devices ──────────────────────────────────────────────────────────
export function LinkedDevices({ onClose }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    devicesApi
      .list()
      .then((d) => setDevices(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateQr = async () => {
    setQrLoading(true);
    try {
      const data = await devicesApi.generateQr();
      setQrCode(data.qrCode || data.qr_code);
    } catch {
    } finally {
      setQrLoading(false);
    }
  };

  const removeDevice = async (id) => {
    await devicesApi.remove(id).catch(() => {});
    setDevices((p) => p.filter((d) => d.id !== id));
  };

  return (
    <SubShell title="Linked Devices" onClose={onClose}>
      {/* QR section */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        {qrCode ? (
          <Box>
            <Box
              component="img"
              src={qrCode}
              alt="QR"
              sx={{
                width: 180,
                height: 180,
                borderRadius: 2,
                mb: 1.5,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block" }}
            >
              Scan with your phone to link a device
            </Typography>
            <Button
              size="small"
              onClick={() => setQrCode(null)}
              sx={{ mt: 1, color: "text.secondary", textTransform: "none" }}
            >
              Close QR
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            startIcon={
              qrLoading ? <CircularProgress size={16} /> : <QrCodeIcon />
            }
            onClick={generateQr}
            disabled={qrLoading}
            sx={{
              borderColor: alpha("#00a884", 0.4),
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: alpha("#00a884", 0.08),
              },
            }}
          >
            {qrLoading ? "Generating…" : "Link a Device"}
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} sx={{ color: "primary.main" }} />
        </Box>
      ) : devices.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 5 }}>
          <DevicesIcon
            sx={{ fontSize: 48, color: "text.disabled", opacity: 0.4, mb: 1.5 }}
          />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No linked devices
          </Typography>
        </Box>
      ) : (
        <>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1.25,
              display: "block",
              color: "text.disabled",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.7px",
            }}
          >
            Active Devices ({devices.length}/4)
          </Typography>
          <List disablePadding>
            {devices.map((d) => (
              <Box
                key={d.id}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: alpha("#10b981", 0.12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DevicesIcon sx={{ color: "#10b981", fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    {d.device_name || "Unknown Device"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {d.platform || "Browser"} · Last seen{" "}
                    {formatMessageTime(d.last_active || d.created_at)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => removeDevice(d.id)}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </List>
        </>
      )}
    </SubShell>
  );
}

// ─── Account Settings ────────────────────────────────────────────────────────
export function AccountSettings({ onClose }) {
  const { user } = useAuth();
  return (
    <SubShell title="Account" onClose={onClose}>
      <List disablePadding>
        {[
          {
            label: "Change number",
            desc: "Transfer account to a new number",
            icon: <PersonIcon />,
            color: "#6366f1",
          },
          {
            label: "Delete account",
            desc: "Delete account and all data",
            icon: <DeleteIcon />,
            color: "#ef4444",
            danger: true,
          },
        ].map((item) => (
          <ListItemButton
            key={item.label}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(item.color, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.75,
                flexShrink: 0,
              }}
            >
              <Box sx={{ color: item.color, display: "flex" }}>{item.icon}</Box>
            </Box>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: item.danger ? "error.main" : "text.primary",
                  }}
                >
                  {item.label}
                </Typography>
              }
              secondary={
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.desc}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ px: 2, pt: 3 }}>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          Registered: {user?.phone || "—"}
        </Typography>
      </Box>
    </SubShell>
  );
}

// ─── Privacy Settings ────────────────────────────────────────────────────────
export function PrivacySettings({ onClose }) {
  const [settings, setSettings] = useState({
    last_seen: "Everyone",
    profile_photo: "Everyone",
    about: "Everyone",
    read_receipts: true,
    groups: "Everyone",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    privacyApi
      .get()
      .then((d) => setSettings((s) => ({ ...s, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (updates) => {
    const merged = { ...settings, ...updates };
    setSettings(merged);
    setSaving(true);
    await privacyApi.update(merged).catch(() => {});
    setSaving(false);
  };

  const opts = ["Everyone", "My contacts", "Nobody"];
  const ROWS = [
    {
      key: "last_seen",
      label: "Last seen & online",
      desc: "Who can see when you were last online",
      type: "select",
    },
    {
      key: "profile_photo",
      label: "Profile photo",
      desc: "Who can see your profile photo",
      type: "select",
    },
    {
      key: "about",
      label: "About",
      desc: "Who can see your About info",
      type: "select",
    },
    {
      key: "read_receipts",
      label: "Read receipts",
      desc: "If turned off, you won't send or receive read receipts",
      type: "toggle",
    },
    {
      key: "groups",
      label: "Groups",
      desc: "Who can add you to groups",
      type: "select",
    },
  ];

  if (loading)
    return (
      <SubShell title="Privacy" onClose={onClose}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} sx={{ color: "primary.main" }} />
        </Box>
      </SubShell>
    );

  return (
    <SubShell title="Privacy" onClose={onClose}>
      {saving && (
        <LinearProgress
          sx={{
            bgcolor: alpha("#00a884", 0.15),
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
      )}
      <List disablePadding>
        {ROWS.map((row) => (
          <Box
            key={row.key}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {row.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {row.desc}
              </Typography>
            </Box>
            {row.type === "toggle" ? (
              <Switch
                checked={settings[row.key]}
                onChange={(e) => save({ [row.key]: e.target.checked })}
                size="small"
              />
            ) : (
              <Select
                size="small"
                value={settings[row.key] || "Everyone"}
                onChange={(e) => save({ [row.key]: e.target.value })}
                sx={{
                  minWidth: 110,
                  fontSize: "0.8rem",
                  color: "text.primary",
                  bgcolor: alpha("#8696a0", 0.08),
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: alpha("#8696a0", 0.2),
                  },
                  "& .MuiSvgIcon-root": { color: "text.secondary" },
                }}
              >
                {opts.map((o) => (
                  <MenuItem
                    key={o}
                    value={o}
                    sx={{ fontSize: "0.8rem", textTransform: "capitalize" }}
                  >
                    {o}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        ))}
      </List>
    </SubShell>
  );
}

// ─── Chat Settings ───────────────────────────────────────────────────────────
export function ChatSettings({ onClose }) {
  const {
    prefs,
    setEnterIsSend,
    setArchiveKeep,
    setMediaAutoDownload,
    setShowReadReceipts,
    setNotificationsEnabled,
  } = useChatPrefs();
  const [saving, setSaving] = useState(false);

  const SETTER_MAP = {
    enter_is_send: setEnterIsSend,
    archive_keep: setArchiveKeep,
    media_auto_download: setMediaAutoDownload,
    show_read_receipts: setShowReadReceipts,
    notifications_enabled: setNotificationsEnabled,
  };

  const toggle = async (key) => {
    const setter = SETTER_MAP[key];
    if (!setter) return;
    setSaving(true);
    setter(!prefs[key]);
    setSaving(false);
  };

  const getChecked = (key) => !!prefs?.[key];

  const ROWS = [
    {
      key: "enter_is_send",
      label: "Enter is send",
      desc: "Press Enter to send a message; use Shift+Enter for new line",
    },
    {
      key: "media_auto_download",
      label: "Auto-download media",
      desc: "Automatically download photos and media",
    },
    {
      key: "show_read_receipts",
      label: "Read receipts",
      desc: "Let others know when you've read their messages",
    },
    {
      key: "notifications_enabled",
      label: "Message notifications",
      desc: "Receive notifications for new messages",
    },
  ];

  return (
    <SubShell title="Chats" onClose={onClose}>
      {saving && (
        <LinearProgress
          sx={{
            bgcolor: alpha("#00a884", 0.15),
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
      )}
      <List disablePadding>
        {ROWS.map((row) => (
          <Box
            key={row.key}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {row.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {row.desc}
              </Typography>
            </Box>
            <Switch
              checked={getChecked(row.key)}
              onChange={() => toggle(row.key)}
              size="small"
            />
          </Box>
        ))}
      </List>
    </SubShell>
  );
}

// ─── Notification Settings ───────────────────────────────────────────────────
export function NotificationSettings({ onClose }) {
  const [settings, setSettings] = useState({
    message_tone: true,
    group_tone: true,
    vibration: true,
    popup: "always",
  });

  const toggle = (key) => setSettings((p) => ({ ...p, [key]: !p[key] }));

  const ROWS = [
    {
      key: "message_tone",
      label: "Message notifications",
      desc: "Sound when receiving a message",
      type: "toggle",
    },
    {
      key: "group_tone",
      label: "Group notifications",
      desc: "Sound for group messages",
      type: "toggle",
    },
    {
      key: "vibration",
      label: "Vibration",
      desc: "Vibrate on message",
      type: "toggle",
    },
  ];

  return (
    <SubShell title="Notifications" onClose={onClose}>
      <List disablePadding>
        {ROWS.map((row) => (
          <Box
            key={row.key}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {row.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {row.desc}
              </Typography>
            </Box>
            <Switch
              checked={settings[row.key]}
              onChange={() => toggle(row.key)}
              size="small"
            />
          </Box>
        ))}
      </List>
    </SubShell>
  );
}

// ─── Storage & Data ──────────────────────────────────────────────────────────
export function StorageData({ onClose }) {
  return (
    <SubShell title="Storage and Data" onClose={onClose}>
      <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
        <StorageIcon
          sx={{ fontSize: 52, color: "text.disabled", opacity: 0.4, mb: 2 }}
        />
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Storage usage details
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          Storage analytics coming soon
        </Typography>
      </Box>
      <List disablePadding>
        {[
          {
            label: "Auto-download on Wi-Fi",
            desc: "Photos, audio, videos, documents",
            value: "All media",
          },
          {
            label: "Auto-download on mobile data",
            desc: "Only photos by default",
            value: "Photos",
          },
          {
            label: "Network usage",
            desc: "View your network usage details",
            value: "",
          },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {item.desc}
              </Typography>
            </Box>
            {item.value && (
              <Typography
                variant="caption"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                {item.value}
              </Typography>
            )}
          </Box>
        ))}
      </List>
    </SubShell>
  );
}

// ─── Invite Friend ───────────────────────────────────────────────────────────
export function InviteFriend({ onClose }) {
  const [copied, setCopied] = useState(false);
  const link = "https://wa.me/invite/your-link";

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <SubShell title="Invite a Friend" onClose={onClose}>
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: alpha("#00a884", 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2.5,
          }}
        >
          <ShareIcon sx={{ fontSize: 36, color: "primary.main" }} />
        </Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}
        >
          Share WhatsApp
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Invite your friends and family to join WhatsApp
        </Typography>

        <Box
          sx={{
            bgcolor: alpha("#8696a0", 0.08),
            borderRadius: 2.5,
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2.5,
            border: "1px solid",
            borderColor: alpha("#8696a0", 0.15),
          }}
        >
          <Typography
            variant="body2"
            noWrap
            sx={{ flex: 1, color: "text.secondary", fontSize: "0.8rem" }}
          >
            {link}
          </Typography>
          <IconButton
            size="small"
            onClick={copy}
            sx={{ color: copied ? "primary.main" : "text.secondary" }}
          >
            {copied ? (
              <CheckIcon fontSize="small" />
            ) : (
              <CopyIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<ShareIcon />}
          sx={{ py: 1.25, fontWeight: 700 }}
          onClick={() => navigator.share?.({ title: "WhatsApp", url: link })}
        >
          Share Invite Link
        </Button>
      </Box>
    </SubShell>
  );
}

// ─── Help & Feedback ─────────────────────────────────────────────────────────
export function HelpFeedback({ onClose }) {
  return (
    <SubShell title="Help" onClose={onClose}>
      <List disablePadding>
        {[
          {
            label: "FAQ",
            desc: "Frequently asked questions",
            icon: <HelpIcon />,
            color: "#f97316",
          },
          {
            label: "Contact us",
            desc: "Get in touch with our support team",
            icon: <EmailIcon />,
            color: "#3b82f6",
          },
          {
            label: "Privacy policy",
            desc: "View our privacy policy",
            icon: <LockIcon />,
            color: "#6366f1",
          },
          {
            label: "Terms and conditions",
            desc: "Read our terms of service",
            icon: <LockIcon />,
            color: "#6366f1",
          },
        ].map((item) => (
          <ListItemButton
            key={item.label}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(item.color, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1.75,
                flexShrink: 0,
              }}
            >
              <Box sx={{ color: item.color, display: "flex", fontSize: 20 }}>
                {item.icon}
              </Box>
            </Box>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  {item.label}
                </Typography>
              }
              secondary={
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.desc}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          WhatsApp v2.0.0 · Made with ❤️
        </Typography>
      </Box>
    </SubShell>
  );
}
