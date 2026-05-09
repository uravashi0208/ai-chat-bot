import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Switch,
  TextField,
  CircularProgress,
  alpha,
  Tooltip,
  Fade,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Call as AudioIcon,
  Videocam as VideoIcon,
  Search as SearchIcon,
  NotificationsNone as NotifIcon,
  Photo as MediaIcon,
  Lock as LockIcon,
  TimerOutlined as TimerIcon,
  SecurityOutlined as PrivacyIcon,
  Star as StarIcon,
  Block as BlockIcon,
  Flag as ReportIcon,
  DeleteOutline as DeleteOutlineIcon,
  FavoriteBorder as FavouriteIcon,
  ArrowBack as ArrowBackIcon,
  PersonOutlined as NameIcon,
  SmartphoneOutlined as PhoneIcon,
  Collections as CollectionsIcon,
  InsertDriveFile as DocsIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import UserAvatar from "../common/UserAvatar";
import { usersApi, messagesApi } from "../../services/api";

const ACCENT = "#00a884";
const DARK_BG = "#111b21";
const CARD_BG = "#202c33";
const DIVIDER = "#2a3942";
const TEXT_PRIMARY = "#e9edef";
const TEXT_SECONDARY = "#8696a0";
const TEXT_DISABLED = "#667781";
const RED = "#f15c6d";

/* ─── parse phone into country + local ──────────────────────── */
function parsePhone(raw = "") {
  const digits = raw.replace(/\D/g, "");
  const known = {
    48: "PL",
    91: "IN",
    1: "US",
    44: "GB",
    49: "DE",
    33: "FR",
    61: "AU",
  };
  for (const code of ["1", "44", "48", "49", "91", "33", "61"]) {
    if (digits.startsWith(code)) {
      const country = known[code] || `+${code}`;
      return {
        countryCode: code,
        countryLabel: `${country} +${code}`,
        local: digits.slice(code.length),
      };
    }
  }
  return { countryCode: "", countryLabel: "", local: digits };
}

/* ─── Green Switch ───────────────────────────────────────────── */
function GreenSwitch(props) {
  return (
    <Switch
      size="small"
      sx={{
        width: 44,
        height: 24,
        padding: 0,
        "& .MuiSwitch-switchBase": {
          padding: "3px",
          "&.Mui-checked": {
            color: "#fff",
            transform: "translateX(20px)",
            "& + .MuiSwitch-track": { bgcolor: ACCENT, opacity: 1 },
          },
        },
        "& .MuiSwitch-thumb": { width: 18, height: 18 },
        "& .MuiSwitch-track": {
          borderRadius: 12,
          bgcolor: TEXT_DISABLED,
          opacity: 1,
        },
      }}
      {...props}
    />
  );
}

/* ─── Action button ──────────────────────────────────────────── */
function ActionBtn({ icon, label, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.75,
        flex: 1,
        cursor: "pointer",
        py: 1,
        borderRadius: 2,
        transition: "background 0.15s",
        "&:hover": { bgcolor: alpha("#fff", 0.05) },
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: 52,
          borderRadius: 1.5,
          bgcolor: CARD_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: TEXT_SECONDARY,
          transition: "background 0.15s",
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{ fontSize: "0.72rem", color: TEXT_SECONDARY }}
      >
        {label}
      </Typography>
    </Box>
  );
}

/* ─── Setting row ────────────────────────────────────────────── */
function SettingRow({ icon, title, subtitle, trailing, onClick, danger }) {
  return (
    <>
      <Box
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2.5,
          py: subtitle ? 1.5 : 1.75,
          cursor: onClick ? "pointer" : "default",
          transition: "background 0.12s",
          "&:hover": onClick ? { bgcolor: alpha("#fff", 0.04) } : {},
        }}
      >
        <Box
          sx={{
            color: danger ? RED : TEXT_DISABLED,
            display: "flex",
            flexShrink: 0,
            width: 24,
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.9375rem",
              color: danger ? RED : TEXT_PRIMARY,
              lineHeight: 1.35,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: TEXT_DISABLED,
                fontSize: "0.78rem",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {trailing && <Box sx={{ flexShrink: 0 }}>{trailing}</Box>}
      </Box>
    </>
  );
}

