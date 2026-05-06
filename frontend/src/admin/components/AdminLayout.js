/**
 * admin/components/AdminLayout.js
 *
 * Clean, minimal admin shell matching the screenshot design:
 * - Left sidebar: white bg, logo, nav items with icons, collapsible groups
 * - Top header: breadcrumb area, notifications, account menu
 * - Main content: light grey bg, padded
 */
import React, { useState, useCallback } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Stack,
  Avatar,
  Divider,
  Tooltip,
  Popover,
  Badge,
  MenuItem,
  MenuList,
  useMediaQuery,
  Fade,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EmojiEmotions as EmojiIcon,
  Palette as PaletteIcon,
  Wallpaper as WallpaperIcon,
  Feedback as FeedbackIcon,
  ContactMail as ContactIcon,
  Article as CmsIcon,
  QuestionAnswer as FaqIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Logout as LogoutIcon,
  Category as CategoryIcon,
  FormatListBulleted as ListIcon,
  NotificationsOutlined as BellIcon,
  AccountCircleOutlined as AccountIcon,
  Settings as SettingsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useAdminTheme } from "../context/AdminThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_W = 260;
const NAV_COLLAPSED = 72;
const HEADER_H = 64;

// ─── Nav structure ────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    type: "item",
    label: "Dashboard",
    icon: DashboardIcon,
    href: "/admin/dashboard",
  },
  { type: "item", label: "Users", icon: PeopleIcon, href: "/admin/users" },
  {
    type: "group",
    label: "Emoji",
    icon: EmojiIcon,
    children: [
      {
        label: "Categories",
        icon: CategoryIcon,
        href: "/admin/emoji/categories",
      },
      { label: "Emoji List", icon: ListIcon, href: "/admin/emoji/list" },
    ],
  },
  {
    type: "group",
    label: "Themes",
    icon: PaletteIcon,
    children: [
      {
        label: "Categories",
        icon: CategoryIcon,
        href: "/admin/theme/categories",
      },
      { label: "Colors", icon: PaletteIcon, href: "/admin/theme/colors" },
    ],
  },
  {
    type: "group",
    label: "Wallpapers",
    icon: WallpaperIcon,
    children: [
      {
        label: "Categories",
        icon: CategoryIcon,
        href: "/admin/wallpaper/categories",
      },
      { label: "Wallpaper List", icon: ListIcon, href: "/admin/wallpapers" },
    ],
  },
  { type: "divider" },
  {
    type: "item",
    label: "Feedback",
    icon: FeedbackIcon,
    href: "/admin/feedback",
  },
  {
    type: "item",
    label: "Contact Us",
    icon: ContactIcon,
    href: "/admin/contact",
  },
  { type: "divider" },
  {
    type: "group",
    label: "CMS",
    icon: CmsIcon,
    children: [
      { label: "Privacy Policy", icon: CmsIcon, href: "/admin/cms/privacy" },
      { label: "Terms & Conditions", icon: CmsIcon, href: "/admin/cms/terms" },
    ],
  },
  { type: "item", label: "FAQs", icon: FaqIcon, href: "/admin/faq" },
];

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ item, collapsed, location }) {
  const navigate = useNavigate();
  const isActive = item.href && location.pathname === item.href;

  return (
    <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
      <ListItemButton
        onClick={() => item.href && navigate(item.href)}
        sx={{
          mx: 1,
          mb: 0.25,
          borderRadius: "8px",
          minHeight: 40,
          px: collapsed ? 1.5 : 1.75,
          transition: "all 0.15s",
          bgcolor: isActive ? "rgba(17,24,39,0.06)" : "transparent",
          "&:hover": {
            bgcolor: isActive ? "rgba(17,24,39,0.08)" : "rgba(0,0,0,0.04)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "unset" : 36,
            color: isActive ? "#111827" : "#6b7280",
          }}
        >
          <item.icon sx={{ fontSize: 18 }} />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: "0.875rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#111827" : "#374151",
              noWrap: true,
            }}
          />
        )}
        {!collapsed && isActive && (
          <Box
            sx={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              bgcolor: "#111827",
            }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
}

// ─── NavGroup ─────────────────────────────────────────────────────────────────
function NavGroup({ item, collapsed, location }) {
  const isAnyChildActive = item.children?.some(
    (c) => location.pathname === c.href,
  );
  const [open, setOpen] = useState(isAnyChildActive);

  return (
    <>
      <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
        <ListItemButton
          onClick={() => !collapsed && setOpen((v) => !v)}
          sx={{
            mx: 1,
            mb: 0.25,
            borderRadius: "8px",
            minHeight: 40,
            px: collapsed ? 1.5 : 1.75,
            bgcolor: isAnyChildActive ? "rgba(17,24,39,0.04)" : "transparent",
            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? "unset" : 36,
              color: isAnyChildActive ? "#111827" : "#6b7280",
            }}
          >
            <item.icon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          {!collapsed && (
            <>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: isAnyChildActive ? 600 : 500,
                  color: isAnyChildActive ? "#111827" : "#374151",
                }}
              />
              {open ? (
                <ExpandLessIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
              )}
            </>
          )}
        </ListItemButton>
      </Tooltip>

      {!collapsed && (
        <Collapse in={open} timeout="auto">
          <List disablePadding>
            {item.children?.map((child) => {
              const isChildActive = location.pathname === child.href;
              return (
                <ListItemButton
                  key={child.href}
                  component={Link}
                  to={child.href}
                  sx={{
                    ml: 3.5,
                    mr: 1,
                    mb: 0.25,
                    borderRadius: "8px",
                    minHeight: 36,
                    px: 1.5,
                    bgcolor: isChildActive
                      ? "rgba(17,24,39,0.06)"
                      : "transparent",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 28,
                      color: isChildActive ? "#111827" : "#9ca3af",
                    }}
                  >
                    <child.icon sx={{ fontSize: 14 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={child.label}
                    primaryTypographyProps={{
                      fontSize: "0.8125rem",
                      fontWeight: isChildActive ? 700 : 500,
                      color: isChildActive ? "#111827" : "#374151",
                    }}
                  />
                  {isChildActive && (
                    <Box
                      sx={{
                        width: 3,
                        height: 3,
                        borderRadius: "50%",
                        bgcolor: "#111827",
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      )}
    </>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
function SidebarContent({ collapsed, onCollapse, location }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1.5 : 2.5,
          height: HEADER_H,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Stack direction="row" alignItems="center" spacing={1.25}>
            {/* ChatSphere logo icon */}
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "9px",
                background: "linear-gradient(135deg, #00c896 0%, #007867 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,200,150,0.35)",
              }}
            >
              <svg
                width="20"
                height="20"
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
            <Box>
              <Typography
                fontWeight={800}
                sx={{
                  color: "#111827",
                  fontSize: "0.975rem",
                  letterSpacing: "0.04em",
                  lineHeight: 1.1,
                  marginBottom: "6px",
                }}
              >
                ChatSphere
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: "#9ca3af",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                Admin Portal
              </Typography>
            </Box>
          </Stack>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "9px",
              background: "linear-gradient(135deg, #00c896 0%, #007867 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,200,150,0.35)",
            }}
          >
            <svg
              width="20"
              height="20"
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
        )}
        {!collapsed && (
          <IconButton
            size="small"
            onClick={onCollapse}
            sx={{
              color: "#9ca3af",
              borderRadius: "7px",
              "&:hover": { bgcolor: "#f3f4f6", color: "#374151" },
            }}
          >
            <CollapseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "#f3f4f6" }} />

      {/* Nav */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 1.5,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#e5e7eb", borderRadius: 2 },
        }}
      >
        <List disablePadding>
          {NAV_ITEMS.map((item, i) => {
            if (item.type === "divider") {
              return (
                <Divider
                  key={i}
                  sx={{ my: 1, mx: 2, borderColor: "#f3f4f6" }}
                />
              );
            }
            if (item.type === "group") {
              return (
                <NavGroup
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  location={location}
                />
              );
            }
            return (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                location={location}
              />
            );
          })}
        </List>
      </Box>

      {/* Expand button when collapsed */}
      {collapsed && (
        <Box sx={{ p: 1.5, borderTop: "1px solid #f3f4f6" }}>
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onCollapse}
              sx={{
                width: "100%",
                borderRadius: "8px",
                color: "#9ca3af",
                "&:hover": { bgcolor: "#f3f4f6", color: "#374151" },
              }}
            >
              <ExpandIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

// ─── AccountPopover ───────────────────────────────────────────────────────────
function AccountPopover({ admin, onLogout }) {
  const [anchor, setAnchor] = useState(null);
  const navigate = useNavigate();

  return (
    <>
      <Tooltip title="Account settings">
        <Box
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            position: "relative",
            display: "inline-flex",
            cursor: "pointer",
            ml: 0.5,
          }}
        >
          {/* Main avatar — circular with teal border ring like screenshot */}
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "2px solid #00c896",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#f0fdf9",
              transition: "border-color 0.2s",
              "&:hover": { borderColor: "#00a076" },
            }}
          >
            <Avatar
              src={admin?.avatar_url}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "0.85rem",
                fontWeight: 700,
                bgcolor: "#d1fae5",
                color: "#065f46",
              }}
            >
              {(admin?.username || "A")[0].toUpperCase()}
            </Avatar>
          </Box>
        </Box>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            border: "1px solid #e9eaf0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            minWidth: 210,
            mt: 1,
          },
        }}
        TransitionComponent={Fade}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid #00c896",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#f0fdf9",
            }}
          >
            <Avatar
              src={admin?.avatar_url}
              sx={{
                width: "100%",
                height: "100%",
                fontSize: "0.9rem",
                fontWeight: 700,
                bgcolor: "#d1fae5",
                color: "#065f46",
              }}
            >
              {(admin?.username || "A")[0].toUpperCase()}
            </Avatar>
          </Box>
          <Box>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ color: "#111827" }}
            >
              {admin?.username || "Admin"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              {admin?.email || ""}
            </Typography>
          </Box>
        </Box>

        <MenuList sx={{ py: 0.75 }}>
          <MenuItem
            onClick={() => {
              navigate("/admin/admin-profile", { replace: true });
            }}
            sx={{
              fontSize: "0.875rem",
              borderRadius: "8px",
              mx: 0.75,
              px: 1.5,
              gap: 1.25,
              color: "#374151",
            }}
          >
            <AccountIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
            Profile
          </MenuItem>
          <MenuItem
            sx={{
              fontSize: "0.875rem",
              borderRadius: "8px",
              mx: 0.75,
              px: 1.5,
              gap: 1.25,
              color: "#374151",
            }}
          >
            <SettingsIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
            Settings
          </MenuItem>
          <Divider sx={{ my: 0.75, borderColor: "#f3f4f6" }} />
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onLogout();
              navigate("/admin", { replace: true });
            }}
            sx={{
              fontSize: "0.875rem",
              borderRadius: "8px",
              mx: 0.75,
              px: 1.5,
              gap: 1.25,
              color: "#ef4444",
            }}
          >
            <LogoutIcon sx={{ fontSize: 16 }} />
            Logout
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { admin, logout } = useAdminAuth();
  const { mode, toggleMode } = useAdminTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navWidth = collapsed ? NAV_COLLAPSED : NAV_W;

  const sidebar = (
    <Box
      sx={{
        width: navWidth,
        height: "100%",
        bgcolor: "#fff",
        borderRight: "1px solid #f3f4f6",
        transition: "width 0.2s ease",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      <SidebarContent
        collapsed={collapsed}
        onCollapse={() => setCollapsed((v) => !v)}
        location={location}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fa" }}>
      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <Box
          sx={{
            width: navWidth,
            flexShrink: 0,
            transition: "width 0.2s ease",
            position: "sticky",
            top: 0,
            height: "100vh",
            zIndex: 1200,
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{ sx: { width: NAV_W, border: 0 } }}
        >
          <SidebarContent
            collapsed={false}
            onCollapse={() => setMobileOpen(false)}
            location={location}
          />
        </Drawer>
      )}

      {/* ── Main ── */}
      <Box
        sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "rgba(247,248,250,0.9)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #f3f4f6",
            color: "#111827",
            zIndex: 1100,
          }}
        >
          <Toolbar
            sx={{
              height: HEADER_H,
              minHeight: `${HEADER_H}px !important`,
              px: { xs: 2, md: 3 },
            }}
          >
            {isMobile && (
              <IconButton
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 1, color: "#374151" }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Header actions */}
            <Stack direction="row" alignItems="center" spacing={1.2}>
              {/* Theme toggle */}
              <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
                <IconButton
                  size="small"
                  onClick={toggleMode}
                  sx={{
                    color: "#6b7280",
                    borderRadius: "8px",
                    "&:hover": { bgcolor: "#f3f4f6", color: "#374151" },
                  }}
                >
                  {mode === "light" ? (
                    <DarkModeIcon sx={{ fontSize: 23 }} />
                  ) : (
                    <LightModeIcon sx={{ fontSize: 23 }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  size="small"
                  sx={{
                    color: "#6b7280",
                    borderRadius: "8px",
                    "&:hover": { bgcolor: "#f3f4f6", color: "#374151" },
                  }}
                >
                  <Badge
                    badgeContent={3}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.6rem",
                        minWidth: 16,
                        height: 16,
                      },
                    }}
                  >
                    <BellIcon sx={{ fontSize: 23 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Account */}
              <AccountPopover admin={admin} onLogout={logout} />
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 3.5 },
            py: { xs: 2.5, md: 3 },
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
