/**
 * admin/pages/WallpapersPage.js
 *
 * Server-paginated wallpapers list with category filter and status tabs.
 */
import React, { useState, useCallback } from "react";
import {
  Box,
  Stack,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
} from "@mui/material";
import { Wallpaper as WallpaperIcon } from "@mui/icons-material";
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
  RefreshButton,
  AddButton,
} from "../components/common";
import {
  adminWallpaperApi,
  adminWallpaperCatApi,
} from "../../services/adminApi";
import { useAdminTableWithCat } from "../../hooks/useAdminTableWithCat";
import { useToast } from "../context/ToastContext";

// ─── CSS Pattern generator ─────────────────────────────────────────────────────

function getCssPattern(title) {
  const t = (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const patterns = {
    polkadots: "radial-gradient(circle, #c7c7c7 1.5px, transparent 1.5px)",
    dots: "radial-gradient(circle, #c7c7c7 1.5px, transparent 1.5px)",
    finelines:
      "repeating-linear-gradient(90deg, #d0d0d0 0px, #d0d0d0 1px, transparent 1px, transparent 12px)",
    moroccantile:
      "conic-gradient(at 25% 25%, #e8e8e8 90deg, transparent 90deg)",
    chevron:
      "repeating-linear-gradient(45deg, #d4d4d4 0px, #d4d4d4 2px, transparent 2px, transparent 12px), repeating-linear-gradient(-45deg, #d4d4d4 0px, #d4d4d4 2px, transparent 2px, transparent 12px)",
    stripes:
      "repeating-linear-gradient(45deg, #d4d4d4 0px, #d4d4d4 3px, transparent 3px, transparent 14px)",
    grid: "linear-gradient(#d4d4d4 1px, transparent 1px), linear-gradient(90deg, #d4d4d4 1px, transparent 1px)",
    honeycomb:
      "radial-gradient(circle at 50% 50%, #d4d4d4 2px, transparent 2px)",
    waves:
      "radial-gradient(circle at 100% 50%, transparent 20%, #e0e0e0 21%, #e0e0e0 34%, transparent 35%)",
  };
  if (patterns[t]) return { background: patterns[t], size: "14px 14px" };
  for (const [key, val] of Object.entries(patterns)) {
    if (t.includes(key) || key.includes(t))
      return { background: val, size: "14px 14px" };
  }
  return null;
}

function getTitleColor(title) {
  const hue =
    (title || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 35%, 80%)`;
}

// ─── WallpaperPreview ──────────────────────────────────────────────────────────

function WallpaperPreview({
  value,
  title,
  width = 52,
  height = 38,
  borderRadius = "7px",
  showLabel = false,
}) {
  const val = (value || "").trim();
  const isColor =
    val.startsWith("#") ||
    val.startsWith("rgb") ||
    val.startsWith("hsl") ||
    val.startsWith("linear-gradient") ||
    val.startsWith("radial-gradient") ||
    val.startsWith("conic-gradient");
  const isImage =
    val.startsWith("http") ||
    val.startsWith("/") ||
    val.startsWith("data:image");

  if (isColor) {
    return (
      <Box
        sx={{
          width,
          height,
          borderRadius,
          background: val,
          border: "1px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      />
    );
  }
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
          e.target.style.display = "none";
          if (e.target.parentElement)
            e.target.parentElement.style.background = getTitleColor(title);
        }}
      />
    );
  }
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
      <WallpaperIcon sx={{ fontSize: 14, color: "rgba(0,0,0,0.25)" }} />
    </Box>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WallpapersPage() {
  const {
    pagedRows,
    categories,
    loading,
    total,
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
    dataFetcher: useCallback((params) => adminWallpaperApi.getAll(params), []),
    catFetcher: useCallback(() => adminWallpaperCatApi.getAll(), []),
  });

  const toast = useToast();

  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    row: null,
  });
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    categoryId: "",
    status: 1,
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setForm({
      title: "",
      imageUrl: "",
      categoryId: categories[0]?.id || "",
      status: 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "create", row: null });
  };

  const openEdit = (row) => {
    setForm({
      title: row.title || "",
      imageUrl: row.image_url || "",
      categoryId: row.category?.id || "",
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
    if (!form.imageUrl.trim()) {
      setFormErr("Image URL is required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl,
        categoryId: form.categoryId,
        status: form.status,
      };
      if (dialog.mode === "create") {
        const created = await adminWallpaperApi.create(payload);
        prependRow(created);
        setPage(0);
        toast.success("Wallpaper created successfully!");
      } else {
        const updated = await adminWallpaperApi.update(dialog.row.id, payload);
        replaceRow(updated.id, updated);
        toast.success("Wallpaper updated successfully!");
      }
      setDialog((d) => ({ ...d, open: false }));
    } catch (e) {
      setFormErr(e.message || "Save failed.");
      toast.error(e.message || "Failed to save wallpaper.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminWallpaperApi.delete(deleteTarget.id);
      removeRow(deleteTarget.id);
      toast.success("Wallpaper deleted.");
    } catch (_) {
      toast.error("Failed to delete wallpaper.");
    }
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
            <RefreshButton onClick={refresh} loading={loading} />
            <AddButton onClick={openCreate} label="Add Wallpaper" />
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
        totalCount={total}
        page={page}
        rowsPerPage={rpp}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => {
          setRpp(v);
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
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
            value={form.imageUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, imageUrl: e.target.value }))
            }
            fullWidth
            size="small"
            placeholder="https://… or linear-gradient(135deg,#FF6B6B,#FFA500)"
            helperText="Paste an image URL, hex color, or CSS gradient"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          {(form.imageUrl || form.title) && (
            <WallpaperPreview
              value={form.imageUrl}
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
              value={form.categoryId}
              label="Category"
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
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
