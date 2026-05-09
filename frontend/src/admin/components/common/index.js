/**
 * admin/components/common/index.js
 *
 * Production-grade shared components for the admin portal.
 * Every admin page consumes these — zero duplication.
 *
 * Exports:
 *   PageHeader, DataTable, SearchBar, FilterTabs, StatusBadge,
 *   UserAvatarCell, ConfirmDialog, RowActions, SectionCard,
 *   StatCard, FormDialog, EmptyState, TableToolbar
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Skeleton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Avatar,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Checkbox,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  InboxOutlined as InboxIcon,
  NavigateNext as NavNextIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

// ─── Design tokens (match image: clean, minimal, white bg, border-based) ──────
const TABLE_BORDER = "1px solid #e9eaf0";
const TABLE_HEAD_BG = "#f7f8fa";
const ROW_HOVER = "rgba(99,102,241,0.04)";
const CHIP_STYLES = {
  active: { bg: "#e8faf2", color: "#0f8a5f", border: "#b2e8cf" },
  pending: { bg: "#fff8e6", color: "#b45309", border: "#fde68a" },
  banned: { bg: "#fde8e8", color: "#b91c1c", border: "#fca5a5" },
  inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  rejected: { bg: "#fce7f3", color: "#9d174d", border: "#fbcfe8" },
  read: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  unread: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
  online: { bg: "#e8faf2", color: "#0f8a5f", border: "#b2e8cf" },
  offline: { bg: "#fde8e8", color: "#b91c1c", border: "#fca5a5" },
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_LABEL_MAP = {
  1: "Active",
  0: "Inactive",
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  banned: "Banned",
  rejected: "Rejected",
  read: "Read",
  unread: "Unread",
  online: "Online",
  offline: "Offline",
};

export function StatusBadge({ value, label: overrideLabel }) {
  const raw = String(value ?? "").toLowerCase();

  const label =
    overrideLabel ??
    STATUS_LABEL_MAP[raw] ??
    STATUS_LABEL_MAP[value] ??
    String(value);

  // Map numeric statuses to semantic keys
  const key = raw === "1" ? "active" : raw === "0" ? "inactive" : raw;
  const style = CHIP_STYLES[key] ?? CHIP_STYLES.inactive;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.25,
        py: 0.4,
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        bgcolor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: style.color,
          mr: 0.75,
          flexShrink: 0,
          opacity: 0.85,
        }}
      />
      {label}
    </Box>
  );
}

// Keep backward compat alias
export const StatusChip = StatusBadge;

// ─── FilterTabs (All / Active / Pending / Banned / Rejected) ─────────────────
export function FilterTabs({ tabs, value, onChange, counts = {} }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        mb: 2.5,
        borderBottom: "2px solid #e9eaf0",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const count = counts[tab.value];
        return (
          <Box
            key={tab.value}
            onClick={() => onChange(tab.value)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 1,
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#111827" : "#6b7280",
              borderBottom: isActive
                ? "2px solid #111827"
                : "2px solid transparent",
              mb: "-2px",
              transition: "all 0.15s",
              "&:hover": { color: "#111827" },
            }}
          >
            {tab.label}
            {count !== undefined && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  borderRadius: "10px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  bgcolor: isActive ? "#111827" : "#e9eaf0",
                  color: isActive ? "#fff" : "#6b7280",
                }}
              >
                {count}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search…", sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        height: 40,
        borderRadius: "8px",
        border: TABLE_BORDER,
        bgcolor: "#fff",
        minWidth: 260,
        "&:focus-within": {
          border: "1px solid #6366f1",
          boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
        },
        ...sx,
      }}
    >
      <SearchIcon sx={{ fontSize: 16, color: "#9ca3af", flexShrink: 0 }} />
      <Box
        component="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        sx={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "0.875rem",
          color: "#111827",
          "&::placeholder": { color: "#9ca3af" },
        }}
      />
      {value && (
        <IconButton size="small" onClick={() => onChange("")} sx={{ p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
        </IconButton>
      )}
    </Box>
  );
}

// ─── RoleFilter dropdown ──────────────────────────────────────────────────────
export function RoleFilter({
  value,
  onChange,
  options = [],
  placeholder = "Role",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        height: 40,
        borderRadius: "8px",
        border: TABLE_BORDER,
        bgcolor: "#fff",
        minWidth: 140,
        cursor: "pointer",
        "&:focus-within": { border: "1px solid #6366f1" },
      }}
    >
      <Box
        component="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "0.875rem",
          color: value ? "#111827" : "#9ca3af",
          cursor: "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </Box>
    </Box>
  );
}

// ─── TableToolbar ─────────────────────────────────────────────────────────────
export function TableToolbar({ children, sx }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ mb: 2, flexWrap: "wrap", gap: 1, ...sx }}
    >
      {children}
    </Stack>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────
/**
 * columns: [{ id, label, minWidth?, align?, sortable?, render(row) }]
 *
 * Props:
 *   columns, rows, loading, totalCount
 *   page (0-based), rowsPerPage
 *   onPageChange(pageIndex), onRowsPerPageChange(rpp)
 *   onSortChange({ orderBy, order })  — optional, enables server sort
 *   orderBy, order                    — controlled sort state
 *   onRowClick(row)                   — optional
 *   emptyMessage, rowKey, selectable
 *   onSelectionChange([ids])          — called when selection changes
 *   rowsPerPageOptions                — default [5,10,20,50]
 *   dense                             — toggle via switch
 */
