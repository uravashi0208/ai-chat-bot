import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { userPrefsApi } from "../services/api";
import { useAuth } from "./AuthContext";

const ChatPrefsContext = createContext(null);

const DEFAULTS = {
  theme: "light",
  wallpaper: "default",
  chat_color: "purple",
  font_size: "medium",
  enter_is_send: true,
  archive_keep: true,
  backup_freq: "Off",
  last_backup_at: null,
  ai_wallpaper_url: null,
  media_auto_download: true,
  show_read_receipts: true,
  notifications_enabled: true,
};

export const CHAT_COLORS = [
  {
    id: "purple",
    label: "Purple",
    type: "solid",
    outgoing: "#ede9fe",
    accent: "#7c3aed",
  },
  {
    id: "violet",
    label: "Violet",
    type: "solid",
    outgoing: "#f3e8ff",
    accent: "#9333ea",
  },
  {
    id: "indigo",
    label: "Indigo",
    type: "solid",
    outgoing: "#e0e7ff",
    accent: "#4338ca",
  },
  {
    id: "blue",
    label: "Blue",
    type: "solid",
    outgoing: "#dbeafe",
    accent: "#2563eb",
  },
  {
    id: "sky",
    label: "Sky",
    type: "solid",
    outgoing: "#e0f2fe",
    accent: "#0284c7",
  },
  {
    id: "cyan",
    label: "Cyan",
    type: "solid",
    outgoing: "#cffafe",
    accent: "#0891b2",
  },
  {
    id: "teal",
    label: "Teal",
    type: "solid",
    outgoing: "#ccfbf1",
    accent: "#0d9488",
  },
  {
    id: "green",
    label: "Green",
    type: "solid",
    outgoing: "#dcfce7",
    accent: "#16a34a",
  },
  {
    id: "emerald",
    label: "Emerald",
    type: "solid",
    outgoing: "#d1fae5",
    accent: "#059669",
  },
  {
    id: "lime",
    label: "Lime",
    type: "solid",
    outgoing: "#ecfccb",
    accent: "#65a30d",
  },
  {
    id: "yellow",
    label: "Yellow",
    type: "solid",
    outgoing: "#fef9c3",
    accent: "#ca8a04",
  },
  {
    id: "amber",
    label: "Amber",
    type: "solid",
    outgoing: "#fef3c7",
    accent: "#d97706",
  },
  {
    id: "orange",
    label: "Orange",
    type: "solid",
    outgoing: "#ffedd5",
    accent: "#ea580c",
  },
  {
    id: "red",
    label: "Red",
    type: "solid",
    outgoing: "#fee2e2",
    accent: "#dc2626",
  },
  {
    id: "rose",
    label: "Rose",
    type: "solid",
    outgoing: "#ffe4e6",
    accent: "#e11d48",
  },
  {
    id: "pink",
    label: "Pink",
    type: "solid",
    outgoing: "#fce7f3",
    accent: "#db2777",
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    type: "solid",
    outgoing: "#fae8ff",
    accent: "#c026d3",
  },
  {
    id: "slate",
    label: "Slate",
    type: "solid",
    outgoing: "#f1f5f9",
    accent: "#475569",
  },
  {
    id: "gray",
    label: "Gray",
    type: "solid",
    outgoing: "#f3f4f6",
    accent: "#4b5563",
  },
  {
    id: "stone",
    label: "Stone",
    type: "solid",
    outgoing: "#f5f5f4",
    accent: "#57534e",
  },
  {
    id: "brown",
    label: "Brown",
    type: "solid",
    outgoing: "#fef3c7",
    accent: "#92400e",
  },
  {
    id: "gold",
    label: "Gold",
    type: "solid",
    outgoing: "#fef9c3",
    accent: "#b45309",
  },
  {
    id: "mint",
    label: "Mint",
    type: "solid",
    outgoing: "#d1fae5",
    accent: "#047857",
  },
  {
    id: "coral",
    label: "Coral",
    type: "solid",
    outgoing: "#fee2e2",
    accent: "#f43f5e",
  },
  {
    id: "lavender",
    label: "Lavender",
    type: "solid",
    outgoing: "#f5f3ff",
    accent: "#8b5cf6",
  },
  {
    id: "peach",
    label: "Peach",
    type: "solid",
    outgoing: "#fff7ed",
    accent: "#f97316",
  },
  {
    id: "navy",
    label: "Navy",
    type: "solid",
    outgoing: "#dbeafe",
    accent: "#1e3a8a",
  },
  {
    id: "forest",
    label: "Forest",
    type: "solid",
    outgoing: "#d1fae5",
    accent: "#064e3b",
  },
  {
    id: "maroon",
    label: "Maroon",
    type: "solid",
    outgoing: "#ffe4e6",
    accent: "#9f1239",
  },
  {
    id: "olive",
    label: "Olive",
    type: "solid",
    outgoing: "#ecfccb",
    accent: "#3f6212",
  },
  {
    id: "grad-sunset",
    label: "Sunset",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#ffecd2,#fcb69f)",
    accent: "#f97316",
  },
  {
    id: "grad-ocean",
    label: "Ocean",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#a8edea,#fed6e3)",
    accent: "#0284c7",
  },
  {
    id: "grad-aurora",
    label: "Aurora",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#a18cd1,#fbc2eb)",
    accent: "#9333ea",
  },
  {
    id: "grad-spring",
    label: "Spring",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#d4fc79,#96e6a1)",
    accent: "#16a34a",
  },
  {
    id: "grad-candy",
    label: "Candy",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#f7971e,#ffd200)",
    accent: "#f59e0b",
  },
  {
    id: "grad-cotton",
    label: "Cotton",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#fddb92,#d1fdff)",
    accent: "#0891b2",
  },
  {
    id: "grad-berry",
    label: "Berry",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#e96c9b,#a78bfa)",
    accent: "#db2777",
  },
  {
    id: "grad-tropical",
    label: "Tropical",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#43e97b,#38f9d7)",
    accent: "#059669",
  },
  {
    id: "grad-midnight",
    label: "Midnight",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#0f3460,#533483)",
    accent: "#4338ca",
  },
  {
    id: "grad-fire",
    label: "Fire",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#f83600,#f9d423)",
    accent: "#ea580c",
  },
  {
    id: "grad-ice",
    label: "Ice",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#74ebd5,#acb6e5)",
    accent: "#0284c7",
  },
  {
    id: "grad-peacock",
    label: "Peacock",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#4facfe,#00f2fe)",
    accent: "#0891b2",
  },
  {
    id: "grad-grape",
    label: "Grape",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#667eea,#764ba2)",
    accent: "#7c3aed",
  },
  {
    id: "grad-flamingo",
    label: "Flamingo",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#f093fb,#f5576c)",
    accent: "#db2777",
  },
  {
    id: "grad-earth",
    label: "Earth",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#d4b896,#a8856a)",
    accent: "#92400e",
  },
  {
    id: "grad-cosmic",
    label: "Cosmic",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#2980b9,#6c5ce7)",
    accent: "#4338ca",
  },
  {
    id: "grad-citrus",
    label: "Citrus",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#f7971e,#84fab0)",
    accent: "#65a30d",
  },
  {
    id: "grad-lavender",
    label: "Lav-Rose",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
    accent: "#8b5cf6",
  },
  {
    id: "grad-forest",
    label: "Rainforest",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#56ab2f,#a8e063)",
    accent: "#047857",
  },
  {
    id: "grad-sky",
    label: "Sky Burst",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#89f7fe,#66a6ff)",
    accent: "#2563eb",
  },
  {
    id: "grad-rose-gold",
    label: "Rose Gold",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#f8b4c8,#fddcb5)",
    accent: "#e11d48",
  },
  {
    id: "grad-northern",
    label: "Northern",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#00b4d8,#90e0ef)",
    accent: "#0284c7",
  },
  {
    id: "grad-mocha",
    label: "Mocha",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#c79081,#dfa579)",
    accent: "#92400e",
  },
  {
    id: "grad-mint-choc",
    label: "Mint Choc",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#84fab0,#8fd3f4)",
    accent: "#0d9488",
  },
  {
    id: "grad-cherry",
    label: "Cherry",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#eb3349,#f45c43)",
    accent: "#dc2626",
  },
  {
    id: "grad-dewdrop",
    label: "Dewdrop",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#c1dfc4,#deecdd)",
    accent: "#16a34a",
  },
  {
    id: "grad-amber-sky",
    label: "Amber Sky",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#fbd786,#f7797d)",
    accent: "#d97706",
  },
  {
    id: "grad-deep-sea",
    label: "Deep Sea",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#2b5876,#4e4376)",
    accent: "#1e3a8a",
  },
  {
    id: "grad-stardust",
    label: "Stardust",
    type: "gradient",
    outgoing: "linear-gradient(135deg,#f5f7fa,#c3cfe2)",
    accent: "#475569",
  },
];

