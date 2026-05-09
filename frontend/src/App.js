/**
 * App.js
 *
 * Route map:
 *   /          → User chat home   (requires user login)
 *   /login     → Phone OTP auth   (public)
 *   /admin     → Admin login      (public)
 *   /admin/*   → Admin panel      (requires admin login)
 *
 * ThemeProvider switches automatically based on URL path — no extra state needed.
 * Admin side is completely untouched.
 */

import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
} from "@mui/material";

// ── User side ────────────────────────────────────────────────────────────────
import userTheme from "./theme/index";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatPrefsProvider } from "./context/ChatPrefsContext";
import { ChatProvider } from "./context/ChatContext";
import { AudioPlayerProvider } from "./context/AudioPlayerContext";
import PhoneAuthPage from "./pages/PhoneAuthPage";
import ChatPage from "./pages/ChatPage";

// ── Admin side (untouched) ───────────────────────────────────────────────────
import adminTheme from "./theme/adminTheme";
import {
  AdminAuthProvider,
  useAdminAuth,
} from "./admin/context/AdminAuthContext";
import { AdminThemeProvider } from "./admin/context/AdminThemeContext";
import { ToastProvider } from "./admin/context/ToastContext";
import AdminLayout from "./admin/components/AdminLayout";
import AdminLoginPage from "./admin/pages/LoginPage";
import AdminRegisterPage from "./admin/pages/RegisterPage";
import DashboardPage from "./admin/pages/DashboardPage";
import UsersPage from "./admin/pages/UsersPage";
import CategoryCrudPage from "./admin/pages/CategoryCrudPage";
import EmojiListPage from "./admin/pages/EmojiListPage";
import ThemeColorsPage from "./admin/pages/ThemeColorsPage";
import WallpapersPage from "./admin/pages/WallpapersPage";
import FeedbackPage from "./admin/pages/FeedbackPage";
import ContactUsPage from "./admin/pages/ContactUsPage";
import CmsEditorPage from "./admin/pages/CmsEditorPage";
import FaqPage from "./admin/pages/FaqPage";
import AdminProfilePage from "./admin/pages/AdminProfilePage";
import {
  adminEmojiCatApi,
  adminThemeCatApi,
  adminWallpaperCatApi,
} from "./services/adminApi";

// ── Shared loading spinner ────────────────────────────────────────────────────
function FullPageLoader() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      <CircularProgress sx={{ color: "primary.main" }} />
    </Box>
  );
}

// ── User route guards ─────────────────────────────────────────────────────────
function UserPrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function UserPublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
}

// ── Admin route guards ────────────────────────────────────────────────────────
function AdminPrivateRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return <FullPageLoader />;
  return admin ? children : <Navigate to="/admin" replace />;
}

function AdminPublicRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return !admin ? children : <Navigate to="/admin/dashboard" replace />;
}

// ── Admin section ─────────────────────────────────────────────────────────────
function AdminSection() {
  return (
    <AdminAuthProvider>
      <AdminThemeProvider>
        <ToastProvider>
          <Routes>
            <Route
              index
              element={
                <AdminPublicRoute>
                  <AdminLoginPage />
                </AdminPublicRoute>
              }
            />
            <Route
              path="register"
              element={
                <AdminPublicRoute>
                  <AdminRegisterPage />
                </AdminPublicRoute>
              }
            />

            <Route
              element={
                <AdminPrivateRoute>
                  <AdminLayout />
                </AdminPrivateRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route
                path="emoji/categories"
                element={
                  <CategoryCrudPage
                    api={adminEmojiCatApi}
                    title="Emoji Categories"
                    subtitle="Organise emojis into categories"
                  />
                }
              />
              <Route path="emoji/list" element={<EmojiListPage />} />
              <Route
                path="theme/categories"
                element={
                  <CategoryCrudPage
                    api={adminThemeCatApi}
                    title="Theme Categories"
                    subtitle="Group theme colors by category"
                  />
                }
              />
              <Route path="theme/colors" element={<ThemeColorsPage />} />
              <Route
                path="wallpaper/categories"
                element={
                  <CategoryCrudPage
                    api={adminWallpaperCatApi}
                    title="Wallpaper Categories"
                    subtitle="Group wallpapers by category"
                  />
                }
              />
              <Route path="wallpapers" element={<WallpapersPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="contact" element={<ContactUsPage />} />
              <Route
                path="cms/privacy"
                element={<CmsEditorPage type="privacy" />}
              />
              <Route
                path="cms/terms"
                element={<CmsEditorPage type="terms" />}
              />
              <Route path="faq" element={<FaqPage />} />
              <Route path="admin-profile" element={<AdminProfilePage />} />
              <Route
                path="*"
                element={<Navigate to="/admin/dashboard" replace />}
              />
            </Route>
          </Routes>
        </ToastProvider>
      </AdminThemeProvider>
    </AdminAuthProvider>
  );
}

// ── Root routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();
  const isAdmin =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const theme = isAdmin ? adminTheme : userTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* User public — phone OTP login */}
        <Route
          path="/login"
          element={
            <AuthProvider>
              <UserPublicRoute>
                <PhoneAuthPage />
              </UserPublicRoute>
            </AuthProvider>
          }
        />

        {/* User private — chat home */}
        <Route
          path="/"
          element={
            <AuthProvider>
              <UserPrivateRoute>
                <ChatPrefsProvider>
                  <AudioPlayerProvider>
                    <ChatProvider>
                      <ChatPage />
                    </ChatProvider>
                  </AudioPlayerProvider>
                </ChatPrefsProvider>
              </UserPrivateRoute>
            </AuthProvider>
          }
        />

        {/* Admin — all /admin/* delegated */}
        <Route path="/admin/*" element={<AdminSection />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
