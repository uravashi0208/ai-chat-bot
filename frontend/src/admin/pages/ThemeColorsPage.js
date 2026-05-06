/**
 * admin/pages/ThemeColorsPage.js — pagination + FilterTabs (All/Active/Inactive)
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
} from "@mui/material";
import {
  Add as AddIcon,
  Palette as PaletteIcon,
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
import { adminThemeColorApi, adminThemeCatApi } from "../../services/adminApi";
import { useAdminTableWithCat } from "../../hooks/useAdminTableWithCat";

export default function ThemeColorsPage() {
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
    dataFetcher: useCallback((catId) => adminThemeColorApi.getAll(catId), []),
    catFetcher: useCallback(() => adminThemeCatApi.getAll(), []),
    searchField: "color_name",
  });

  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    row: null,
  });
  const [form, setForm] = useState({
    color_name: "",
    color_code: "#6366f1",
    category_id: "",
    status: 1,
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setForm({
      color_name: "",
      color_code: "#6366f1",
      category_id: categories[0]?.id || "",
      status: 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "create", row: null });
  };
  const openEdit = (row) => {
    setForm({
      color_name: row.color_name || "",
      color_code: row.color_code || "#6366f1",
      category_id: row.category?.id || "",
      status: row.status ?? 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "edit", row });
  };

  const handleSave = async () => {
    if (!form.color_name.trim()) {
      setFormErr("Color name is required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const input = {
        color_name: form.color_name,
        color_code: form.color_code,
        category_id: form.category_id,
        status: form.status,
      };
      if (dialog.mode === "create") {
        const created = await adminThemeColorApi.create(input);
        prependRow(created);
        setPage(0);
      } else {
        const updated = await adminThemeColorApi.update(dialog.row.id, input);
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
      await adminThemeColorApi.delete(deleteTarget.id);
      removeRow(deleteTarget.id);
    } catch (_) {}
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const columns = [
    {
      id: "color_name",
      label: "Color Name",
      minWidth: 160,
      sortable: true,
      render: (r) => (
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "7px",
              background: r.color_code,
              border: "1px solid rgba(0,0,0,0.08)",
              flexShrink: 0,
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          />
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: "#111827" }}
          >
            {r.color_name}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "color_code",
      label: "Color Code",
      minWidth: 200,
      render: (r) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "monospace",
              color: "#6b7280",
              fontSize: "0.78rem",
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={r.color_code}
          >
            {r.color_code}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "category",
      label: "Category",
      minWidth: 140,
      render: (r) => r.category?.category_name || "—",
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
        title="Theme Colors"
        subtitle="Manage chat theme color palette"
        icon={PaletteIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Theme Colors" },
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
              Add Color
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
          placeholder="Search colors…"
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
        emptyMessage="No colors found"
      />

      <FormDialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        title={dialog.mode === "create" ? "Add Color" : "Edit Color"}
        onSubmit={handleSave}
        loading={saving}
        error={formErr}
        submitLabel={dialog.mode === "create" ? "Create" : "Save"}
      >
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label="Color Name"
            value={form.color_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, color_name: e.target.value }))
            }
            fullWidth
            size="small"
            autoFocus
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          {/* Live preview — supports both hex and linear-gradient */}
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "10px",
                flexShrink: 0,
                background: form.color_code || "#e5e7eb",
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <TextField
              label="Hex Code or Gradient"
              value={form.color_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, color_code: e.target.value }))
              }
              fullWidth
              size="small"
              placeholder="e.g. #FF6B6B or linear-gradient(135deg,#FF6B6B,#FFA500)"
              helperText="Supports hex (#FF0000), rgb, or CSS gradient"
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                },
              }}
            />
          </Stack>
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
        title="Delete Color"
        message={`Delete "${deleteTarget?.color_name}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
