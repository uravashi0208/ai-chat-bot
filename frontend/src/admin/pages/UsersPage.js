/**
 * admin/pages/UsersPage.js
 *
 * Matches screenshot design:
 * - Filter tabs: All (20) / Active (2) / Pending (10) / Banned (6) / Rejected (2)
 * - Toolbar: Role dropdown, Search input, column options (⋮)
 * - Table: Checkbox, Name (avatar+email), Phone, Company, Role, Status, Edit (✏), ⋮
 * - Footer: Dense toggle, Rows per page, 1-5 of 20, < >
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Button,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import {
  PageHeader,
  DataTable,
  SearchBar,
  StatusBadge,
  UserAvatarCell,
  ConfirmDialog,
  FilterTabs,
  TableToolbar,
} from "../components/common";
import { adminUsersApi } from "../../services/adminApi";

const PAGE_SIZE = 5;

// status numeric map: 1=active, 0=inactive, we also handle string statuses from API
function getUserStatusLabel(u) {
  if (u.status === "online") return "online";
  return "offline";
}

// Row action menu
function RowMenu({ row, onToggleStatus }) {
  const [anchor, setAnchor] = useState(null);
  const statusLabel = getUserStatusLabel(row);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
        sx={{
          color: "#9ca3af",
          borderRadius: "6px",
          "&:hover": { color: "#374151", bgcolor: "#f3f4f6" },
        }}
      >
        <MoreVertIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUsersApi.getAll(100, 0, search);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (_) {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(0);
  }, [search, statusTab]);

  // Client-side filtering by status tab
  const filtered = useMemo(() => {
    let arr = users;
    if (statusTab !== "all") {
      arr = arr.filter((u) => getUserStatusLabel(u) === statusTab);
    }

    return arr;
  }, [users, statusTab]);

  // Count per tab
  const counts = useMemo(
    () => ({
      all: users.length,
      online: users.filter((u) => getUserStatusLabel(u) === "online").length,
      offline: users.filter((u) => getUserStatusLabel(u) === "offline").length,
    }),
    [users],
  );

  // Paginate the filtered result client-side
  const pagedRows = filtered.slice(page * rpp, page * rpp + rpp);

  const handleToggleStatus = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const nextStatus = getUserStatusLabel(confirm) === "banned" ? 1 : 0;
      const updated = await adminUsersApi.setStatus(confirm.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (_) {}
    setActionLoading(false);
    setConfirm(null);
  };

  // Role options from data
  const roleOptions = useMemo(() => {
    return users.map((r) => ({ value: r.status, label: r.status }));
  }, [users]);

  // Column options menu
  const [colMenuAnchor, setColMenuAnchor] = useState(null);

  const columns = [
    {
      id: "name",
      label: "Name",
      minWidth: 200,
      sortable: true,
      render: (row) => (
        <UserAvatarCell
          name={row.full_name || row.username}
          email={row.email}
          avatarUrl={row.avatar_url}
        />
      ),
    },
    {
      id: "phone",
      label: "Phone number",
      minWidth: 140,
      render: (r) => (
        <Typography variant="body2" sx={{ color: "#374151" }}>
          {r.phone || "—"}
        </Typography>
      ),
    },
    {
      id: "company",
      label: "Company",
      minWidth: 160,
      render: (r) => (
        <Typography variant="body2" sx={{ color: "#374151" }}>
          {r.company || "—"}
        </Typography>
      ),
    },
    {
      id: "role",
      label: "Role",
      minWidth: 140,
      render: (r) => (
        <Typography variant="body2" sx={{ color: "#374151" }}>
          {r.role || "User"}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 100,
      render: (r) => <StatusBadge value={getUserStatusLabel(r)} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage registered users and their status"
        icon={PeopleIcon}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Users" },
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

      {/* ── Filter tabs ── */}
      <FilterTabs
        tabs={[
          { label: "All", value: "all" },
          { label: "Online", value: "online" },
          { label: "Offline", value: "offline" },
        ]}
        value={statusTab}
        onChange={(v) => {
          setStatusTab(v);
          setPage(0);
        }}
        counts={counts}
      />

      {/* ── Toolbar ── */}
      <TableToolbar>
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search..."
          sx={{ flex: 1, maxWidth: 460 }}
        />
        <Box sx={{ ml: "auto" }}>
          <Tooltip title="Column options">
            <IconButton
              size="small"
              onClick={(e) => setColMenuAnchor(e.currentTarget)}
              sx={{
                color: "#6b7280",
                borderRadius: "8px",
                border: "1px solid #e9eaf0",
                "&:hover": { bgcolor: "#f3f4f6" },
              }}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={colMenuAnchor}
            open={Boolean(colMenuAnchor)}
            onClose={() => setColMenuAnchor(null)}
            PaperProps={{
              sx: {
                borderRadius: "10px",
                border: "1px solid #e9eaf0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              },
            }}
          >
            <MenuItem
              disabled
              sx={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}
            >
              COLUMNS
            </MenuItem>
            <Divider />
            {["Name", "Phone", "Company", "Role", "Status"].map((col) => (
              <MenuItem key={col} sx={{ fontSize: "0.875rem" }}>
                {col}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </TableToolbar>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        rows={pagedRows}
        loading={loading}
        totalCount={filtered.length}
        page={page}
        rowsPerPage={rpp}
        onPageChange={setPage}
        onRowsPerPageChange={(v) => {
          setRpp(v);
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 20, 50]}
        selectable
        emptyMessage="No users found"
        rowKey="id"
      />

      {/* ── Confirm ban/unban ── */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          getUserStatusLabel(confirm || {}) === "banned"
            ? "Unban User"
            : "Ban User"
        }
        message={
          getUserStatusLabel(confirm || {}) === "banned"
            ? `Restore access for "${confirm?.full_name || confirm?.username}"?`
            : `Are you sure you want to ban "${confirm?.full_name || confirm?.username}"? They will no longer be able to log in.`
        }
        confirmLabel={
          getUserStatusLabel(confirm || {}) === "banned" ? "Unban" : "Ban"
        }
        confirmColor={
          getUserStatusLabel(confirm || {}) === "banned" ? "success" : "error"
        }
        loading={actionLoading}
        onConfirm={handleToggleStatus}
        onClose={() => setConfirm(null)}
      />
    </Box>
  );
}
