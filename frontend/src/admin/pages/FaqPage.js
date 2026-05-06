/**
 * admin/pages/FaqPage.js — pagination + FilterTabs (All/Active/Inactive)
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Add as AddIcon,
  QuestionAnswer as FaqIcon,
  ExpandMore as ExpandMoreIcon,
  TableRows as TableIcon,
  ViewAgenda as AccordionIcon,
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
import { adminFaqApi } from "../../services/adminApi";
import { useAdminTable } from "../../hooks/useAdminTable";

export default function FaqPage() {
  const {
    rows: pagedRows,
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
  } = useAdminTable({
    fetcher: useCallback(() => adminFaqApi.getAll(true), []),
    serverSearch: false,
    clientFilter: (row, q) => {
      const lq = q.toLowerCase();
      return (
        (row.question || "").toLowerCase().includes(lq) ||
        (row.answer || "").toLowerCase().includes(lq)
      );
    },
    defaultPageSize: 10,
  });

  const [view, setView] = useState("table");
  const [dialog, setDialog] = useState({
    open: false,
    mode: "create",
    row: null,
  });
  const [form, setForm] = useState({
    question: "",
    answer: "",
    sort_order: 0,
    status: 1,
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreate = () => {
    setForm({
      question: "",
      answer: "",
      sort_order: rows.length + 1,
      status: 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "create", row: null });
  };
  const openEdit = (row) => {
    setForm({
      question: row.question || "",
      answer: row.answer || "",
      sort_order: row.sort_order ?? 0,
      status: row.status ?? 1,
    });
    setFormErr("");
    setDialog({ open: true, mode: "edit", row });
  };

  const handleSave = async () => {
    if (!form.question.trim()) {
      setFormErr("Question is required.");
      return;
    }
    if (!form.answer.trim()) {
      setFormErr("Answer is required.");
      return;
    }
    setSaving(true);
    setFormErr("");
    try {
      const input = {
        question: form.question,
        answer: form.answer,
        sort_order: Number(form.sort_order),
        status: form.status,
      };
      if (dialog.mode === "create") {
        const created = await adminFaqApi.create(input);
        prependRow(created);
      } else {
        const updated = await adminFaqApi.update(dialog.row.id, input);
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
      await adminFaqApi.delete(deleteTarget.id);
      removeRow(deleteTarget.id);
    } catch (_) {}
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const columns = [
    {
      id: "sort_order",
      label: "#",
      minWidth: 50,
      render: (r) => (
        <Typography variant="body2" sx={{ color: "#9ca3af", fontWeight: 600 }}>
          {r.sort_order}
        </Typography>
      ),
    },
    {
      id: "question",
      label: "Question",
      minWidth: 220,
      sortable: true,
      render: (r) => (
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: "#111827", maxWidth: 300 }}
          noWrap
        >
          {r.question}
        </Typography>
      ),
    },
    {
      id: "answer",
      label: "Answer",
      minWidth: 260,
      render: (r) => (
        <Typography
          variant="body2"
          sx={{ color: "#6b7280", maxWidth: 300 }}
          noWrap
        >
          {r.answer}
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
        title="FAQs"
        subtitle="Frequently asked questions"
        icon={FaqIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "FAQs" },
        ]}
        actions={
          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  py: 0.5,
                  px: 1.25,
                  "&.Mui-selected": {
                    bgcolor: "#111827",
                    color: "#fff",
                    "&:hover": { bgcolor: "#374151" },
                  },
                },
              }}
            >
              <ToggleButton value="table">
                <TableIcon sx={{ fontSize: 16 }} />
              </ToggleButton>
              <ToggleButton value="accordion">
                <AccordionIcon sx={{ fontSize: 16 }} />
              </ToggleButton>
            </ToggleButtonGroup>
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
              Add FAQ
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
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search FAQs…"
        />
      </TableToolbar>

      {view === "table" ? (
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
          emptyMessage="No FAQs found"
        />
      ) : (
        <Box>
          {loading ? (
            <Typography sx={{ color: "#9ca3af", py: 4, textAlign: "center" }}>
              Loading…
            </Typography>
          ) : total === 0 ? (
            <Typography sx={{ color: "#9ca3af", py: 4, textAlign: "center" }}>
              No FAQs found
            </Typography>
          ) : (
            <>
              {pagedRows.map((row) => (
                <Accordion
                  key={row.id}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    borderRadius: "10px !important",
                    border: "1px solid #e9eaf0",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": { border: "1px solid #6366f1" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "#6b7280" }} />}
                    sx={{ px: 2.5 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      flex={1}
                      mr={1}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#9ca3af", fontWeight: 700, minWidth: 20 }}
                      >
                        #{row.sort_order}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color: "#111827", flex: 1 }}
                      >
                        {row.question}
                      </Typography>
                      <StatusBadge
                        value={row.status === 1 ? "active" : "inactive"}
                      />
                      <RowActions
                        onEdit={() => openEdit(row)}
                        onDelete={() => setDeleteTarget(row)}
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ px: 2.5, pb: 2, borderTop: "1px solid #f3f4f6" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#6b7280", lineHeight: 1.7 }}
                    >
                      {row.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
              {/* Accordion pagination */}
              {total > rpp && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mt: 2,
                    pt: 1.5,
                    borderTop: "1px solid #e9eaf0",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                      {page * rpp + 1}–{Math.min((page + 1) * rpp, total)} of{" "}
                      {total}
                    </Typography>
                    <Button
                      size="small"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                      sx={{
                        minWidth: 32,
                        px: 1,
                        borderRadius: "7px",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        "&:disabled": { opacity: 0.4 },
                      }}
                    >
                      ‹
                    </Button>
                    <Button
                      size="small"
                      disabled={(page + 1) * rpp >= total}
                      onClick={() => setPage((p) => p + 1)}
                      sx={{
                        minWidth: 32,
                        px: 1,
                        borderRadius: "7px",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        "&:disabled": { opacity: 0.4 },
                      }}
                    >
                      ›
                    </Button>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      <FormDialog
        open={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        title={dialog.mode === "create" ? "Add FAQ" : "Edit FAQ"}
        onSubmit={handleSave}
        loading={saving}
        error={formErr}
        maxWidth="md"
      >
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            label="Question"
            value={form.question}
            onChange={(e) =>
              setForm((f) => ({ ...f, question: e.target.value }))
            }
            fullWidth
            size="small"
            autoFocus
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <TextField
            label="Answer"
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            fullWidth
            multiline
            minRows={4}
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Sort Order"
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: e.target.value }))
              }
              size="small"
              sx={{
                width: 120,
                "& .MuiOutlinedInput-root": { borderRadius: "8px" },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
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
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete FAQ"
        message="Delete this FAQ? This cannot be undone."
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
