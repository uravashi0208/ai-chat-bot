/**
 * admin/pages/ContactUsPage.js
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  ContactMail as ContactIcon,
  MarkEmailRead as MarkReadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  TableToolbar,
  SearchBar,
} from "../components/common";
import { adminContactUsApi } from "../../services/adminApi";

const PAGE_SIZE = 10;

export default function ContactUsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminContactUsApi.getAll(rpp, page * rpp);
      setRows(data.items || []);
      setTotal(data.total || 0);
    } catch (_) {}
    setLoading(false);
  }, [page, rpp]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (item) => {
    if (item.is_read) return;
    setMarking(true);
    try {
      const updated = await adminContactUsApi.markRead(item.id);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (detail?.id === updated.id) setDetail(updated);
    } catch (_) {}
    setMarking(false);
  };

  const filtered = rows.filter(
    (r) =>
      !search ||
      (r.name || r.email || r.subject || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const columns = [
    {
      id: "name",
      label: "Name",
      minWidth: 150,
      render: (r) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: "#111827" }}
          >
            {r.name || "—"}
          </Typography>
          {!r.is_read && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#f59e0b",
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
      ),
    },
    {
      id: "email",
      label: "Email",
      minWidth: 180,
      render: (r) => (
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          {r.email || "—"}
        </Typography>
      ),
    },
    {
      id: "subject",
      label: "Subject",
      minWidth: 180,
      render: (r) => (
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: 180, color: "#374151" }}
        >
          {r.subject || "—"}
        </Typography>
      ),
    },
    {
      id: "is_read",
      label: "Status",
      minWidth: 100,
      render: (r) => <StatusBadge value={r.is_read ? "read" : "unread"} />,
    },
    {
      id: "created_at",
      label: "Date",
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
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            setDetail(row);
            handleMarkRead(row);
          }}
          sx={{
            borderRadius: "7px",
            borderColor: "#e5e7eb",
            color: "#374151",
            fontSize: "0.75rem",
            textTransform: "none",
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
        title="Contact Us"
        subtitle="Support messages from users"
        icon={ContactIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Contact Us" },
        ]}
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
            onClick={load}
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
        }
      />

      <TableToolbar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search messages…"
        />
      </TableToolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        totalCount={total}
        page={page}
        rowsPerPage={rpp}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => {
          setRpp(v);
          setPage(0);
        }}
        emptyMessage="No contact messages found."
      />

      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            color: "#111827",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Message Detail
          {detail && !detail.is_read && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<MarkReadIcon sx={{ fontSize: 14 }} />}
              onClick={() => handleMarkRead(detail)}
              disabled={marking}
              sx={{
                borderRadius: "7px",
                fontSize: "0.75rem",
                textTransform: "none",
                borderColor: "#e5e7eb",
                color: "#374151",
              }}
            >
              Mark as Read
            </Button>
          )}
        </DialogTitle>
        <DialogContent>
          {detail && (
            <Stack spacing={2}>
              {[
                { label: "Name", value: detail.name },
                { label: "Email", value: detail.email },
                { label: "Phone", value: detail.phone },
                { label: "Subject", value: detail.subject },
              ].map(({ label, value }) =>
                value ? (
                  <Box key={label}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        fontSize: "0.7rem",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#374151", mt: 0.25 }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ) : null,
              )}
              <Divider sx={{ borderColor: "#e9eaf0" }} />
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  Message
                </Typography>
                <Box
                  sx={{
                    mt: 0.75,
                    p: 2,
                    bgcolor: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #e9eaf0",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#374151", lineHeight: 1.6 }}
                  >
                    {detail.message || "—"}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Received:{" "}
                {detail.created_at
                  ? format(new Date(detail.created_at), "dd MMM yyyy, HH:mm")
                  : "—"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDetail(null)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              color: "#374151",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