export function DataTable({
  columns,
  rows,
  loading,
  totalCount,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  orderBy: controlledOrderBy = "",
  order: controlledOrder = "asc",
  onRowClick,
  emptyMessage = "No records found",
  rowKey = "id",
  selectable = false,
  onSelectionChange,
  rowsPerPageOptions = [5, 10, 20, 50],
  dense: externalDense,
  sx,
}) {
  const showPagination = totalCount !== undefined && onPageChange;
  const isControlledSort = Boolean(onSortChange);
  const [internalOrderBy, setInternalOrderBy] = useState("");
  const [internalOrder, setInternalOrder] = useState("asc");
  const [selected, setSelected] = useState([]);
  const [internalDense, setInternalDense] = useState(false);

  const dense = externalDense !== undefined ? externalDense : internalDense;

  const orderBy = isControlledSort ? controlledOrderBy : internalOrderBy;
  const order = isControlledSort ? controlledOrder : internalOrder;

  const handleSort = (colId) => {
    const isAsc = orderBy === colId && order === "asc";
    const nextOrder = isAsc ? "desc" : "asc";
    if (isControlledSort) {
      onSortChange({ orderBy: colId, order: nextOrder });
    } else {
      setInternalOrderBy(colId);
      setInternalOrder(nextOrder);
    }
  };

  const sortedRows =
    !isControlledSort && orderBy
      ? [...rows].sort((a, b) => {
          const va = a[orderBy] ?? "";
          const vb = b[orderBy] ?? "";
          if (va < vb) return order === "asc" ? -1 : 1;
          if (va > vb) return order === "asc" ? 1 : -1;
          return 0;
        })
      : rows;

  const handleSelectAll = (e) => {
    const next = e.target.checked ? sortedRows.map((r) => r[rowKey]) : [];
    setSelected(next);
    onSelectionChange?.(next);
  };

  const handleSelectRow = (id) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    setSelected(next);
    onSelectionChange?.(next);
  };

  const isAllSelected =
    sortedRows.length > 0 && selected.length === sortedRows.length;
  const isPartial = selected.length > 0 && selected.length < sortedRows.length;

  const rowHeight = dense ? 44 : 60;
  const skeletonCount = rowsPerPage || 8;

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: "12px",
        border: TABLE_BORDER,
        bgcolor: "#fff",
        ...sx,
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size={dense ? "small" : "medium"} stickyHeader>
          {/* ── Head ── */}
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{ bgcolor: TABLE_HEAD_BG, borderBottom: TABLE_BORDER }}
                >
                  <Checkbox
                    size="small"
                    indeterminate={isPartial}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    sx={{
                      color: "#9ca3af",
                      "&.Mui-checked, &.MuiCheckbox-indeterminate": {
                        color: "#6366f1",
                      },
                    }}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || "left"}
                  sortDirection={orderBy === col.id ? order : false}
                  sx={{
                    bgcolor: TABLE_HEAD_BG,
                    borderBottom: TABLE_BORDER,
                    minWidth: col.minWidth,
                    py: dense ? 1 : 1.5,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#6b7280",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : "asc"}
                      onClick={() => handleSort(col.id)}
                      sx={{
                        color:
                          orderBy === col.id ? "#6366f1 !important" : "inherit",
                        "& .MuiTableSortLabel-icon": {
                          opacity: orderBy === col.id ? 1 : 0.4,
                          fontSize: 16,
                        },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* ── Body ── */}
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, i) => (
                <TableRow key={i} sx={{ height: rowHeight }}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton
                        variant="rectangular"
                        width={18}
                        height={18}
                        sx={{ borderRadius: 0.5 }}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton
                        variant="text"
                        height={16}
                        width={`${50 + Math.random() * 40}%`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  sx={{ py: 8, textAlign: "center", border: 0 }}
                >
                  <Stack alignItems="center" spacing={1.5}>
                    <InboxIcon sx={{ fontSize: 40, color: "#d1d5db" }} />
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => {
                const isSelected = selected.includes(row[rowKey]);
                return (
                  <TableRow
                    key={row[rowKey]}
                    selected={isSelected}
                    hover
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{
                      height: rowHeight,
                      cursor: onRowClick ? "pointer" : "default",
                      "&:hover": { bgcolor: ROW_HOVER },
                      "&.Mui-selected": { bgcolor: "rgba(99,102,241,0.06)" },
                      "&:last-child td": { borderBottom: 0 },
                      "& td": { borderBottom: TABLE_BORDER },
                    }}
                  >
                    {selectable && (
                      <TableCell
                        padding="checkbox"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleSelectRow(row[rowKey])}
                          sx={{
                            color: "#9ca3af",
                            "&.Mui-checked": { color: "#6366f1" },
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align || "left"}
                        sx={{
                          py: dense ? 0.75 : 1.25,
                          fontSize: "0.875rem",
                          color: "#374151",
                        }}
                      >
                        {col.render ? col.render(row) : (row[col.id] ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Footer: Dense toggle + Pagination ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.5,
          borderTop: TABLE_BORDER,
          bgcolor: "#fafafa",
        }}
      >
        {/* Dense toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box
            onClick={() => setInternalDense((v) => !v)}
            sx={{
              width: 36,
              height: 20,
              borderRadius: "10px",
              bgcolor: internalDense ? "#6366f1" : "#e5e7eb",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 2,
                left: internalDense ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.8rem" }}
          >
            Dense
          </Typography>
        </Box>

        {/* Pagination */}
        {showPagination && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => onPageChange(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              onRowsPerPageChange(parseInt(e.target.value, 10))
            }
            rowsPerPageOptions={rowsPerPageOptions}
            sx={{
              border: 0,
              ".MuiTablePagination-toolbar": { minHeight: 44, px: 0 },
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows":
                {
                  fontSize: "0.8125rem",
                  color: "#6b7280",
                },
              ".MuiTablePagination-select": { fontSize: "0.8125rem" },
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  icon: Icon,
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && (
        <Breadcrumbs
          separator={<NavNextIcon sx={{ fontSize: 13, color: "#9ca3af" }} />}
          sx={{ mb: 1.5 }}
        >
          {breadcrumbs.map((b, i) =>
            i < breadcrumbs.length - 1 ? (
              <Link
                key={i}
                underline="hover"
                href={b.href}
                sx={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}
              >
                {b.label}
              </Link>
            ) : (
              <Typography
                key={i}
                sx={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}
              >
                {b.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {Icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "rgba(99,102,241,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon sx={{ color: "#6366f1", fontSize: 20 }} />
            </Box>
          )}
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: "#111827", letterSpacing: "-0.01em" }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {actions && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  confirmColor = "error",
  loading,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px" } }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontSize: "1rem",
          fontWeight: 700,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "9px",
            bgcolor:
              confirmColor === "error" ? "#fde8e8" : "rgba(99,102,241,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarningIcon
            sx={{
              fontSize: 18,
              color: confirmColor === "error" ? "#ef4444" : "#6366f1",
            }}
          />
        </Box>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.6 }}
        >
          {message ?? "This action cannot be undone."}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: "8px",
            borderColor: "#e5e7eb",
            color: "#374151",
            "&:hover": { borderColor: "#d1d5db" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          size="small"
          sx={{ borderRadius: "8px", fontWeight: 600 }}
          startIcon={
            loading ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── RowActions ───────────────────────────────────────────────────────────────
export function RowActions({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  extra,
}) {
  return (
    <Stack
      direction="row"
      spacing={0.5}
      justifyContent="flex-end"
      alignItems="center"
    >
      {extra}
      {onEdit && (
        <Tooltip title={editLabel}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            sx={{
              color: "#6b7280",
              borderRadius: "6px",
              "&:hover": { bgcolor: "rgba(99,102,241,0.08)", color: "#6366f1" },
            }}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip title={deleteLabel}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              color: "#6b7280",
              borderRadius: "6px",
              "&:hover": { bgcolor: "rgba(239,68,68,0.08)", color: "#ef4444" },
            }}
          >
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, action, children, sx }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "12px",
        border: TABLE_BORDER,
        overflow: "hidden",
        bgcolor: "#fff",
        ...sx,
      }}
    >
      {(title || action) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 1.75, borderBottom: TABLE_BORDER }}
        >
          <Box>
            {title && (
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ color: "#111827" }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Stack>
      )}
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon: Icon,
  color = "primary",
  trend,
  loading,
}) {
  const colorMap = {
    primary: { bg: "rgba(99,102,241,0.08)", iconColor: "#6366f1" },
    success: { bg: "rgba(16,185,129,0.08)", iconColor: "#10b981" },
    warning: { bg: "rgba(245,158,11,0.08)", iconColor: "#f59e0b" },
    error: { bg: "rgba(239,68,68,0.08)", iconColor: "#ef4444" },
    info: { bg: "rgba(6,182,212,0.08)", iconColor: "#06b6d4" },
  };
  const { bg, iconColor } = colorMap[color] ?? colorMap.primary;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "12px",
        border: TABLE_BORDER,
        bgcolor: "#fff",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: "0.7rem",
            }}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={80} height={36} sx={{ mt: 0.5 }} />
          ) : (
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color: "#111827", letterSpacing: "-0.02em", mt: 0.5 }}
            >
              {value}
            </Typography>
          )}
          {trend !== undefined && !loading && (
            <Typography
              variant="caption"
              sx={{
                color: trend >= 0 ? "#10b981" : "#ef4444",
                mt: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 0.25,
              }}
            >
              {trend >= 0 ? "+" : ""}
              {trend}% this month
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "10px",
            bgcolor: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Icon && <Icon sx={{ color: iconColor, fontSize: 22 }} />}
        </Box>
      </Stack>
    </Paper>
  );
}

// ─── UserAvatarCell ───────────────────────────────────────────────────────────
export function UserAvatarCell({ name, email, avatarUrl, size = 34 }) {
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  // deterministic color from name
  const hue =
    (name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Avatar
        src={avatarUrl}
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.38,
          fontWeight: 700,
          bgcolor: avatarUrl ? "transparent" : `hsl(${hue},60%,55%)`,
          color: "#fff",
        }}
      >
        {!avatarUrl && initials}
      </Avatar>
      <Box sx={{ overflow: "hidden" }}>
        <Typography
          variant="body2"
          fontWeight={600}
          noWrap
          sx={{ color: "#111827", maxWidth: 160 }}
        >
          {name || "—"}
        </Typography>
        {email && (
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ maxWidth: 160, display: "block" }}
          >
            {email}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// ─── FormDialog ───────────────────────────────────────────────────────────────
export function FormDialog({
  open,
  onClose,
  title,
  onSubmit,
  loading,
  error,
  submitLabel = "Save",
  children,
  maxWidth = "sm",
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ sx: { borderRadius: "14px" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "1rem",
          fontWeight: 700,
          pb: 1,
          color: "#111827",
        }}
      >
        {title}
        <IconButton
          size="small"
          onClick={onClose}
          disabled={loading}
          sx={{ color: "#9ca3af" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
            {error}
          </Alert>
        )}
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          sx={{ borderRadius: "8px", borderColor: "#e5e7eb", color: "#374151" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          variant="contained"
          sx={{
            borderRadius: "8px",
            fontWeight: 600,
            bgcolor: "#111827",
            "&:hover": { bgcolor: "#374151" },
          }}
          startIcon={
            loading ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── STATUS_TABS — shared across all admin list pages ─────────────────────────
export const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// ─── Re-export nothing extra — import icons directly from @mui/icons-material ─

// ─── RefreshButton ────────────────────────────────────────────────────────────
// Reusable "Refresh" button used in PageHeader.actions across all admin pages.
export function RefreshButton({ onClick, loading, label = "Refresh" }) {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<RefreshIcon sx={{ fontSize: 15 }} />}
      onClick={onClick}
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
      {label}
    </Button>
  );
}

// ─── AddButton ────────────────────────────────────────────────────────────────
// Reusable "Add …" button used in PageHeader.actions across all admin pages.
export function AddButton({ onClick, label = "Add" }) {
  return (
    <Button
      variant="contained"
      size="small"
      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
      onClick={onClick}
      sx={{
        borderRadius: "8px",
        fontWeight: 600,
        textTransform: "none",
        bgcolor: "#111827",
        "&:hover": { bgcolor: "#374151" },
        boxShadow: "none",
      }}
    >
      {label}
    </Button>
  );
}
