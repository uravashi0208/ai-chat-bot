/**
 * admin/pages/EmojiListPage.js
 *
 * Server-paginated emoji list with category filter and status tabs.
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
import { EmojiEmotions as EmojiIcon } from "@mui/icons-material";
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
import { adminEmojiApi, adminEmojiCatApi } from "../../services/adminApi";
import { useAdminTableWithCat } from "../../hooks/useAdminTableWithCat";
import { useToast } from "../context/ToastContext";

export default function EmojiListPage() {
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
    dataFetcher: useCallback((params) => adminEmojiApi.getAll(params), []),
    catFetcher: useCallback(() => adminEmojiCatApi.getAll(), []),
  });

  const toast = useToast();

  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    row: null,
  });
  const [form, setForm] = useState({ emoji: "", categoryId: "", status: 1 });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setForm({ emoji: "", categoryId: categories[0]?.id || "", status: 1 });
    setFormErr("");
    setDialog({ open: true, mode: "create", row: null });
  };

  const openEdit = (row) => {
    setForm({
      emoji: row.emoji || "",
      categoryId: row.category?.id || "",
      status: row.status ?? 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "edit", row });
  };

  const handleSave = async () => {
    if (!form.emoji.trim()) {
      setFormErr("Emoji is required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const payload = {
        emoji: form.emoji,
        categoryId: form.categoryId,
        status: form.status,
      };
      if (dialog.mode === "create") {
        const created = await adminEmojiApi.create(payload);
        prependRow(created);
        setPage(0);
        toast.success("Emoji created successfully!");
      } else {
        const updated = await adminEmojiApi.update(dialog.row.id, payload);
        replaceRow(updated.id, updated);
        toast.success("Emoji updated successfully!");
      }
      setDialog((d) => ({ ...d, open: false }));
    } catch (e) {
      setFormErr(e.message || "Save failed.");
      toast.error(e.message || "Failed to save emoji.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminEmojiApi.delete(deleteTarget.id);
      removeRow(deleteTarget.id);
      toast.success("Emoji deleted.");
    } catch (_) {
      toast.error("Failed to delete emoji.");
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const columns = [
    {
      id: "emoji",
      label: "Emoji",
      minWidth: 80,
      render: (r) => (
        <Typography sx={{ fontSize: "1.75rem", lineHeight: 1 }}>
          {r.emoji}
        </Typography>
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
      minWidth: 130,
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
        title="Emojis"
        subtitle="Manage emoji library"
        icon={EmojiIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Emojis" },
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <RefreshButton onClick={refresh} loading={loading} />
            <AddButton onClick={openCreate} label="Add Emoji" />
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
          placeholder="Search emojis…"
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
        emptyMessage="No emojis found"
      />

      <FormDialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        title={dialog.mode === "create" ? "Add Emoji" : "Edit Emoji"}
        onSubmit={handleSave}
        loading={saving}
        error={formErr}
        submitLabel={dialog.mode === "create" ? "Create" : "Save"}
      >
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label="Emoji"
            value={form.emoji}
            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            fullWidth
            size="small"
            autoFocus
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                fontSize: "1.5rem",
              },
            }}
          />
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
        title="Delete Emoji"
        message={`Delete emoji "${deleteTarget?.emoji}"?`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
