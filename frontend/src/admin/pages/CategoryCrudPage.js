/**
 * admin/pages/CategoryCrudPage.js
 * Generic CRUD page with pagination + FilterTabs (All/Active/Inactive)
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
  Button,
} from "@mui/material";
import {
  Add as AddIcon,
  Category as CategoryIcon,
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
import { useAdminTable } from "../../hooks/useAdminTable";
import { useToast } from "../context/ToastContext";

const STATUS_OPTIONS = [
  { value: 1, label: "Active" },
  { value: 0, label: "Inactive" },
];

export default function CategoryCrudPage({
  api,
  title = "Categories",
  subtitle,
  icon: Icon = CategoryIcon,
}) {
  const {
    rows: pagedRows,
    allRows,
    total,
    loading,
    counts,
    page,
    setPage,
    rowsPerPage: rpp,
    setRowsPerPage: setRpp,
    search,
    setSearch,
    statusTab,
    setStatusTab,
    prependRow,
    replaceRow,
    removeRow,
    refresh,
  } = useAdminTable({
    fetcher: useCallback(() => api.getAll(), [api]),
    serverSearch: false,
    clientFilter: (row, q) =>
      (row.category_name || "").toLowerCase().includes(q.toLowerCase()),
    defaultPageSize: 10,
  });

  const toast = useToast();

  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    row: null,
  });
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setFormName("");
    setFormStatus(1);
    setFormErr("");
    setDialog({ open: true, mode: "create", row: null });
  };
  const openEdit = (row) => {
    setFormName(row.category_name || "");
    setFormStatus(row.status ?? 1);
    setFormErr("");
    setDialog({ open: true, mode: "edit", row });
  };
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormErr("Category name is required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      if (dialog.mode === "create") {
        const created = await api.create({
          categoryName: formName.trim(),
          status: formStatus,
        });
        prependRow(created);
        toast.success(
          `${title.replace(" Categories", "")} created successfully!`,
        );
      } else {
        const updated = await api.update(dialog.row.id, {
          categoryName: formName.trim(),
          status: formStatus,
        });
        replaceRow(updated.id, updated);
        toast.success("Category updated successfully!");
      }
      closeDialog();
    } catch (e) {
      setFormErr(e.message || "Save failed.");
      toast.error(e.message || "Failed to save category.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(deleteTarget.id);
      removeRow(deleteTarget.id);
      toast.success("Category deleted.");
    } catch (_) {
      toast.error("Failed to delete category.");
    }
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const columns = [
    {
      id: "category_name",
      label: "Category Name",
      minWidth: 200,
      sortable: true,
      render: (r) => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: "#111827", textTransform: "capitalize" }}
        >
          {r.category_name}
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
        title={title}
        subtitle={subtitle || `Manage ${title.toLowerCase()}`}
        icon={Icon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: title },
        ]}
        actions={
          <>
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
                fontSize: "0.8125rem",
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
              Add {title.replace(" Categories", "")}
            </Button>
          </>
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
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Search ${title.toLowerCase()}…`}
        />
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={pagedRows}
        loading={loading}
        totalCount={total}
        page={page}
        rowsPerPage={rpp}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(v) => {
          setRpp(v);
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 20, 50]}
        emptyMessage={`No ${title.toLowerCase()} found`}
      />

      <FormDialog
        open={dialog.open}
        onClose={closeDialog}
        title={
          dialog.mode === "create"
            ? `Add ${title.replace(" Categories", "")}`
            : "Edit Category"
        }
        onSubmit={handleSave}
        loading={saving}
        error={formErr}
        submitLabel={dialog.mode === "create" ? "Create" : "Save"}
      >
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label="Category Name"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              setFormErr("");
            }}
            fullWidth
            size="small"
            autoFocus
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formStatus}
              label="Status"
              onChange={(e) => setFormStatus(e.target.value)}
              sx={{ borderRadius: "8px" }}
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message={`Delete "${deleteTarget?.category_name}"? This may affect related items.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
