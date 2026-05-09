/**
 * admin/pages/UsersPage.js
 *
 * Server-paginated user list with search and status filter tabs.
 *
 * Design:
 *   - Filter tabs: All / Online / Offline  (counts from server total)
 *   - Toolbar: Search input, column options
 *   - Table: Name (avatar+email), Phone, Company, Role, Status
 *   - Footer: Dense toggle, Rows per page, pagination
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  People as PeopleIcon,
  Block as BlockIcon,
  CheckCircle as UnblockIcon,
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
  RefreshButton,
} from "../components/common";
import { adminUsersApi, ADMIN_PAGE_SIZE } from "../../services/adminApi";
import { useAdminTable } from "../../hooks/useAdminTable";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserStatusLabel(u) {
  return u?.status === "online" ? "online" : "offline";
}

// ─── Row action menu ──────────────────────────────────────────────────────────

function RowMenu({ row, onToggleBan }) {
  const [anchor, setAnchor] = useState(null);
  const isBanned = row.status === 0;

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
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{
          sx: { borderRadius: "10px", border: "1px solid #e9eaf0" },
        }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onToggleBan(row);
          }}
          sx={{
            fontSize: "0.875rem",
            color: isBanned ? "#10b981" : "#ef4444",
            gap: 1,
          }}
        >
          {isBanned ? (
            <UnblockIcon sx={{ fontSize: 16 }} />
          ) : (
            <BlockIcon sx={{ fontSize: 16 }} />
          )}
          {isBanned ? "Unban User" : "Ban User"}
        </MenuItem>
      </Menu>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const {
    rows,
    total,
    loading,
    page,
    setPage,
    rowsPerPage: rpp,
    setRowsPerPage: setRpp,
    search,
    setSearch,
    statusTab,
    setStatusTab,
    counts,
    replaceRow,
    refresh,
  } = useAdminTable({
    fetcher: useCallback(
      (limit, offset, search) => adminUsersApi.getAll(limit, offset, search),
      [],
    ),
    responseKey: { rows: "users", total: "total" },
    serverSearch: true,
    statusField: null, // status filtering is handled via tab logic below
    defaultPageSize: ADMIN_PAGE_SIZE,
  });

  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [colMenuAnchor, setColMenuAnchor] = useState(null);

  const handleToggleBan = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      const nextStatus = confirm.status === 0 ? 1 : 0;
      const updated = await adminUsersApi.setStatus(confirm.id, nextStatus);
      replaceRow(updated.id, updated);
    } catch (_) {}
    setActionLoading(false);
    setConfirm(null);
  };

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
    {
      id: "joined",
      label: "Joined",
      minWidth: 120,
      render: (r) =>
        r.created_at ? format(new Date(r.created_at), "dd MMM yyyy") : "—",
    },
    {
      id: "actions",
      label: "",
      align: "right",
      minWidth: 60,
      render: (row) => <RowMenu row={row} onToggleBan={(r) => setConfirm(r)} />,
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
        actions={<RefreshButton onClick={refresh} loading={loading} />}
      />

      {/* Filter tabs */}
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
        counts={{ all: total, online: 0, offline: 0 }}
      />

      {/* Toolbar */}
      <TableToolbar>
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder="Search users…"
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
              sx: { borderRadius: "10px", border: "1px solid #e9eaf0" },
            }}
          >
            <MenuItem
              disabled
              sx={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}
            >
              COLUMNS
            </MenuItem>
            <Divider />
            {["Name", "Phone", "Company", "Role", "Status", "Joined"].map(
              (col) => (
                <MenuItem key={col} sx={{ fontSize: "0.875rem" }}>
                  {col}
                </MenuItem>
              ),
            )}
          </Menu>
        </Box>
      </TableToolbar>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rows}
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
        selectable
        emptyMessage="No users found"
        rowKey="id"
      />

      {/* Confirm ban/unban */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.status === 0 ? "Unban User" : "Ban User"}
        message={
          confirm?.status === 0
            ? `Restore access for "${confirm?.full_name || confirm?.username}"?`
            : `Ban "${confirm?.full_name || confirm?.username}"? They will no longer be able to log in.`
        }
        confirmLabel={confirm?.status === 0 ? "Unban" : "Ban"}
        confirmColor={confirm?.status === 0 ? "success" : "error"}
        loading={actionLoading}
        onConfirm={handleToggleBan}
        onClose={() => setConfirm(null)}
      />
    </Box>
  );
}
