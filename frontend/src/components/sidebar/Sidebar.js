import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Typography,
  alpha,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import UserAvatar from "../common/UserAvatar";
import ConversationList from "./ConversationList";
import ContactSearch from "./ContactSearch";
import { statusApi } from "../../services/api";

const FILTER_TABS = ["All", "Unread", "Favourites", "Groups"];

export default function Sidebar({
  onSelectConversation,
  onSelectAI,
  isAIActive,
}) {
  const { user, logout } = useAuth();
  const [view, setView] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [hasMyStatus, setHasMyStatus] = useState(false);

  useEffect(() => {
    statusApi
      .getMyStatuses()
      .then((s) => setHasMyStatus(s?.length > 0))
      .catch(() => {});
  }, []);

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 340 },
        minWidth: { md: 300 },
        maxWidth: { md: 380 },
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#ffffff",
        borderRight: "1px solid #e9edef",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#f0f2f5",
          minHeight: 60,
        }}
      >
        <Box
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{ cursor: "pointer", "&:hover": { opacity: 0.85 } }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              hasMyStatus ? (
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    bgcolor: "#25d366",
                    border: "2px solid #f0f2f5",
                  }}
                />
              ) : null
            }
          >
            <UserAvatar
              name={user?.full_name}
              src={user?.avatar_url}
              size={40}
            />
          </Badge>
        </Box>

        <Typography
          sx={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#111b21",
            flex: 1,
            ml: 1.5,
          }}
        >
          Chats
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="New chat">
            <IconButton
              size="small"
              onClick={() =>
                setView((v) => (v === "contacts" ? "chats" : "contacts"))
              }
              sx={{
                color: "#54656f",
                "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Menu">
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{
                color: "#54656f",
                "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => {
              setView("status");
              setMenuAnchor(null);
            }}
          >
            Status
          </MenuItem>
          <MenuItem
            onClick={() => {
              setView("settings");
              setMenuAnchor(null);
            }}
          >
            Settings
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              logout();
              setMenuAnchor(null);
            }}
            sx={{ color: "error.main" }}
          >
            Log out
          </MenuItem>
        </Menu>
      </Box>

      {/* Filter tabs */}
      {view === "chats" && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            px: 2,
            py: 1,
            bgcolor: "#ffffff",
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {FILTER_TABS.map((tab) => (
            <Box
              key={tab}
              component="button"
              onClick={() => setActiveTab(tab)}
              sx={{
                px: 1.75,
                py: 0.5,
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                flexShrink: 0,
                bgcolor: activeTab === tab ? "#d9fdd3" : "#f0f2f5",
                color: activeTab === tab ? "#008069" : "#54656f",
                transition: "all 0.15s",
                "&:hover": {
                  bgcolor: activeTab === tab ? "#c8f0c0" : "#e9edef",
                },
              }}
            >
              {tab}
            </Box>
          ))}
        </Box>
      )}

      {/* Search */}
      {view === "chats" && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "#f0f2f5",
              borderRadius: "10px",
              px: 1.5,
              py: 0.75,
            }}
          >
            <SearchIcon
              sx={{ color: "#8696a0", fontSize: 17, flexShrink: 0 }}
            />
            <InputBase
              placeholder="Search or start a new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                fontSize: "0.875rem",
                color: "#111b21",
                "& input::placeholder": { color: "#8696a0" },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {view === "chats" && (
          <ConversationList
            searchQuery={searchQuery}
            activeTab={activeTab}
            onSelect={(conv) => {
              onSelectConversation(conv);
            }}
            onSelectAI={onSelectAI}
            isAIActive={isAIActive}
          />
        )}
        {view === "contacts" && (
          <ContactSearch
            onSelect={(conv) => {
              onSelectConversation(conv);
              setView("chats");
            }}
            onClose={() => setView("chats")}
          />
        )}
        {view === "settings" && (
          <LazySettings onClose={() => setView("chats")} />
        )}
        {view === "status" && (
          <LazyStatusList onClose={() => setView("chats")} />
        )}
      </Box>
    </Box>
  );
}

function LazySettings({ onClose }) {
  const Settings = React.lazy(() => import("../settings/Settings"));
  return (
    <React.Suspense fallback={null}>
      <Settings onClose={onClose} />
    </React.Suspense>
  );
}
function LazyStatusList({ onClose }) {
  const StatusList = React.lazy(() => import("../status/StatusList"));
  return (
    <React.Suspense fallback={null}>
      <StatusList onClose={onClose} />
    </React.Suspense>
  );
}
