/**
 * admin/pages/AdminProfilePage.js
 *
 * Admin profile page — mirrors the design in the screenshots:
 *  - Tab: General  (avatar, name, phone, about, social links)
 *  - Tab: Security (change password)
 *
 * Uses ONLY admin auth — no user auth involved.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Paper,
} from "@mui/material";
import {
  CreditCard as BillingIcon,
  Notifications as NotifIcon,
  Share as SocialIcon,
  Key as SecurityIcon,
  GridView as GeneralIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Info as InfoIcon,
} from "@mui/icons-material";
import { useAdminAuth } from "../context/AdminAuthContext";
import { adminProfileApi } from "../../services/adminApi";

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "#9ca3af",
                flexShrink: 0,
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              color: i === items.length - 1 ? "#9ca3af" : "#374151",
              fontWeight: i === items.length - 1 ? 400 : 500,
              fontSize: "0.78rem",
            }}
          >
            {item}
          </Typography>
        </React.Fragment>
      ))}
    </Stack>
  );
}

// ─── Tab panel ────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ mt: 3 }}>{children}</Box> : null;
}

// ─── Password field ───────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, error, helperText, focused }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      fullWidth
      type={show ? "text" : "password"}
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      helperText={helperText}
      focused={focused}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => setShow((v) => !v)}
              edge="end"
              tabIndex={-1}
            >
              {show ? (
                <VisibilityOff sx={{ fontSize: 18, color: "#9ca3af" }} />
              ) : (
                <Visibility sx={{ fontSize: 18, color: "#9ca3af" }} />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          fontSize: "0.9rem",
        },
        "& .MuiInputLabel-root": { fontSize: "0.9rem" },
      }}
    />
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────
function GeneralTab({ admin, updateAdmin }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    about: "",
    avatarUrl: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
  const fileRef = useRef();

  // Sync form whenever the admin data arrives (or changes)
  useEffect(() => {
    if (!admin) return;
    setForm({
      fullName: admin.full_name || "",
      phone: admin.phone || "",
      about: admin.about || "",
      avatarUrl: admin.avatar_url || "",
      facebook: admin.facebook || "",
      instagram: admin.instagram || "",
      linkedin: admin.linkedin || "",
      twitter: admin.twitter || "",
    });
  }, [admin]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const updated = await adminProfileApi.updateProfile(form);
      updateAdmin({
        full_name: updated.full_name,
        phone: updated.phone,
        about: updated.about,
        avatar_url: updated.avatar_url,
        facebook: updated.facebook,
        instagram: updated.instagram,
        linkedin: updated.linkedin,
        twitter: updated.twitter,
      });
      setMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      {msg && (
        <Alert
          severity={msg.type}
          onClose={() => setMsg(null)}
          sx={{ mb: 2, borderRadius: "10px" }}
        >
          {msg.text}
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ md: "flex-start" }}
      >
        {/* ── Avatar card ── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e9eaf0",
            borderRadius: "14px",
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            minWidth: 220,
            flexShrink: 0,
          }}
        >
          {/* Avatar with camera overlay */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={form.avatarUrl}
              sx={{
                width: 120,
                height: 120,
                fontSize: "2.5rem",
                fontWeight: 700,
                bgcolor: "#d1fae5",
                color: "#065f46",
                border: "3px solid #e9eaf0",
              }}
            >
              {(admin?.username || "A")[0].toUpperCase()}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => fileRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: 4,
                right: 4,
                bgcolor: "#111827",
                color: "#fff",
                width: 28,
                height: 28,
                "&:hover": { bgcolor: "#374151" },
              }}
            >
              <PhotoCamera sx={{ fontSize: 14 }} />
            </IconButton>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </Box>

          <Typography
            variant="caption"
            sx={{ color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}
          >
            Allowed *.jpeg, *.jpg, *.png, *.gif
            <br />
            max size of 3 Mb
          </Typography>

          <Divider sx={{ width: "100%", borderColor: "#f3f4f6" }} />
        </Paper>

        {/* ── Form fields ── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e9eaf0",
            borderRadius: "14px",
            p: 3,
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            {/* Name */}
            <TextField
              label="Name"
              value={form.fullName}
              onChange={set("fullName")}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* Email — read only */}
            <TextField
              label="Email address"
              value={admin?.email || ""}
              fullWidth
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* Phone */}
            <TextField
              label="Phone number"
              value={form.phone}
              onChange={set("phone")}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* Username — read only */}
            <TextField
              label="Username"
              value={admin?.username || ""}
              fullWidth
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* Facebook */}
            <TextField
              label="Facebook"
              value={form.facebook}
              onChange={set("facebook")}
              fullWidth
              placeholder="https://facebook.com/..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* Instagram */}
            <TextField
              label="Instagram"
              value={form.instagram}
              onChange={set("instagram")}
              fullWidth
              placeholder="https://instagram.com/..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* LinkedIn */}
            <TextField
              label="LinkedIn"
              value={form.linkedin}
              onChange={set("linkedin")}
              fullWidth
              placeholder="https://linkedin.com/in/..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* Twitter */}
            <TextField
              label="Twitter / X"
              value={form.twitter}
              onChange={set("twitter")}
              fullWidth
              placeholder="https://twitter.com/..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />

            {/* About — full width */}
            <TextField
              label="About"
              value={form.about}
              onChange={set("about")}
              fullWidth
              multiline
              rows={3}
              sx={{
                gridColumn: { sm: "1 / -1" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                },
                "& .MuiInputLabel-root": { fontSize: "0.9rem" },
              }}
            />
          </Box>

          {/* Save button */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: "#111827",
                color: "#fff",
                borderRadius: "8px",
                px: 3,
                py: 1,
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                "&:hover": { bgcolor: "#374151" },
                "&:disabled": { bgcolor: "#9ca3af" },
              }}
            >
              {saving ? (
                <CircularProgress size={18} sx={{ color: "#fff" }} />
              ) : (
                "Save changes"
              )}
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.oldPassword) errs.oldPassword = "Required";
    if (!form.newPassword) errs.newPassword = "Required";
    else if (form.newPassword.length < 6)
      errs.newPassword = "Password must be minimum 6+";
    if (form.confirmPassword !== form.newPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await adminProfileApi.changePassword(form.oldPassword, form.newPassword);
      setMsg({ type: "success", text: "Password changed successfully." });
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {msg && (
        <Alert
          severity={msg.type}
          onClose={() => setMsg(null)}
          sx={{ mb: 2, borderRadius: "10px" }}
        >
          {msg.text}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e9eaf0",
          borderRadius: "14px",
          p: 3,
          maxWidth: 640,
        }}
      >
        <Stack spacing={2.5}>
          <PasswordField
            label="Old password"
            value={form.oldPassword}
            onChange={set("oldPassword")}
            error={Boolean(errors.oldPassword)}
            helperText={errors.oldPassword}
          />

          <PasswordField
            label="New password"
            value={form.newPassword}
            onChange={set("newPassword")}
            error={Boolean(errors.newPassword)}
            helperText={
              errors.newPassword || (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <InfoIcon sx={{ fontSize: 13, color: "#6b7280" }} />
                  <span>Password must be minimum 6+</span>
                </Stack>
              )
            }
            focused={Boolean(form.newPassword)}
          />

          <PasswordField
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
          />
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: "#111827",
              color: "#fff",
              borderRadius: "8px",
              px: 3,
              py: 1,
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              "&:hover": { bgcolor: "#374151" },
              "&:disabled": { bgcolor: "#9ca3af" },
            }}
          >
            {saving ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : (
              "Save changes"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { label: "General", icon: <GeneralIcon sx={{ fontSize: 16 }} /> },
  { label: "Security", icon: <SecurityIcon sx={{ fontSize: 16 }} /> },
];

// ─── AdminProfilePage ─────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const { admin, updateAdmin } = useAdminAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fullAdmin, setFullAdmin] = useState(null);
  const [error, setError] = useState(null);

  // Fetch fresh admin profile from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminProfileApi
      .getMe()
      .then((data) => {
        if (!cancelled) {
          setFullAdmin(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFullAdmin(admin);
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateAdmin = (updates) => {
    setFullAdmin((prev) => ({ ...prev, ...updates }));
    updateAdmin(updates);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <CircularProgress size={36} sx={{ color: "#00c896" }} />
      </Box>
    );
  }

  const displayAdmin = fullAdmin || admin;

  return (
    <Box>
      {/* Page heading */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#111827" }}>
          Account
        </Typography>
        <Breadcrumb items={["Dashboard", "User", "Account"]} />
      </Box>

      {error && (
        <Alert
          severity="warning"
          onClose={() => setError(null)}
          sx={{ mb: 2, borderRadius: "10px" }}
        >
          Could not refresh profile: {error}. Showing cached data.
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: "1px solid #e9eaf0",
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            color: "#6b7280",
            minHeight: 44,
            px: 1.5,
            mr: 1,
          },
          "& .Mui-selected": {
            color: "#111827 !important",
            fontWeight: 700,
          },
          "& .MuiTabs-indicator": {
            bgcolor: "#111827",
            height: 2,
            borderRadius: 1,
          },
        }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.label}
            label={t.label}
            icon={t.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* General */}
      <TabPanel value={tab} index={0}>
        <GeneralTab admin={displayAdmin} updateAdmin={handleUpdateAdmin} />
      </TabPanel>

      {/* Security */}
      <TabPanel value={tab} index={1}>
        <SecurityTab />
      </TabPanel>
    </Box>
  );
}
