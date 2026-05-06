/**
 * admin/pages/WallpapersPage.js — pagination + FilterTabs (All/Active/Inactive)
 */
import React, { useState, useCallback } from "react";
import {
  Box,
  Stack,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Wallpaper as WallpaperIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  RowActions,
  ConfirmDialog,
  FormDialog,
  TableToolbar,
  SearchBar,
  FilterTabs,
  STATUS_TABS,
} from "../components/common";
import {
  adminWallpaperApi,
  adminWallpaperCatApi,
} from "../../services/adminApi";
import { useAdminTableWithCat } from "../../hooks/useAdminTableWithCat";

// ─── CSS Pattern generator ────────────────────────────────────────────────────
// Returns a CSS background value for known pattern names, or null
function getCssPattern(title) {
  const t = (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const patterns = {
    polkadots: "radial-gradient(circle, #c7c7c7 1.5px, transparent 1.5px)",
    polkadot: "radial-gradient(circle, #c7c7c7 1.5px, transparent 1.5px)",
    dots: "radial-gradient(circle, #c7c7c7 1.5px, transparent 1.5px)",
    finelines:
      "repeating-linear-gradient(90deg, #d0d0d0 0px, #d0d0d0 1px, transparent 1px, transparent 12px)",
    fineline:
      "repeating-linear-gradient(90deg, #d0d0d0 0px, #d0d0d0 1px, transparent 1px, transparent 12px)",
    lines:
      "repeating-linear-gradient(90deg, #d0d0d0 0px, #d0d0d0 1px, transparent 1px, transparent 12px)",
    moroccantile:
      "conic-gradient(at 25% 25%, #e8e8e8 90deg, transparent 90deg)",
    moroccan: "conic-gradient(at 25% 25%, #e8e8e8 90deg, transparent 90deg)",
    tile: "conic-gradient(at 25% 25%, #e8e8e8 90deg, transparent 90deg)",
    chevron:
      "repeating-linear-gradient(45deg, #d4d4d4 0px, #d4d4d4 2px, transparent 2px, transparent 12px), repeating-linear-gradient(-45deg, #d4d4d4 0px, #d4d4d4 2px, transparent 2px, transparent 12px)",
    stripes:
      "repeating-linear-gradient(45deg, #d4d4d4 0px, #d4d4d4 3px, transparent 3px, transparent 14px)",
    diagonal:
      "repeating-linear-gradient(45deg, #d4d4d4 0px, #d4d4d4 2px, transparent 2px, transparent 12px)",
    grid: "linear-gradient(#d4d4d4 1px, transparent 1px), linear-gradient(90deg, #d4d4d4 1px, transparent 1px)",
    crosshatch:
      "repeating-linear-gradient(0deg, #d4d4d4 0px, #d4d4d4 1px, transparent 1px, transparent 10px), repeating-linear-gradient(90deg, #d4d4d4 0px, #d4d4d4 1px, transparent 1px, transparent 10px)",
    honeycomb:
      "radial-gradient(circle at 50% 50%, #d4d4d4 2px, transparent 2px)",
    zigzag:
      "linear-gradient(135deg, #d4d4d4 25%, transparent 25%) -10px 0, linear-gradient(225deg, #d4d4d4 25%, transparent 25%) -10px 0",
    waves:
      "radial-gradient(circle at 100% 50%, transparent 20%, #e0e0e0 21%, #e0e0e0 34%, transparent 35%)",
    plaid:
      "repeating-linear-gradient(0deg, transparent, transparent 10px, #d4d4d4 10px, #d4d4d4 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, #d4d4d4 10px, #d4d4d4 11px)",
  };
  // Try exact match first
  if (patterns[t]) return { background: patterns[t], size: "14px 14px" };
  // Partial match
  for (const [key, val] of Object.entries(patterns)) {
    if (t.includes(key) || key.includes(t))
      return { background: val, size: "14px 14px" };
  }
  return null;
}

// Deterministic pastel color from title string
function getTitleColor(title) {
  const hue =
    (title || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 35%, 80%)`;
}

// ─── WallpaperPreview component ───────────────────────────────────────────────
function WallpaperPreview({
  value,
  title,
  width = 52,
  height = 38,
  borderRadius = "7px",
  showLabel = false,
}) {
  const val = (value || "").trim();

  // 1. CSS color / gradient value
  const isColor =
    val.startsWith("#") ||
    val.startsWith("rgb") ||
    val.startsWith("hsl") ||
    val.startsWith("linear-gradient") ||
    val.startsWith("radial-gradient") ||
    val.startsWith("conic-gradient");

  if (isColor) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          background: val,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      />
    );
  }

  // 2. Image URL
  const isImage =
    val.startsWith("http") ||
    val.startsWith("/") ||
    val.startsWith("data:image");

  if (isImage) {
    return (
      <Box
        component="img"
        src={val}
        alt={title}
        sx={{
          width,
          height,
          borderRadius,
          objectFit: "cover",
          border: "1px solid rgba(0,0,0,0.08)",
          display: "block",
          flexShrink: 0,
        }}
        onError={(e) => {
          // On broken image → show pattern fallback
          const parent = e.target.parentElement;
          if (parent) {
            e.target.style.display = "none";
            parent.style.background = getTitleColor(title);
          }
        }}
      />
    );
  }

  // 3. CSS Pattern based on title
  const pattern = getCssPattern(title);
  if (pattern) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          background: `${pattern.background}, #f8f8f8`,
          backgroundSize: `${pattern.size}, ${pattern.size}`,
          border: "1px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      />
    );
  }

  // 4. Fallback — unique pastel color from title name
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        background: getTitleColor(title),
        border: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          fontSize: showLabel ? "0.55rem" : "0.5rem",
          fontWeight: 700,
          color: "rgba(0,0,0,0.35)",
          textAlign: "center",
          px: 0.5,
          lineHeight: 1.2,
        }}
      >
        {showLabel ? (
          (title || "").slice(0, 8)
        ) : (
          <WallpaperIcon sx={{ fontSize: 14, color: "rgba(0,0,0,0.25)" }} />
        )}
      </Box>
    </Box>
  );
}

