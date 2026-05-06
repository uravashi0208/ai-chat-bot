/**
 * App.js
 *
 * URL rule:
 *   /           → User chat (user login required)
 *   /login      → User login
 *   /admin      → Admin login  (public)
 *   /admin/*    → Admin panel  (admin login required)
 *
 * ThemeProvider switches based on URL — zero state, zero flags.
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
import PhoneAuthPage from "./pages/PhoneAuthPage";
import ChatPage from "./pages/ChatPage";

// ── Admin side ───────────────────────────────────────────────────────────────
import adminTheme from "./theme/adminTheme";
import {
  AdminAuthProvider,
  useAdminAuth,
} from "./admin/context/AdminAuthContext";
import { AdminThemeProvider } from "./admin/context/AdminThemeContext";
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
import {
  adminEmojiCatApi,
  adminThemeCatApi,
  adminWallpaperCatApi,
} from "./services/adminApi";
import AdminProfilePage from "./admin/pages/AdminProfilePage";

// ─── User guards ──────────────────────────────────────────────────────────────
function UserPrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
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
  return user ? children : <Navigate to="/login" replace />;
}
function UserPublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
}

// ─── Admin guards ─────────────────────────────────────────────────────────────
function AdminPrivateRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading)
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
        <CircularProgress />
      </Box>
    );
  return admin ? children : <Navigate to="/admin" replace />;
}
function AdminPublicRoute({ children }) {
  const { admin, loading } = useAdminAuth();
  if (loading) return null;
  return !admin ? children : <Navigate to="/admin/dashboard" replace />;
}

// ─── Admin section (all /admin/* routes) ─────────────────────────────────────
// AdminAuthProvider wraps everything once at this level.
// /admin          → login page  (public)
// /admin/register → register    (public)
// /admin/*        → layout + inner page (private)
function AdminSection() {
  return (
    <AdminAuthProvider>
      <AdminThemeProvider>
        <Routes>
          {/* ── Public ── */}
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

          {/* ── Protected — AdminLayout renders <Outlet /> ── */}
          <Route
            element={
              <AdminPrivateRoute>
                <AdminLayout />
              </AdminPrivateRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />

            {/* Emoji */}
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

            {/* Theme — singular paths to match sidebar nav */}
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

            {/* Wallpapers */}
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

            {/* Other sections */}
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="contact" element={<ContactUsPage />} />
            <Route
              path="cms/privacy"
              element={<CmsEditorPage type="privacy" />}
            />
            <Route path="cms/terms" element={<CmsEditorPage type="terms" />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="admin-profile" element={<AdminProfilePage />} />

            {/* Catch-all → dashboard */}
            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Route>
        </Routes>
      </AdminThemeProvider>
    </AdminAuthProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();
  const isAdminPath =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const theme = isAdminPath ? adminTheme : userTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* User side */}
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
        <Route
          path="/"
          element={
            <AuthProvider>
              <UserPrivateRoute>
                <ChatPrefsProvider>
                  <ChatProvider>
                    <ChatPage />
                  </ChatProvider>
                </ChatPrefsProvider>
              </UserPrivateRoute>
            </AuthProvider>
          }
        />

        {/* Admin side — delegate ALL /admin/* to AdminSection */}
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
