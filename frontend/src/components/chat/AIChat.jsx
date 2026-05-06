import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  CircularProgress,
  alpha,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { formatMessageTime } from "../../utils/helpers";

const SYSTEM_PROMPT = `You are a helpful AI assistant embedded in a WhatsApp-like chat app. 
Be concise, friendly, and helpful. Format responses clearly. 
Use markdown for code blocks and lists when appropriate.`;

const SUGGESTIONS = [
  "Summarize my last conversation",
  "Help me write a message",
  "What can you do?",
  "Tell me a joke 😄",
];

function AIBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === "assistant";

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isAI ? "flex-start" : "flex-end",
        px: 2,
        pb: 1,
      }}
    >
      {isAI && (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            mr: 1,
            mt: 0.5,
          }}
        >
          <AIIcon sx={{ color: "#fff", fontSize: 14 }} />
        </Box>
      )}
      <Box sx={{ maxWidth: "75%", position: "relative" }}>
        <Box
          sx={{
            bgcolor: isAI ? "#1e2a33" : "#005c4b",
            borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
            px: 1.75,
            py: 1,
            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {msg.loading ? (
            <Box
              sx={{ display: "flex", gap: 0.75, alignItems: "center", py: 0.5 }}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    opacity: 0.6,
                    animation: "bounce 1.2s infinite",
                    animationDelay: `${i * 0.2}s`,
                    "@keyframes bounce": {
                      "0%,60%,100%": { transform: "translateY(0)" },
                      "30%": { transform: "translateY(-4px)", opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "#e9edef",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.55,
                fontSize: "0.9375rem",
              }}
            >
              {msg.content}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.25,
            justifyContent: isAI ? "flex-start" : "flex-end",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontSize: "0.72rem" }}
          >
            {formatMessageTime(msg.time)}
          </Typography>
          {isAI && !msg.loading && (
            <Tooltip title={copied ? "Copied!" : "Copy"}>
              <IconButton
                size="small"
                onClick={copy}
                sx={{
                  width: 18,
                  height: 18,
                  color: copied ? "primary.main" : "text.disabled",
                }}
              >
                {copied ? (
                  <CheckIcon sx={{ fontSize: 12 }} />
                ) : (
                  <CopyIcon sx={{ fontSize: 12 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI assistant ✨ How can I help you today?",
      time: new Date().toISOString(),
      id: "init",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const userText = (text || input).trim();
      if (!userText || loading) return;
      setInput("");

      const userMsg = {
        role: "user",
        content: userText,
        time: new Date().toISOString(),
        id: `u-${Date.now()}`,
      };
      const loadingMsg = {
        role: "assistant",
        content: "",
        loading: true,
        time: new Date().toISOString(),
        id: `a-${Date.now()}`,
      };
      setMessages((p) => [...p, userMsg, loadingMsg]);
      setLoading(true);

      const historyForAPI = [...messages, userMsg]
        .filter((m) => !m.loading && m.id !== "init" && m.id !== "cleared")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const API_URL =
          process.env.REACT_APP_API_URL || "http://localhost:4000";
        const res = await fetch(`${API_URL}/api/claude`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: historyForAPI,
          }),
        });
        const data = await res.json();
        const reply =
          data?.content?.[0]?.text ||
          "Sorry, I couldn't respond. Please try again.";
        setMessages((p) =>
          p.map((m) =>
            m.loading ? { ...m, loading: false, content: reply } : m,
          ),
        );
      } catch {
        setMessages((p) =>
          p.map((m) =>
            m.loading
              ? {
                  ...m,
                  loading: false,
                  content: "⚠️ Network error. Please try again.",
                }
              : m,
          ),
        );
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, messages],
  );

  const clear = () =>
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you? ✨",
        time: new Date().toISOString(),
        id: "cleared",
      },
    ]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.chatPanel",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
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
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(124,58,237,0.4)",
          }}
        >
          <AIIcon sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: "text.primary",
              fontSize: "0.9375rem",
            }}
          >
            AI Assistant
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#00a884",
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: "primary.main", fontSize: "0.75rem" }}
            >
              Always available
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Clear chat">
          <IconButton
            size="small"
            onClick={clear}
            sx={{ color: "text.secondary" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
        {messages.map((msg) => (
          <AIBubble key={msg.id} msg={msg} />
        ))}

        {/* Suggestions (only at start) */}
        {messages.length === 1 && (
          <Box sx={{ px: 2, mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
                display: "block",
                mb: 1,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                fontSize: "0.7rem",
              }}
            >
              Try asking
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  onClick={() => sendMessage(s)}
                  sx={{
                    bgcolor: alpha("#7c3aed", 0.12),
                    color: "#c4b5fd",
                    border: "1px solid",
                    borderColor: alpha("#7c3aed", 0.25),
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    "&:hover": { bgcolor: alpha("#7c3aed", 0.22) },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          flexShrink: 0,
          bgcolor: "background.elevated",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              bgcolor: alpha("#8696a0", 0.08),
              borderRadius: 3.5,
              px: 2,
              py: 0.75,
              border: "1px solid transparent",
              transition: "all 0.2s",
              "&:focus-within": {
                bgcolor: alpha("#8696a0", 0.12),
                borderColor: alpha("#7c3aed", 0.4),
              },
            }}
          >
            <InputBase
              inputRef={inputRef}
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything…"
              disabled={loading}
              sx={{
                width: "100%",
                fontSize: "0.9375rem",
                color: "text.primary",
                "& textarea::placeholder": { color: "text.disabled" },
              }}
            />
          </Box>
          <Box
            component="button"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
              transition: "all 0.2s",
              "&:hover:not(:disabled)": {
                transform: "scale(1.08)",
                boxShadow: "0 4px 16px rgba(124,58,237,0.45)",
              },
              "&:active": { transform: "scale(0.95)" },
              "&:disabled": { opacity: 0.4, cursor: "not-allowed" },
            }}
          >
            {loading ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              <SendIcon sx={{ color: "#fff", fontSize: 18, ml: 0.25 }} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