export default function WallpapersPage() {
  const {
    pagedRows,
    filtered,
    categories,
    loading,
    counts,
    filterCat,
    setFilterCat,
    search,
    setSearch,
    statusTab,
    setStatusTab,
    page,
    setPage,
    rpp,
    setRpp,
    prependRow,
    replaceRow,
    removeRow,
    refresh,
  } = useAdminTableWithCat({
    dataFetcher: useCallback((catId) => adminWallpaperApi.getAll(catId), []),
    catFetcher: useCallback(() => adminWallpaperCatApi.getAll(), []),
    searchField: "title",
  });

  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    row: null,
  });
  const [form, setForm] = useState({
    title: "",
    image_url: "",
    category_id: "",
    status: 1,
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setForm({
      title: "",
      image_url: "",
      category_id: categories[0]?.id || "",
      status: 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "create", row: null });
  };
  const openEdit = (row) => {
    setForm({
      title: row.title || "",
      image_url: row.image_url || "",
      category_id: row.category?.id || "",
      status: row.status ?? 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "edit", row });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormErr("Title is required.");
      return;
    }
    if (!form.image_url.trim()) {
      setFormErr("Image URL is required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const input = {
        title: form.title,
        image_url: form.image_url,
        category_id: form.category_id,
        status: form.status,
      };
      if (dialog.mode === "create") {
        const created = await adminWallpaperApi.create(input);
        prependRow(created);
        setPage(0);
      } else {
        const updated = await adminWallpaperApi.update(dialog.row.id, input);
        replaceRow(updated.id, updated);
      }
      setDialog((d) => ({ ...d, open: false }));
    } catch (e) {
      setFormErr(e.message || "Save failed.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminWallpaperApi.delete(deleteTarget.id);
      removeRow(deleteTarget.id);
    } catch (_) {}
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const columns = [
    {
      id: "preview",
      label: "Preview",
      minWidth: 80,
      render: (r) => <WallpaperPreview value={r.image_url} title={r.title} />,
    },
    {
      id: "title",
      label: "Title",
      minWidth: 160,
      sortable: true,
      render: (r) => (
        <Typography variant="body2" fontWeight={600} sx={{ color: "#111827" }}>
          {r.title}
        </Typography>
      ),
    },
    {
      id: "category",
      label: "Category",
      minWidth: 140,
      render: (r) => (
        <Typography sx={{ textTransform: "capitalize" }}>
          {r.category?.category_name || "—"}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      render: (r) => (
        <StatusBadge value={r.status === 1 ? "active" : "inactive"} />
      ),
    },
    {
      id: "created_at",
      label: "Created",
      minWidth: 120,
      render: (r) =>
        r.created_at ? format(new Date(r.created_at), "dd MMM yyyy") : "—",
    },
    {
      id: "actions",
      label: "",
      align: "right",
      minWidth: 80,
      render: (row) => (
        <RowActions
          onEdit={() => openEdit(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Wallpapers"
        subtitle="Manage chat background wallpapers"
        icon={WallpaperIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Wallpapers" },
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
              onClick={refresh}
              disabled={loading}
              sx={{
                borderRadius: "8px",
                borderColor: "#e5e7eb",
                color: "#374151",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" },
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 15 }} />}
              onClick={openCreate}
              sx={{
                borderRadius: "8px",
                fontWeight: 600,
                textTransform: "none",
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#374151" },
                boxShadow: "none",
              }}
            >
              Add Wallpaper
            </Button>
          </Stack>
        }
      />

      <FilterTabs
        tabs={STATUS_TABS}
        value={statusTab}
        onChange={(v) => {
          setStatusTab(v);
          setPage(0);
        }}
        counts={counts}
      />

      <TableToolbar>
        <Select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          displayEmpty
          size="small"
          sx={{
            minWidth: 160,
            borderRadius: "8px",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e9eaf0" },
          }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.category_name}
            </MenuItem>
          ))}
        </Select>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search wallpapers…"
        />
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={pagedRows}
        loading={loading}
        totalCount={filtered.length}
        page={page}
        rowsPerPage={rpp}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(v) => {
          setRpp(v);
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 20, 50]}
        emptyMessage="No wallpapers found"
      />

      <FormDialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        title={dialog.mode === "create" ? "Add Wallpaper" : "Edit Wallpaper"}
        onSubmit={handleSave}
        loading={saving}
        error={formErr}
      >
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            size="small"
            autoFocus
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Image URL or Color / Gradient"
            value={form.image_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, image_url: e.target.value }))
            }
            fullWidth
            size="small"
            placeholder="https://... or linear-gradient(135deg,#FF6B6B,#FFA500)"
            helperText="Paste an image URL, hex color, or CSS gradient"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          {/* Smart live preview — image / color / CSS pattern / title fallback */}
          {(form.image_url || form.title) && (
            <WallpaperPreview
              value={form.image_url}
              title={form.title}
              width="100%"
              height={90}
              borderRadius="10px"
              showLabel
            />
          )}
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={form.category_id}
              label="Category"
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value }))
              }
              sx={{ borderRadius: "8px" }}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.status}
              label="Status"
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              sx={{ borderRadius: "8px" }}
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Wallpaper"
        message={`Delete "${deleteTarget?.title}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