export const WALLPAPERS = [
  {
    id: "default",
    label: "Default",
    bg: "#e9eaf0",
    pattern: "dots",
    category: "plain",
  },
  {
    id: "classic",
    label: "Classic",
    bg: "#dfe5e1",
    pattern: "whatsapp",
    category: "plain",
  },
  {
    id: "dark",
    label: "Dark",
    bg: "#0d1117",
    pattern: "dots-dark",
    category: "plain",
  },
  {
    id: "midnight",
    label: "Midnight",
    bg: "#1a1a2e",
    pattern: "grid",
    category: "plain",
  },
  {
    id: "none",
    label: "Plain",
    bg: "transparent",
    pattern: "none",
    category: "plain",
  },
  {
    id: "cream",
    label: "Cream",
    bg: "#fffbf0",
    pattern: "dots",
    category: "plain",
  },
  {
    id: "snow",
    label: "Snow",
    bg: "#f8fafc",
    pattern: "none",
    category: "plain",
  },
  {
    id: "charcoal",
    label: "Charcoal",
    bg: "#1c1c1e",
    pattern: "none",
    category: "plain",
  },
  {
    id: "navy-bg",
    label: "Navy",
    bg: "#0f172a",
    pattern: "grid",
    category: "plain",
  },
  {
    id: "ocean",
    label: "Ocean",
    bg: "#cce5ff",
    pattern: "waves",
    category: "nature",
  },
  {
    id: "forest-nat",
    label: "Forest",
    bg: "#d4edda",
    pattern: "leaves",
    category: "nature",
  },
  {
    id: "sunset",
    label: "Sunset",
    bg: "#ffe5cc",
    pattern: "dots",
    category: "nature",
  },
  {
    id: "rose-nat",
    label: "Rose",
    bg: "#fce4ec",
    pattern: "dots",
    category: "nature",
  },
  {
    id: "lavender-nat",
    label: "Lavender",
    bg: "#ede9fe",
    pattern: "dots",
    category: "nature",
  },
  {
    id: "sky-nat",
    label: "Sky",
    bg: "#e0f2fe",
    pattern: "clouds",
    category: "nature",
  },
  {
    id: "spring",
    label: "Spring",
    bg: "#f0fdf4",
    pattern: "blossoms",
    category: "nature",
  },
  {
    id: "autumn",
    label: "Autumn",
    bg: "#fff7ed",
    pattern: "leaves-fall",
    category: "nature",
  },
  {
    id: "desert",
    label: "Desert",
    bg: "#fef3c7",
    pattern: "sand",
    category: "nature",
  },
  {
    id: "arctic",
    label: "Arctic",
    bg: "#e0f2fe",
    pattern: "snowflakes",
    category: "nature",
  },
  {
    id: "jungle",
    label: "Jungle",
    bg: "#dcfce7",
    pattern: "tropical",
    category: "nature",
  },
  {
    id: "dusk",
    label: "Dusk",
    bg: "#fdf2f8",
    pattern: "stars",
    category: "nature",
  },
  {
    id: "grad-sunrise",
    label: "Sunrise",
    bg: "linear-gradient(160deg,#ffecd2 0%,#fcb69f 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-aurora-bg",
    label: "Aurora",
    bg: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-candy-bg",
    label: "Candy",
    bg: "linear-gradient(160deg,#a18cd1 0%,#fbc2eb 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-ocean-bg",
    label: "Deep Sea",
    bg: "linear-gradient(160deg,#4facfe 0%,#00f2fe 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-fire-bg",
    label: "Fire",
    bg: "linear-gradient(160deg,#f83600 0%,#fde68a 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-mint-bg",
    label: "Mint",
    bg: "linear-gradient(160deg,#d4fc79 0%,#96e6a1 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-dusk-bg",
    label: "Dusk",
    bg: "linear-gradient(160deg,#2c3e50 0%,#fd746c 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-galaxy",
    label: "Galaxy",
    bg: "linear-gradient(160deg,#0f0c29,#302b63,#24243e)",
    pattern: "stars",
    category: "gradient",
  },
  {
    id: "grad-rose-bg",
    label: "Rose Sky",
    bg: "linear-gradient(160deg,#fbc2eb 0%,#a6c1ee 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-tropical-bg",
    label: "Tropic",
    bg: "linear-gradient(160deg,#43e97b 0%,#38f9d7 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-berry-bg",
    label: "Berry",
    bg: "linear-gradient(160deg,#4776e6 0%,#8e54e9 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "grad-peach-bg",
    label: "Peach",
    bg: "linear-gradient(160deg,#f7971e 0%,#ffd200 100%)",
    pattern: "none",
    category: "gradient",
  },
  {
    id: "polka",
    label: "Polka",
    bg: "#f8f9fa",
    pattern: "polka",
    category: "pattern",
  },
  {
    id: "zigzag",
    label: "Zigzag",
    bg: "#f0f4ff",
    pattern: "zigzag",
    category: "pattern",
  },
  {
    id: "diamonds",
    label: "Diamonds",
    bg: "#fdf4ff",
    pattern: "diamonds",
    category: "pattern",
  },
  {
    id: "stripes",
    label: "Stripes",
    bg: "#f0fff4",
    pattern: "stripes",
    category: "pattern",
  },
  {
    id: "hexagons",
    label: "Hex",
    bg: "#eff6ff",
    pattern: "hexagons",
    category: "pattern",
  },
  {
    id: "checker",
    label: "Checker",
    bg: "#fafafa",
    pattern: "checker",
    category: "pattern",
  },
  {
    id: "crosshatch",
    label: "Crosshatch",
    bg: "#f5f5f5",
    pattern: "crosshatch",
    category: "pattern",
  },
  {
    id: "triangles",
    label: "Triangles",
    bg: "#fdf9f3",
    pattern: "triangles",
    category: "pattern",
  },
  {
    id: "circles",
    label: "Circles",
    bg: "#f0fdfa",
    pattern: "circles",
    category: "pattern",
  },
  {
    id: "moroccan",
    label: "Moroccan",
    bg: "#fff7f0",
    pattern: "moroccan",
    category: "pattern",
  },
  {
    id: "dark-stars",
    label: "Starry",
    bg: "#0f172a",
    pattern: "stars",
    category: "dark",
  },
  {
    id: "dark-grid",
    label: "Neon Grid",
    bg: "#0a0a0a",
    pattern: "neon-grid",
    category: "dark",
  },
  {
    id: "dark-geo",
    label: "Dark Geo",
    bg: "#111827",
    pattern: "geo-dark",
    category: "dark",
  },
  {
    id: "dark-dots",
    label: "Dark Dots",
    bg: "#1e1b4b",
    pattern: "dots-dark",
    category: "dark",
  },
  {
    id: "dark-waves",
    label: "Dark Wave",
    bg: "#0c1445",
    pattern: "waves-dark",
    category: "dark",
  },
  {
    id: "matrix",
    label: "Matrix",
    bg: "#001a00",
    pattern: "matrix",
    category: "dark",
  },
  {
    id: "custom",
    label: "My Photo",
    bg: null,
    pattern: "none",
    category: "custom",
    isCustom: true,
  },
];

