/**
 * admin/pages/CmsEditorPage.js
 * Props: type — "privacy" | "terms"
 */
import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Stack,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { Article as CmsIcon, Save as SaveIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { PageHeader, SectionCard } from "../components/common";
import { adminCmsApi } from "../../services/adminApi";

export default function CmsEditorPage({ type = "privacy" }) {
  const isPrivacy = type === "privacy";
  const [data, setData] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const hasFetchedCms = useRef(false);
  const prevIsPrivacy = useRef(isPrivacy);
  useEffect(() => {
    // Guard: skip StrictMode's second mount-invocation; but DO re-fetch if isPrivacy changes
    if (hasFetchedCms.current && prevIsPrivacy.current === isPrivacy) return;
    hasFetchedCms.current = true;
    prevIsPrivacy.current = isPrivacy;

    let alive = true;
    setLoading(true);
    (isPrivacy
      ? adminCmsApi.getPrivacyPolicy()
      : adminCmsApi.getTermsConditions()
    )
      .then((d) => {
        if (!alive) setLoading(false);
        setData(d);
        setTitle(
          d?.title || (isPrivacy ? "Privacy Policy" : "Terms & Conditions"),
        );
        setContent(d?.content || "");
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isPrivacy]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const saved = isPrivacy
        ? await adminCmsApi.upsertPrivacyPolicy(title, content)
        : await adminCmsApi.upsertTermsConditions(title, content);
      setData(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message || "Save failed.");
    }
    setSaving(false);
  };

  const pageTitle = isPrivacy ? "Privacy Policy" : "Terms & Conditions";

  return (
    <Box>
      <PageHeader
        title={pageTitle}
        subtitle={`Edit and publish ${pageTitle.toLowerCase()}`}
        icon={CmsIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "CMS" },
          { label: pageTitle },
        ]}
        actions={
          <Button
            variant="contained"
            size="small"
            startIcon={
              saving ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SaveIcon sx={{ fontSize: 15 }} />
              )
            }
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "#111827",
              "&:hover": { bgcolor: "#374151" },
              boxShadow: "none",
            }}
          >
            {saving ? "Saving…" : "Save & Publish"}
          </Button>
        }
      />

      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: "10px" }}>
          {pageTitle} saved successfully.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>
          {error}
        </Alert>
      )}

      {data?.updated_at && (
        <Typography
          variant="caption"
          sx={{ color: "#9ca3af", mb: 2, display: "block" }}
        >
          Last updated:{" "}
          {format(new Date(data.updated_at), "dd MMM yyyy, HH:mm")}
        </Typography>
      )}

      <SectionCard title="Document Editor">
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} sx={{ color: "#6366f1" }} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              label="Content (HTML or plain text)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              minRows={18}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  fontSize: "0.85rem",
                },
              }}
              placeholder="Enter your content here. HTML is supported."
            />
          </Stack>
        )}
      </SectionCard>

      {/* Live preview */}
      {!loading && content && (
        <SectionCard
          title="Preview"
          subtitle="Rendered output"
          sx={{ mt: 2.5 }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              bgcolor: "#fafafa",
              border: "1px solid #f3f4f6",
              "& h1,h2,h3": { color: "#111827", mb: 1 },
              "& p": { color: "#374151", lineHeight: 1.7, mb: 1.5 },
              "& a": { color: "#6366f1" },
              "& ul,ol": { color: "#374151", pl: 3 },
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </SectionCard>
      )}
    </Box>
  );
}
