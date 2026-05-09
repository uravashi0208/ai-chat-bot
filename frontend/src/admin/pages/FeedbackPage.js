/**
 * admin/pages/FeedbackPage.js
 *
 * Server-paginated feedback list.
 */
import React, { useCallback, useState } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Feedback as FeedbackIcon } from "@mui/icons-material";
import { format } from "date-fns";
import {
  PageHeader,
  DataTable,
  UserAvatarCell,
  TableToolbar,
  RefreshButton,
} from "../components/common";
import { adminFeedbackApi, ADMIN_PAGE_SIZE } from "../../services/adminApi";
import { useAdminTable } from "../../hooks/useAdminTable";

export default function FeedbackPage() {
  const {
    rows,
    total,
    loading,
    page,
    setPage,
    rowsPerPage: rpp,
    setRowsPerPage: setRpp,
    refresh,
  } = useAdminTable({
    fetcher: useCallback(
      (limit, offset) => adminFeedbackApi.getAll(limit, offset),
      [],
    ),
    responseKey:  { rows: "items", total: "total" },
    serverSearch: false,
    statusField:  null,
    defaultPageSize: ADMIN_PAGE_SIZE,
  });

  const [detail, setDetail] = useState(null);

  const columns = [
    {
      id: "user", label: "User", minWidth: 200,
      render: (r) => (
        <UserAvatarCell
          name={r.user?.full_name || r.user?.username}
          email={r.user?.email}
          avatarUrl={r.user?.avatar_url}
        />
      ),
    },
    {
      id: "rating", label: "Rating", minWidth: 140,
      render: (r) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Rating value={r.rating} readOnly size="small"
            sx={{ "& .MuiRating-iconFilled": { color: "#f59e0b" } }}
          />
          <Typography variant="caption" sx={{ color: "#6b7280" }}>{r.rating}/5</Typography>
        </Stack>
      ),
    },
    {
      id: "message", label: "Message", minWidth: 260,
      render: (r) => (
        <Typography
          variant="body2" color="text.secondary" noWrap
          sx={{ maxWidth: 260, cursor: "pointer", "&:hover": { color: "#6366f1" } }}
          onClick={() => setDetail(r)}
        >
          {r.message || "—"}
        </Typography>
      ),
    },
    {
      id: "created_at", label: "Date", minWidth: 140,
      render: (r) => r.created_at ? format(new Date(r.created_at), "dd MMM yyyy, HH:mm") : "—",
    },
    {
      id: "actions", label: "", align: "right", minWidth: 80,
      render: (row) => (
        <Button
          size="small" variant="outlined"
          onClick={() => setDetail(row)}
          sx={{
            borderRadius: "7px", borderColor: "#e5e7eb", color: "#374151",
            fontSize: "0.75rem", textTransform: "none",
            "&:hover": { borderColor: "#6366f1", color: "#6366f1" },
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Feedback"
        subtitle="User ratings and comments"
        icon={FeedbackIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Feedback" },
        ]}
        actions={<RefreshButton onClick={refresh} loading={loading} />}
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        totalCount={total}
        page={page}
        rowsPerPage={rpp}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => { setRpp(v); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No feedback submitted yet."
      />

      {/* Detail dialog */}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>
          Feedback Detail
        </DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2.5}>
              <UserAvatarCell
                name={detail.user?.full_name || detail.user?.username}
                email={detail.user?.email}
                avatarUrl={detail.user?.avatar_url}
                size={40}
              />
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Rating value={detail.rating} readOnly
                  sx={{ "& .MuiRating-iconFilled": { color: "#f59e0b" } }}
                />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {detail.rating} / 5 stars
                </Typography>
              </Stack>
              <Box sx={{ p: 2, bgcolor: "#f9fafb", borderRadius: "10px", border: "1px solid #e9eaf0" }}>
                <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.6 }}>
                  {detail.message || "No message."}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Submitted:{" "}
                {detail.created_at
                  ? format(new Date(detail.created_at), "dd MMM yyyy, HH:mm")
                  : "—"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDetail(null)}
            sx={{ borderRadius: "8px", textTransform: "none", color: "#374151" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