const THEMES = {
  light: {
    "--c-accent": "#7c3aed",
    "--c-accent-dark": "#5b21b6",
    "--c-accent-glow": "rgba(124,58,237,0.15)",
    "--c-outgoing-bg": "#ede9fe",
    "--c-outgoing-border": "rgba(124,58,237,0.2)",
    "--c-incoming-bg": "#ffffff",
    "--c-incoming-border": "rgba(0,0,0,0.06)",
    "--c-panel-bg": "#f3f4f6",
    "--c-sidebar-bg": "#f3f4f6",
    "--c-header-bg": "#ffffff",
    "--c-chat-bg": "#e9eaf0",
    "--c-input-bg": "#f3f4f6",
    "--c-divider": "rgba(0,0,0,0.08)",
    "--c-hover": "rgba(124,58,237,0.07)",
    "--c-active": "rgba(124,58,237,0.13)",
    "--c-text-primary": "#1a1a2e",
    "--c-text-secondary": "#4b5068",
    "--c-text-muted": "#9095b0",
    "--c-icon": "#6b7194",
    "--c-online": "#10b981",
    "--c-bubble-shadow": "0 2px 8px rgba(0,0,0,0.08)",
    "--c-scrollbar": "#c4c6d8",
  },
  dark: {
    "--c-accent": "#a78bfa",
    "--c-accent-dark": "#7c3aed",
    "--c-accent-glow": "rgba(167,139,250,0.15)",
    "--c-outgoing-bg": "#2d1f52",
    "--c-outgoing-border": "rgba(167,139,250,0.25)",
    "--c-incoming-bg": "#1e2330",
    "--c-incoming-border": "rgba(255,255,255,0.06)",
    "--c-panel-bg": "#111318",
    "--c-sidebar-bg": "#111318",
    "--c-header-bg": "#1a1f2e",
    "--c-chat-bg": "#0d1117",
    "--c-input-bg": "#1a1f2e",
    "--c-divider": "rgba(255,255,255,0.07)",
    "--c-hover": "rgba(167,139,250,0.08)",
    "--c-active": "rgba(167,139,250,0.15)",
    "--c-text-primary": "#e8eaf6",
    "--c-text-secondary": "#9095b0",
    "--c-text-muted": "#5a607a",
    "--c-icon": "#7a7fa0",
    "--c-online": "#34d399",
    "--c-bubble-shadow": "0 2px 8px rgba(0,0,0,0.3)",
    "--c-scrollbar": "#2a2f45",
  },
};

