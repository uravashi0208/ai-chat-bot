/**
 * admin/pages/RegisterPage.js
 *
 * Matches design from screenshot:
 * - Left panel: same gradient bg, "Manage the job" headline, illustration
 * - Right panel: "Get started absolutely free", first/last name, email, password, Create account CTA
 */
import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  CircularProgress,
  Link,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAdminAuth } from "../context/AdminAuthContext";

function IllustrationSVG() {
  return (
    <svg
      viewBox="0 0 340 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 340 }}
    >
      <rect
        x="40"
        y="60"
        width="180"
        height="130"
        rx="16"
        fill="rgba(255,255,255,0.15)"
      />
      <rect
        x="40"
        y="60"
        width="180"
        height="130"
        rx="16"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />
      <rect x="52" y="72" width="120" height="88" rx="10" fill="#3b82f6" />
      <polyline
        points="60,140 75,120 90,128 105,105 120,115 135,95 150,105"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="150" cy="105" r="3.5" fill="#fff" />
      <rect
        x="60"
        y="148"
        width="100"
        height="6"
        rx="3"
        fill="rgba(255,255,255,0.3)"
      />
      <rect
        x="178"
        y="30"
        width="110"
        height="80"
        rx="12"
        fill="rgba(255,255,255,0.92)"
      />
      <circle cx="210" cy="60" r="14" fill="#fbbf24" opacity="0.9" />
      <circle cx="210" cy="60" r="8" fill="#f59e0b" />
      <polygon points="186,98 210,65 234,98" fill="#10b981" opacity="0.7" />
      <polygon points="210,98 228,75 246,98" fill="#34d399" opacity="0.6" />
      <circle
        cx="262"
        cy="42"
        r="7"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
      />
      <line
        x1="267"
        y1="47"
        x2="273"
        y2="53"
        stroke="#9ca3af"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="240"
        y="90"
        width="8"
        height="28"
        rx="2"
        fill="#f97316"
        transform="rotate(25 244 104)"
      />
      <polygon
        points="240,115 248,115 244,122"
        fill="#ea580c"
        transform="rotate(25 244 104)"
      />
      <rect
        x="30"
        y="170"
        width="90"
        height="80"
        rx="12"
        fill="rgba(255,255,255,0.9)"
      />
      <circle cx="75" cy="210" r="24" fill="#e5e7eb" />
      <path d="M75,210 L75,186 A24,24 0 0,1 99,210 Z" fill="#6366f1" />
      <path d="M75,210 L99,210 A24,24 0 0,1 55,228 Z" fill="#f97316" />
      <path d="M75,210 L55,228 A24,24 0 0,1 75,186 Z" fill="#10b981" />
      <rect x="106" y="190" width="6" height="30" rx="2" fill="#e5e7eb" />
      <rect x="116" y="200" width="6" height="20" rx="2" fill="#e5e7eb" />
      <rect x="126" y="195" width="6" height="25" rx="2" fill="#e5e7eb" />
      <circle cx="35" cy="50" r="2.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="295" cy="140" r="2" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

function PartnerLogos() {
  const logos = ["A", "B", "C", "D", "E"];
  return (
    <Stack direction="row" spacing={2} sx={{ opacity: 0.55 }}>
      {logos.map((l, i) => (
        <Box
          key={i}
          sx={{
            width: 28,
            height: 28,
            borderRadius: "6px",
            border: "1.5px solid rgba(100,100,100,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#6b7280",
          }}
        >
          {l}
        </Box>
      ))}
    </Stack>
  );
}

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { adminAuthApi } = await import("../../services/adminApi");
      const username =
        `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}`.replace(
          /\s/g,
          "",
        );
      const result = await adminAuthApi.register(
        username,
        form.email,
        form.password,
      );
      const { TOKEN_KEY, USER_KEY } = await import("../../services/adminApi");
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.admin));
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      fontSize: "0.9rem",
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#d1d5db" },
      "&.Mui-focused fieldset": {
        borderColor: "#6366f1",
        borderWidth: "1.5px",
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#f4f5fb",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 4,
          height: 64,
          bgcolor: "rgba(244,245,251,0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #00c896 0%, #007867 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,200,150,0.3)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2C5.58 2 2 5.13 2 9c0 2.05 1.02 3.88 2.63 5.13L4 17l3.18-1.47A8.7 8.7 0 0010 16c4.42 0 8-3.13 8-7s-3.58-7-8-7z"
                fill="white"
                fillOpacity="0.95"
              />
              <circle cx="7" cy="9" r="1.2" fill="#00a076" />
              <circle cx="10" cy="9" r="1.2" fill="#00a076" />
              <circle cx="13" cy="9" r="1.2" fill="#00a076" />
            </svg>
          </Box>
          <Typography
            fontWeight={800}
            sx={{
              color: "#111827",
              fontSize: "0.9rem",
              letterSpacing: "-0.02em",
            }}
          >
            ChatSphere
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Need help?
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: "1rem" }}>❓</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Left panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: "0 0 55%",
          flexDirection: "column",
          justifyContent: "space-between",
          pt: 12,
          pb: 6,
          px: 8,
          background:
            "linear-gradient(150deg, #f0f4ff 0%, #e8f5f2 50%, #f5f0ff 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -100,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: "#111827",
              mb: 1.5,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            Start managing chats
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280", mb: 5 }}>
            Power up your ChatSphere platform today.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <IllustrationSVG />
          </Box>
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <PartnerLogos />
        </Box>
      </Box>

      {/* Right panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pt: 8,
          px: 4,
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: "#111827", mb: 0.75, letterSpacing: "-0.02em" }}
          >
            Get started absolutely free
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mb: 3.5 }}>
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to="/admin"
              sx={{
                color: "#00a76f",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Get started
            </Link>
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {/* First + Last name */}
              <Stack direction="row" spacing={2}>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{
                      color: "#374151",
                      mb: 0.75,
                      display: "block",
                      fontSize: "0.8125rem",
                    }}
                  >
                    First name
                  </Typography>
                  <TextField
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    disabled={loading}
                    sx={inputSx}
                  />
                </Box>
                <Box flex={1}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{
                      color: "#374151",
                      mb: 0.75,
                      display: "block",
                      fontSize: "0.8125rem",
                    }}
                  >
                    Last name
                  </Typography>
                  <TextField
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    fullWidth
                    size="small"
                    disabled={loading}
                    sx={inputSx}
                  />
                </Box>
              </Stack>

              {/* Email */}
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    color: "#374151",
                    mb: 0.75,
                    display: "block",
                    fontSize: "0.8125rem",
                  }}
                >
                  Email address
                </Typography>
                <TextField
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  disabled={loading}
                  sx={inputSx}
                />
              </Box>

              {/* Password */}
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    color: "#374151",
                    mb: 0.75,
                    display: "block",
                    fontSize: "0.8125rem",
                  }}
                >
                  Password
                </Typography>
                <TextField
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  placeholder="6+ characters"
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPass((v) => !v)}
                          edge="end"
                          sx={{ color: "#9ca3af" }}
                        >
                          {showPass ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx}
                />
              </Box>

              {/* Submit */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : null
                }
                sx={{
                  height: 46,
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  bgcolor: "#1c1c1e",
                  color: "#fff",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#2d2d2f", boxShadow: "none" },
                }}
              >
                {loading ? "Creating account…" : "Create account"}
              </Button>

              <Typography
                variant="caption"
                sx={{
                  color: "#9ca3af",
                  textAlign: "center",
                  display: "block",
                  lineHeight: 1.5,
                }}
              >
                By signing up, I agree to{" "}
                <Link
                  href="#"
                  sx={{
                    color: "#374151",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Terms of service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  sx={{
                    color: "#374151",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Privacy policy
                </Link>
                .
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
