import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  CircularProgress,
  alpha,
  Button,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
} from "@mui/icons-material";
import { statusApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../common/UserAvatar";
import { formatMessageTime } from "../../utils/helpers";

function StatusViewer({ statusGroups, startIndex, onClose }) {
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [itemIdx, setItemIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const DURATION = 5000;

  const group = statusGroups[groupIdx];
  const item = group?.statuses?.[itemIdx];

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [groupIdx, itemIdx]);

  const goNext = () => {
    clearInterval(timerRef.current);
    if (itemIdx < group.statuses.length - 1) {
      setItemIdx((p) => p + 1);
    } else if (groupIdx < statusGroups.length - 1) {
      setGroupIdx((p) => p + 1);
      setItemIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    clearInterval(timerRef.current);
    if (itemIdx > 0) {
      setItemIdx((p) => p - 1);
    } else if (groupIdx > 0) {
      setGroupIdx((p) => p - 1);
      setItemIdx(0);
    }
  };

  if (!group || !item) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        bgcolor: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Progress bars */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          p: 1.25,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        {group.statuses.map((_, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              bgcolor: alpha("#fff", 0.3),
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                borderRadius: 2,
                bgcolor: "#fff",
                width:
                  i < itemIdx ? "100%" : i === itemIdx ? `${progress}%` : "0%",
                transition: i === itemIdx ? "none" : "none",
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          pt: 5,
          pb: 1.5,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <UserAvatar
          name={group.user?.full_name}
          src={group.user?.avatar_url}
          size={40}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: "#fff", fontWeight: 600 }}
          >
            {group.user?.full_name}
          </Typography>
          <Typography variant="caption" sx={{ color: alpha("#fff", 0.6) }}>
            {formatMessageTime(item.created_at)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Media/text */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {item.media_url ? (
          <Box
            component="img"
            src={item.media_url}
            alt="status"
            sx={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain" }}
          />
        ) : (
          <Box sx={{ px: 4, textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{ color: "#fff", fontWeight: 600, lineHeight: 1.5 }}
            >
              {item.content}
            </Typography>
          </Box>
        )}
        {/* Tap zones */}
        <Box
          onClick={goPrev}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "35%",
            height: "100%",
            cursor: "pointer",
          }}
        />
        <Box
          onClick={goNext}
          sx={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "35%",
            height: "100%",
            cursor: "pointer",
          }}
        />
      </Box>
    </Box>
  );
}

export default function StatusList({ onClose }) {
  const { user } = useAuth();
  const [myStatuses, setMyStatuses] = useState([]);
  const [otherStatuses, setOtherStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [startIdx, setStartIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      statusApi.getMyStatuses().catch(() => []),
      statusApi.getOthersStatuses().catch(() => []),
    ])
      .then(([mine, others]) => {
        setMyStatuses(mine || []);
        setOtherStatuses(others || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Step 1: upload the binary file via the REST endpoint (multipart/form-data).
      // This avoids embedding a large base64 string inside the GraphQL JSON body,
      // which would exceed Express's body-size limit and cause a 413 error.
      const { url, type } = await statusApi.uploadStatusMedia(file);

      // Step 2: create the status record using the returned storage URL.
      await statusApi.create({ content: null, mediaUrl: url, mediaType: type });

      const mine = await statusApi.getMyStatuses();
      setMyStatuses(mine || []);
    } catch (err) {
      console.error("[StatusList] upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const allGroups = [
    ...(myStatuses.length > 0 ? [{ user, statuses: myStatuses }] : []),
    ...otherStatuses,
  ];

  const viewStatus = (group, idx) => {
    const fullIdx = allGroups.findIndex((g) => g.user?.id === group.user?.id);
    setStartIdx(Math.max(0, fullIdx));
    setViewing(true);
    setStartIdx(Math.max(0, fullIdx));
  };

  if (viewing)
    return (
      <StatusViewer
        statusGroups={allGroups}
        startIndex={startIdx}
        onClose={() => setViewing(false)}
      />
    );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "background.sidebar",
      }}
    >
      {/* Header */}
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
          Status
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} sx={{ color: "primary.main" }} />
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {/* My status */}
          <Box
            onClick={() =>
              myStatuses.length > 0
                ? viewStatus({ user, statuses: myStatuses }, 0)
                : fileRef.current.click()
            }
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.75,
              cursor: "pointer",
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:hover": { bgcolor: alpha("#8696a0", 0.06) },
            }}
          >
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <UserAvatar
                name={user?.full_name}
                src={user?.avatar_url}
                size={48}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: uploading ? "text.disabled" : "primary.main",
                  border: "2px solid",
                  borderColor: "background.sidebar",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {uploading ? (
                  <CircularProgress size={10} sx={{ color: "#fff" }} />
                ) : (
                  <AddIcon sx={{ fontSize: 12, color: "#fff" }} />
                )}
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "text.primary" }}
              >
                My Status
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {myStatuses.length > 0
                  ? `${myStatuses.length} update${myStatuses.length > 1 ? "s" : ""}`
                  : "Tap to add status update"}
              </Typography>
            </Box>
          </Box>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={handleUpload}
          />

          {/* Others */}
          {otherStatuses.length > 0 && (
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
                Recent updates
              </Typography>
              {otherStatuses.map((group, i) => {
                const unseen = group.statuses?.some((s) => !s.is_seen);
                return (
                  <Box
                    key={group.user?.id || i}
                    onClick={() => viewStatus(group, i)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.75,
                      cursor: "pointer",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      "&:hover": { bgcolor: alpha("#8696a0", 0.06) },
                    }}
                  >
                    <Box
                      sx={{
                        borderRadius: "50%",
                        p: "2px",
                        background: unseen
                          ? "linear-gradient(135deg,#00a884,#00cf9e)"
                          : alpha("#8696a0", 0.2),
                        flexShrink: 0,
                      }}
                    >
                      <UserAvatar
                        name={group.user?.full_name}
                        src={group.user?.avatar_url}
                        size={44}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: "text.primary" }}
                      >
                        {group.user?.full_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {formatMessageTime(
                          group.statuses?.[group.statuses.length - 1]
                            ?.created_at,
                        )}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </>
          )}

          {otherStatuses.length === 0 && myStatuses.length === 0 && (
            <Box sx={{ textAlign: "center", py: 6, px: 3 }}>
              <Typography sx={{ fontSize: "2.5rem", mb: 1.5 }}>🔔</Typography>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 0.5 }}
              >
                No status updates
              </Typography>
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                Your contacts' status updates will appear here
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
