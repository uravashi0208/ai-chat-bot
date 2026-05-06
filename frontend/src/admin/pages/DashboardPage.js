/**
 * admin/pages/DashboardPage.js
 */
import React, { useEffect, useState } from "react";
import { Grid, Box, Typography, Stack, Paper, Skeleton, Chip, Button } from "@mui/material";
import {
  People as PeopleIcon, EmojiEmotions as EmojiIcon,
  Palette as PaletteIcon, Wallpaper as WallpaperIcon,
  Feedback as FeedbackIcon, ContactMail as ContactIcon,
  QuestionAnswer as FaqIcon, ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { PageHeader, SectionCard, StatCard } from "../components/common";
import {
  adminUsersApi, adminEmojiCatApi, adminThemeCatApi,
  adminWallpaperCatApi, adminFeedbackApi, adminContactUsApi, adminFaqApi,
} from "../../services/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

const QUICK_LINKS = [
  { label: "Users", href: "/admin/users", icon: PeopleIcon, color: "primary", desc: "Manage registered users" },
  { label: "Emojis", href: "/admin/emoji/categories", icon: EmojiIcon, color: "warning", desc: "Emoji packs & categories" },
  { label: "Themes", href: "/admin/theme/colors", icon: PaletteIcon, color: "info", desc: "Color themes" },
  { label: "Wallpapers", href: "/admin/wallpapers", icon: WallpaperIcon, color: "success", desc: "Chat backgrounds" },
  { label: "Feedback", href: "/admin/feedback", icon: FeedbackIcon, color: "error", desc: "User ratings" },
  { label: "Contact Us", href: "/admin/contact", icon: ContactIcon, color: "secondary", desc: "Support messages" },
  { label: "FAQs", href: "/admin/faq", icon: FaqIcon, color: "primary", desc: "Help articles" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [users, emojis, themes, wallpapers, feedback, contact, faqs] = await Promise.allSettled([
          adminUsersApi.getAll(1, 0),
          adminEmojiCatApi.getAll(),
          adminThemeCatApi.getAll(),
          adminWallpaperCatApi.getAll(),
          adminFeedbackApi.getAll(1, 0),
          adminContactUsApi.getAll(1, 0),
          adminFaqApi.getAll(),
        ]);
        if (!alive) return;
        setStats({
          users:      users.value?.total ?? 0,
          emojis:     emojis.value?.length ?? 0,
          themes:     themes.value?.length ?? 0,
          wallpapers: wallpapers.value?.length ?? 0,
          feedback:   feedback.value?.total ?? 0,
          contact:    contact.value?.total ?? 0,
          faqs:       faqs.value?.length ?? 0,
        });
      } catch (_) {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Box>
      <PageHeader
        title={`${greeting}, ${admin?.username || "Admin"} 👋`}
        subtitle="Here's what's happening across your platform today."
      />

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { label: "Total Users",     value: stats.users,      icon: PeopleIcon,  color: "primary" },
          { label: "Emoji Categories",value: stats.emojis,     icon: EmojiIcon,   color: "warning" },
          { label: "Theme Categories",value: stats.themes,     icon: PaletteIcon, color: "info" },
          { label: "Wallpapers",       value: stats.wallpapers, icon: WallpaperIcon,color: "success" },
          { label: "Feedback Entries", value: stats.feedback,  icon: FeedbackIcon, color: "error" },
          { label: "Contact Messages", value: stats.contact,   icon: ContactIcon,  color: "secondary" },
          { label: "FAQs",             value: stats.faqs,       icon: FaqIcon,      color: "primary" },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={s.label}>
            <StatCard {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Quick navigation */}
      <SectionCard title="Quick Navigation" subtitle="Jump to any section">
        <Grid container spacing={2}>
          {QUICK_LINKS.map((l) => (
            <Grid item xs={12} sm={6} md={4} key={l.label}>
              <Box
                onClick={() => navigate(l.href)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5, p: 1.75,
                  borderRadius: "10px", border: "1px solid #e9eaf0", bgcolor: "#fafafa",
                  cursor: "pointer", transition: "all 0.15s",
                  "&:hover": { bgcolor: "#fff", borderColor: "#6366f1", boxShadow: "0 2px 12px rgba(99,102,241,0.1)" },
                }}
              >
                <Box
                  sx={{
                    width: 38, height: 38, borderRadius: "9px",
                    bgcolor: (t) => alpha(t.palette[l.color]?.main || "#6366f1", 0.1),
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <l.icon sx={{ color: `${l.color}.main`, fontSize: 19 }} />
                </Box>
                <Box flex={1} overflow="hidden">
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#111827" }}>{l.label}</Typography>
                  <Typography variant="caption" sx={{ color: "#9ca3af" }}>{l.desc}</Typography>
                </Box>
                <ArrowIcon sx={{ fontSize: 16, color: "#d1d5db" }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </SectionCard>
    </Box>
  );
}