/* ─── Media / Links / Docs screen ───────────────────────────── */
function MediaScreen({ conversationId, onBack }) {
  const [tab, setTab] = useState(0);
  const [media, setMedia] = useState([]);
  const [docs, setDocs] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    messagesApi
      .getMessages(conversationId, 200)
      .then((msgs) => {
        const m = (msgs || []).filter((msg) => !msg.is_deleted);
        setMedia(
          m.filter(
            (msg) => ["image", "video"].includes(msg.type) && msg.media_url,
          ),
        );
        setDocs(m.filter((msg) => msg.type === "document" && msg.media_url));
        setLinks(
          m.filter((msg) => {
            if (msg.type !== "text") return false;
            return /https?:\/\/[^\s]+/.test(msg.content || "");
          }),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  const extractLinks = (text = "") => {
    const matches = text.match(/https?:\/\/[^\s]+/g);
    return matches || [];
  };

  return (
    <Fade in>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: DARK_BG,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1,
            py: 0.75,
            bgcolor: CARD_BG,
            minHeight: 56,
          }}
        >
          <IconButton onClick={onBack} sx={{ color: TEXT_SECONDARY }}>
            <ArrowBackIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: CARD_BG, borderBottom: `1px solid ${DIVIDER}` }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            TabIndicatorProps={{
              style: { backgroundColor: ACCENT, height: 3 },
            }}
            sx={{
              "& .MuiTab-root": {
                color: TEXT_SECONDARY,
                textTransform: "none",
                fontWeight: 500,
                flex: 1,
              },
              "& .Mui-selected": { color: ACCENT },
            }}
          >
            <Tab label="Media" />
            <Tab label="Docs" />
            <Tab label="Links" />
          </Tabs>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 6 }}>
              <CircularProgress sx={{ color: ACCENT }} size={32} />
            </Box>
          )}

          {/* Media tab */}
          {!loading && tab === 0 && (
            <>
              {media.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 400,
                    gap: 1,
                  }}
                >
                  <CollectionsIcon
                    sx={{ fontSize: 48, color: TEXT_DISABLED, mb: 1 }}
                  />
                  <Typography
                    sx={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}
                  >
                    No media
                  </Typography>
                  <Typography sx={{ color: TEXT_DISABLED, fontSize: "0.8rem" }}>
                    Media shared in this chat will appear here.
                  </Typography>
                  <Typography
                    sx={{
                      color: ACCENT,
                      fontSize: "0.82rem",
                      mt: 1,
                      cursor: "pointer",
                    }}
                  >
                    View media from all chats
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "2px",
                    p: "2px",
                  }}
                >
                  {media.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        aspectRatio: "1",
                        bgcolor: CARD_BG,
                        overflow: "hidden",
                      }}
                    >
                      {msg.type === "image" ? (
                        <img
                          src={msg.media_url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <VideoIcon
                            sx={{ color: TEXT_SECONDARY, fontSize: 32 }}
                          />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          {/* Docs tab */}
          {!loading && tab === 1 && (
            <>
              {docs.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 400,
                    gap: 1,
                  }}
                >
                  <DocsIcon
                    sx={{ fontSize: 48, color: TEXT_DISABLED, mb: 1 }}
                  />
                  <Typography
                    sx={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}
                  >
                    No docs
                  </Typography>
                  <Typography sx={{ color: TEXT_DISABLED, fontSize: "0.8rem" }}>
                    Docs shared in this chat will appear here.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {docs.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        px: 2.5,
                        py: 1.5,
                        borderBottom: `1px solid ${DIVIDER}`,
                      }}
                    >
                      <DocsIcon sx={{ color: ACCENT, fontSize: 28 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: TEXT_PRIMARY,
                            fontSize: "0.88rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {msg.content || "Document"}
                        </Typography>
                        <Typography
                          sx={{ color: TEXT_DISABLED, fontSize: "0.75rem" }}
                        >
                          {msg.media_size
                            ? `${(msg.media_size / 1024).toFixed(1)} KB`
                            : ""}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          {/* Links tab */}
          {!loading && tab === 2 && (
            <>
              {links.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 400,
                    gap: 1,
                  }}
                >
                  <LinkIcon
                    sx={{ fontSize: 48, color: TEXT_DISABLED, mb: 1 }}
                  />
                  <Typography
                    sx={{ color: TEXT_SECONDARY, fontSize: "0.9rem" }}
                  >
                    No links
                  </Typography>
                  <Typography sx={{ color: TEXT_DISABLED, fontSize: "0.8rem" }}>
                    Links shared in this chat will appear here.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {links.map((msg) =>
                    extractLinks(msg.content).map((url, i) => (
                      <Box
                        key={`${msg.id}-${i}`}
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          px: 2.5,
                          py: 1.5,
                          borderBottom: `1px solid ${DIVIDER}`,
                          textDecoration: "none",
                        }}
                      >
                        <LinkIcon sx={{ color: ACCENT, fontSize: 28 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: ACCENT,
                              fontSize: "0.82rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {url}
                          </Typography>
                        </Box>
                      </Box>
                    )),
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Fade>
  );
}

/* ─── Edit Contact Screen ────────────────────────────────────── */
function EditContactScreen({ other, name, onBack, onSaved }) {
  const contactId = other?.user?.id;
  const phone = other?.user?.phone || "";
  const { countryLabel, local } = parsePhone(phone);

  const [firstName, setFirstName] = useState(
    () => (name || "").split(" ")[0] || "",
  );
  const [lastName, setLastName] = useState(
    () => (name || "").split(" ").slice(1).join(" ") || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const fullNickname = [firstName.trim(), lastName.trim()]
      .filter(Boolean)
      .join(" ");
    if (!fullNickname) {
      setError("First name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await usersApi.updateNickname(contactId, fullNickname);
      onSaved(contactId, fullNickname);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fade in>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: DARK_BG,
          position: "relative",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1,
            py: 0.75,
            bgcolor: CARD_BG,
            minHeight: 56,
          }}
        >
          <IconButton onClick={onBack} sx={{ color: TEXT_SECONDARY }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: TEXT_PRIMARY,
              flex: 1,
              ml: 1,
              fontSize: "1rem",
            }}
          >
            Edit contact
          </Typography>
          <Tooltip title="Clear nickname">
            <IconButton
              onClick={async () => {
                try {
                  await usersApi.updateNickname(contactId, null);
                  onSaved(contactId, null);
                } catch {}
              }}
              sx={{ color: TEXT_SECONDARY }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: "auto", pb: 12 }}>
          {/* First name */}
          <Box sx={{ bgcolor: CARD_BG, mt: 2, px: 3, py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
              <NameIcon
                sx={{
                  color: TEXT_DISABLED,
                  mb: 0.5,
                  fontSize: 22,
                  flexShrink: 0,
                }}
              />
              <TextField
                fullWidth
                variant="standard"
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                inputProps={{ maxLength: 50 }}
                InputLabelProps={{ style: { color: TEXT_DISABLED } }}
                InputProps={{ style: { color: TEXT_PRIMARY } }}
                sx={{
                  "& .MuiInput-underline:before": {
                    borderBottomColor: DIVIDER,
                  },
                  "& .MuiInput-underline:after": { borderBottomColor: ACCENT },
                  "& label.Mui-focused": { color: ACCENT },
                }}
              />
            </Box>
          </Box>

          {/* Last name */}
          <Box sx={{ bgcolor: CARD_BG, mt: 0.5, px: 3, py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
              <Box sx={{ width: 22, flexShrink: 0 }} />
              <TextField
                fullWidth
                variant="standard"
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                inputProps={{ maxLength: 50 }}
                InputLabelProps={{ style: { color: TEXT_DISABLED } }}
                InputProps={{ style: { color: TEXT_PRIMARY } }}
                sx={{
                  "& .MuiInput-underline:before": {
                    borderBottomColor: DIVIDER,
                  },
                  "& .MuiInput-underline:after": { borderBottomColor: ACCENT },
                  "& label.Mui-focused": { color: ACCENT },
                }}
              />
            </Box>
          </Box>

          {/* Phone — read-only */}
          <Box sx={{ bgcolor: CARD_BG, mt: 2, px: 3, py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
              <PhoneIcon
                sx={{
                  color: TEXT_DISABLED,
                  mb: 0.5,
                  fontSize: 22,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                  {/* Country */}
                  <Box sx={{ minWidth: 90 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: TEXT_DISABLED, display: "block", mb: 0.25 }}
                    >
                      Country
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        borderBottom: `1px solid ${DIVIDER}`,
                        pb: 0.5,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: "0.9375rem", color: TEXT_PRIMARY }}
                      >
                        {countryLabel || "—"}
                      </Typography>
                    </Box>
                  </Box>
                  {/* Local number */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: TEXT_DISABLED, display: "block", mb: 0.25 }}
                    >
                      Phone
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderBottom: `1px solid ${DIVIDER}`,
                        pb: 0.5,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: "0.9375rem", color: TEXT_PRIMARY }}
                      >
                        {local || "—"}
                      </Typography>
                      {phone && (
                        <CheckIcon sx={{ color: ACCENT, fontSize: 18 }} />
                      )}
                    </Box>
                  </Box>
                </Box>
                {phone && (
                  <Typography
                    variant="caption"
                    sx={{ color: TEXT_SECONDARY, mt: 0.5, display: "block" }}
                  >
                    This phone number is on WhatsApp.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Sync to phone toggle */}
          <Box sx={{ bgcolor: CARD_BG, mt: 0.5, px: 3, py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Box sx={{ width: 22, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: "0.9375rem", color: TEXT_PRIMARY }}>
                  Sync contact to phone
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: TEXT_SECONDARY, fontSize: "0.78rem" }}
                >
                  This contact will be added to your phone's address book.
                </Typography>
              </Box>
              <GreenSwitch defaultChecked />
            </Box>
          </Box>

          {error && (
            <Typography
              sx={{ px: 3, pt: 1.5, color: "error.main", fontSize: "0.82rem" }}
            >
              {error}
            </Typography>
          )}
        </Box>

        {/* Floating ✓ save button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 3,
            bgcolor: DARK_BG,
          }}
        >
          <IconButton
            onClick={handleSave}
            disabled={saving}
            sx={{
              width: 56,
              height: 56,
              bgcolor: CARD_BG,
              border: `1px solid ${DIVIDER}`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
              color: TEXT_PRIMARY,
              "&:hover": { bgcolor: alpha("#fff", 0.06) },
              "&.Mui-disabled": { bgcolor: CARD_BG, color: TEXT_DISABLED },
            }}
          >
            {saving ? (
              <CircularProgress size={22} sx={{ color: ACCENT }} />
            ) : (
              <CheckIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Fade>
  );
}

/* ─── Main ContactProfile ────────────────────────────────────── */
export default function ContactProfile({
  conversation,
  other,
  name: nameProp,
  avatarUrl,
  online,
  onClose,
  onAudioCall,
  onVideoCall,
  onNicknameSaved,
}) {
  const phone = other?.user?.phone || "";
  const formattedPhone = phone ? `+${phone}` : "";

  const [displayName, setDisplayName] = useState(nameProp || "");
  const [editOpen, setEditOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    if (nameProp) setDisplayName(nameProp);
  }, [nameProp]);

  const handleSaved = (contactUserId, newNickname) => {
    if (newNickname) setDisplayName(newNickname);
    else setDisplayName(other?.user?.full_name || other?.user?.username || "");
    if (onNicknameSaved) onNicknameSaved(contactUserId, newNickname);
    setEditOpen(false);
  };

  if (editOpen) {
    return (
      <Box sx={{ height: "100%", overflow: "hidden" }}>
        <EditContactScreen
          other={other}
          name={displayName}
          onBack={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      </Box>
    );
  }

  if (mediaOpen) {
    return (
      <Box sx={{ height: "100%", overflow: "hidden" }}>
        <MediaScreen
          conversationId={conversation?.id}
          onBack={() => setMediaOpen(false)}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: DARK_BG,
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: 6 },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: alpha("#fff", 0.15),
          borderRadius: 3,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.75,
          bgcolor: CARD_BG,
          minHeight: 52,
        }}
      >
        <IconButton onClick={onClose} sx={{ color: TEXT_SECONDARY }}>
          <CloseIcon />
        </IconButton>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: TEXT_PRIMARY,
            flex: 1,
            ml: 1,
            fontSize: "1rem",
          }}
        >
          Contact info
        </Typography>
        <Tooltip title="Edit contact">
          <IconButton
            onClick={() => setEditOpen(true)}
            sx={{ color: TEXT_SECONDARY }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Avatar + Name + Phone */}
      <Box
        sx={{
          bgcolor: CARD_BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 4,
          pb: 3,
          gap: 0.5,
        }}
      >
        <UserAvatar
          name={displayName}
          src={avatarUrl}
          size={112}
          online={online}
        />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            color: TEXT_PRIMARY,
            mt: 1.5,
            lineHeight: 1.2,
          }}
        >
          {displayName}
        </Typography>
        {phone && (
          <Typography sx={{ fontSize: "0.88rem", color: TEXT_SECONDARY }}>
            {formattedPhone}
          </Typography>
        )}
      </Box>

      {/* Action buttons */}
      <Box
        sx={{
          bgcolor: CARD_BG,
          display: "flex",
          justifyContent: "space-evenly",
          px: 3,
          pt: 0.5,
          pb: 1.5,
          gap: 1,
          mt: "2px",
        }}
      >
        <ActionBtn
          icon={<AudioIcon sx={{ fontSize: 22 }} />}
          label="Voice"
          onClick={onAudioCall}
        />
        <ActionBtn
          icon={<VideoIcon sx={{ fontSize: 22 }} />}
          label="Video"
          onClick={onVideoCall}
        />
        <ActionBtn icon={<SearchIcon sx={{ fontSize: 22 }} />} label="Search" />
      </Box>

      {/* Notes */}
      <Box
        sx={{
          bgcolor: CARD_BG,
          mt: "2px",
          px: 2.5,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ color: TEXT_DISABLED, fontSize: "0.85rem" }}>
          Add notes about your customer.
        </Typography>
        <IconButton sx={{ color: TEXT_SECONDARY, p: 0.5 }}>
          <EditIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ height: "2px" }} />

      {/* Media, links and docs */}
      <Box sx={{ bgcolor: CARD_BG }}>
        <Box
          onClick={() => setMediaOpen(true)}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.75,
            cursor: "pointer",
            transition: "background 0.12s",
            "&:hover": { bgcolor: alpha("#fff", 0.04) },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <MediaIcon sx={{ color: TEXT_DISABLED, fontSize: 22 }} />
            <Typography sx={{ fontSize: "0.9375rem", color: TEXT_PRIMARY }}>
              Media, links and docs
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ color: TEXT_DISABLED, fontSize: "0.85rem" }}>
              0
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ height: "2px" }} />

      {/* Settings rows */}
      <Box sx={{ bgcolor: CARD_BG }}>
        <SettingRow
          icon={<StarIcon sx={{ fontSize: 22 }} />}
          title="Starred messages"
          onClick={() => {}}
        />
        <SettingRow
          icon={<NotifIcon sx={{ fontSize: 22 }} />}
          title="Notification settings"
          onClick={() => {}}
        />
        <SettingRow
          icon={<TimerIcon sx={{ fontSize: 22 }} />}
          title="Disappearing messages"
          subtitle="Off"
          onClick={() => {}}
        />
        <SettingRow
          icon={<PrivacyIcon sx={{ fontSize: 22 }} />}
          title="Advanced chat privacy"
          subtitle="Off"
          onClick={() => {}}
        />
        <SettingRow
          icon={<LockIcon sx={{ fontSize: 22 }} />}
          title="Encryption"
          subtitle="Messages are end-to-end encrypted. Click to verify."
        />
      </Box>

      <Box sx={{ height: "2px" }} />

      {/* Danger zone */}
      <Box sx={{ bgcolor: CARD_BG }}>
        <SettingRow
          icon={<FavouriteIcon sx={{ fontSize: 22 }} />}
          title="Add to favourites"
          onClick={() => {}}
        />
        <SettingRow
          icon={<BlockIcon sx={{ fontSize: 22 }} />}
          title={`Clear chat`}
          onClick={() => {}}
          danger
        />
        <SettingRow
          icon={<BlockIcon sx={{ fontSize: 22 }} />}
          title={`Block ${displayName?.split(" ")[0] || ""}`}
          onClick={() => {}}
          danger
        />
        <SettingRow
          icon={<ReportIcon sx={{ fontSize: 22 }} />}
          title={`Report ${displayName?.split(" ")[0] || ""}`}
          onClick={() => {}}
          danger
        />
        <SettingRow
          icon={<DeleteOutlineIcon sx={{ fontSize: 22 }} />}
          title="Delete chat"
          onClick={() => {}}
          danger
        />
      </Box>

      <Box sx={{ height: 24 }} />
    </Box>
  );
}