const FONT_SIZES = {
  small: { base: "13px", msg: "13px", meta: "10px" },
  medium: { base: "14px", msg: "14px", meta: "11px" },
  large: { base: "16px", msg: "16px", meta: "12px" },
};

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(themeName) {
  const resolved = themeName === "system" ? getSystemTheme() : themeName;
  const tokens = THEMES[resolved] || THEMES.light;
  const root = document.documentElement;
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-theme", resolved);
}

function applyFontSize(size) {
  const sizes = FONT_SIZES[size] || FONT_SIZES.medium;
  const root = document.documentElement;
  root.style.setProperty("--font-size-base", sizes.base);
  root.style.setProperty("--font-size-msg", sizes.msg);
  root.style.setProperty("--font-size-meta", sizes.meta);
  root.setAttribute("data-font-size", size);
}

function applyWallpaper(wallpaperId) {
  document.documentElement.setAttribute("data-wallpaper", wallpaperId);
}

function applyChatColor(colorId) {
  const color = CHAT_COLORS.find((c) => c.id === colorId) || CHAT_COLORS[0];
  const root = document.documentElement;
  root.style.setProperty("--c-outgoing-bg", color.outgoing);
  root.style.setProperty("--c-accent", color.accent);
  root.style.setProperty("--c-accent-dark", color.accent);
  root.style.setProperty("--c-accent-glow", color.accent + "26");
  root.style.setProperty("--c-outgoing-border", color.accent + "33");
  root.style.setProperty("--c-hover", color.accent + "12");
  root.style.setProperty("--c-active", color.accent + "22");
  root.setAttribute("data-chat-color", colorId);
}

export function ChatPrefsProvider({ children }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState(null);
  const [customWallpaper, setCustomWallpaper] = useState(null);
  const [aiWallpaper, setAiWallpaper] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    userPrefsApi
      .getPreferences()
      .then((data) => {
        if (data) {
          setPrefs({ ...DEFAULTS, ...data });
          setLastBackup(data.last_backup_at);
          applyTheme(data.theme || "light");
          applyFontSize(data.font_size || "medium");
          applyWallpaper(data.wallpaper || "default");
          applyChatColor(data.chat_color || "purple");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const saved = localStorage.getItem("custom_wallpaper");
    if (saved) setCustomWallpaper(saved);
    const savedAi = localStorage.getItem("ai_wallpaper_url");
    if (savedAi) setAiWallpaper(savedAi);
  }, [user]);

  const saveToDb = useCallback((updates) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const gqlPrefs = {};
      if (updates.theme !== undefined) gqlPrefs.theme = updates.theme;
      if (updates.wallpaper !== undefined)
        gqlPrefs.wallpaper = updates.wallpaper;
      if (updates.chat_color !== undefined)
        gqlPrefs.chatColor = updates.chat_color;
      if (updates.font_size !== undefined)
        gqlPrefs.fontSize = updates.font_size;
      if (updates.enter_is_send !== undefined)
        gqlPrefs.enterIsSend = updates.enter_is_send;
      if (updates.archive_keep !== undefined)
        gqlPrefs.archiveKeep = updates.archive_keep;
      if (updates.backup_freq !== undefined)
        gqlPrefs.backupFreq = updates.backup_freq;
      if (updates.media_auto_download !== undefined)
        gqlPrefs.mediaAutoDownload = updates.media_auto_download;
      if (updates.show_read_receipts !== undefined)
        gqlPrefs.showReadReceipts = updates.show_read_receipts;
      if (updates.notifications_enabled !== undefined)
        gqlPrefs.notificationsEnabled = updates.notifications_enabled;
      userPrefsApi.updatePreferences(gqlPrefs).catch(console.error);
    }, 300);
  }, []);

  const setTheme = useCallback(
    (theme) => {
      setPrefs((p) => ({ ...p, theme }));
      applyTheme(theme);
      saveToDb({ theme });
    },
    [saveToDb],
  );

  const setWallpaper = useCallback(
    (wallpaper) => {
      setPrefs((p) => ({ ...p, wallpaper }));
      applyWallpaper(wallpaper);
      saveToDb({ wallpaper });
    },
    [saveToDb],
  );

  const setChatColor = useCallback(
    (chat_color) => {
      setPrefs((p) => ({ ...p, chat_color }));
      applyChatColor(chat_color);
      saveToDb({ chat_color });
    },
    [saveToDb],
  );

  const setCustomWallpaperImage = useCallback(
    (base64) => {
      setCustomWallpaper(base64);
      localStorage.setItem("custom_wallpaper", base64);
      setPrefs((p) => ({ ...p, wallpaper: "custom" }));
      applyWallpaper("custom");
      saveToDb({ wallpaper: "custom" });
    },
    [saveToDb],
  );

  const setAIWallpaperImage = useCallback(
    (url) => {
      setAiWallpaper(url);
      localStorage.setItem("ai_wallpaper_url", url);
      setPrefs((p) => ({
        ...p,
        wallpaper: "ai_custom",
        ai_wallpaper_url: url,
      }));
      applyWallpaper("ai_custom");
      saveToDb({ wallpaper: "ai_custom", aiWallpaperUrl: url });
    },
    [saveToDb],
  );

  const setFontSize = useCallback(
    (font_size) => {
      setPrefs((p) => ({ ...p, font_size }));
      applyFontSize(font_size);
      saveToDb({ font_size });
    },
    [saveToDb],
  );

  const setEnterIsSend = useCallback(
    (enter_is_send) => {
      setPrefs((p) => ({ ...p, enter_is_send }));
      saveToDb({ enter_is_send });
    },
    [saveToDb],
  );

  const setArchiveKeep = useCallback(
    (archive_keep) => {
      setPrefs((p) => ({ ...p, archive_keep }));
      saveToDb({ archive_keep });
    },
    [saveToDb],
  );

  const setBackupFreq = useCallback(
    (backup_freq) => {
      setPrefs((p) => ({ ...p, backup_freq }));
      saveToDb({ backup_freq });
    },
    [saveToDb],
  );

  const setMediaAutoDownload = useCallback(
    (media_auto_download) => {
      setPrefs((p) => ({ ...p, media_auto_download }));
      saveToDb({ media_auto_download });
    },
    [saveToDb],
  );

  const setShowReadReceipts = useCallback(
    (show_read_receipts) => {
      setPrefs((p) => ({ ...p, show_read_receipts }));
      saveToDb({ show_read_receipts });
    },
    [saveToDb],
  );

  const setNotificationsEnabled = useCallback(
    (notifications_enabled) => {
      setPrefs((p) => ({ ...p, notifications_enabled }));
      saveToDb({ notifications_enabled });
    },
    [saveToDb],
  );

  const triggerBackup = useCallback(async () => {
    const now = new Date().toISOString();
    setLastBackup(now);
    await userPrefsApi
      .updatePreferences({ backupFreq: prefs.backup_freq })
      .catch(console.error);
    return now;
  }, [prefs.backup_freq]);

  const value = {
    prefs,
    loading,
    lastBackup,
    customWallpaper,
    aiWallpaper,
    setTheme,
    setWallpaper,
    setChatColor,
    setCustomWallpaperImage,
    setAIWallpaperImage,
    setFontSize,
    setEnterIsSend,
    setArchiveKeep,
    setBackupFreq,
    triggerBackup,
    setMediaAutoDownload,
    setShowReadReceipts,
    setNotificationsEnabled,
    WALLPAPERS,
    THEMES,
    CHAT_COLORS,
  };

  return (
    <ChatPrefsContext.Provider value={value}>
      {children}
    </ChatPrefsContext.Provider>
  );
}

export function useChatPrefs() {
  const ctx = useContext(ChatPrefsContext);
  if (!ctx)
    throw new Error("useChatPrefs must be used within ChatPrefsProvider");
  return ctx;
}
