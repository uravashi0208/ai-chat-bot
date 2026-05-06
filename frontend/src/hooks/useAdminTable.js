/**
 * useAdminTable.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One hook to rule all admin data tables.
 *
 * Handles:
 *  - API call (paginated or full-list)
 *  - Loading / error state
 *  - Client-side OR server-side search
 *  - Pagination (page + rowsPerPage)
 *  - Sort (optional)
 *  - Manual refresh
 *
 * Usage — server-side pagination (search sent to API):
 * ─────────────────────────────────────────────────────
 *   const table = useAdminTable({
 *     fetcher: (limit, offset, search) => adminUsersApi.getAll(limit, offset, search),
 *     responseKey: { rows: 'users', total: 'total' },   // unwrap { total, users }
 *     serverSearch: true,
 *   });
 *
 *   <SearchBar value={table.search} onChange={table.setSearch} />
 *   <DataTable
 *     rows={table.rows}
 *     loading={table.loading}
 *     totalCount={table.total}
 *     page={table.page}
 *     rowsPerPage={table.rowsPerPage}
 *     onPageChange={table.setPage}
 *     onRowsPerPageChange={table.setRowsPerPage}
 *   />
 *
 * Usage — full list (client-side search / filter):
 * ─────────────────────────────────────────────────
 *   const table = useAdminTable({
 *     fetcher: () => adminEmojiCatApi.getAll(),   // returns array
 *     serverSearch: false,
 *     clientFilter: (row, q) =>
 *       row.category_name.toLowerCase().includes(q.toLowerCase()),
 *   });
 */

import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE_SIZE = 20;

/**
 * @param {object}   opts
 * @param {function} opts.fetcher          - (limit, offset, search) => Promise<array | { rows, total }>
 * @param {object}   [opts.responseKey]    - { rows: 'items', total: 'total' } — only for paginated APIs
 * @param {boolean}  [opts.serverSearch]   - true → debounce search & send to API; false → client filter
 * @param {function} [opts.clientFilter]   - (row, query) => boolean  (used when serverSearch=false)
 * @param {number}   [opts.defaultPageSize]
 * @param {number}   [opts.debounceMs]     - search debounce delay (default 350)
 * @param {string}   [opts.statusField]    - field name for status tab filtering (default: "status"). Set to null to disable.
 * @param {function} [opts.statusTabFilter] - custom (row, tabValue) => boolean for non-standard status logic
 * @param {boolean}  [opts.immediate]      - fetch on mount (default true)
 */
export function useAdminTable({
  fetcher,
  responseKey,
  serverSearch = false,
  clientFilter,
  statusField = "status",
  statusTabFilter,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  debounceMs = 350,
  immediate = true,
} = {}) {
  // ── Raw data from API
  const [_rawRows, setRawRows] = useState([]);
  const [total, setTotal] = useState(0);

  // ── UI state
  const [page, setPageState] = useState(0);
  const [rowsPerPage, setRowsPerPageState] = useState(defaultPageSize);
  const [search, setSearchState] = useState("");
  const [statusTab, setStatusTabState] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Internal: debounced search sent to API
  const [_debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef(null);

  // ── Debounce search for server-side mode
  useEffect(() => {
    if (!serverSearch) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(0); // reset page on new search
    }, debounceMs);
    return () => clearTimeout(debounceTimer.current);
  }, [search, serverSearch, debounceMs]);

  // Reset page when status tab changes (client-side)
  useEffect(() => {
    if (!serverSearch) setPageState(0);
  }, [statusTab, serverSearch]);

  // ── Fetch
  const fetch_ = useCallback(async () => {
    if (!fetcher) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(
        rowsPerPage,
        page * rowsPerPage,
        serverSearch ? _debouncedSearch : undefined,
      );

      // Unwrap paginated response: { users: [...], total: N }
      if (
        responseKey &&
        result &&
        typeof result === "object" &&
        !Array.isArray(result)
      ) {
        const rows =
          result[responseKey.rows] ?? result.items ?? result.data ?? [];
        const tot = result[responseKey.total] ?? result.total ?? rows.length;
        setRawRows(rows);
        setTotal(tot);
      } else {
        // Plain array (non-paginated API)
        const arr = Array.isArray(result) ? result : [];
        setRawRows(arr);
        setTotal(arr.length);
      }
    } catch (err) {
      setError(err?.message || "Failed to load data");
      setRawRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, rowsPerPage, serverSearch, _debouncedSearch, responseKey]);

  useEffect(() => {
    if (immediate) fetch_();
  }, [fetch_, immediate]);

  // ── Client-side search/filter (when serverSearch=false)
  const searchFiltered = serverSearch
    ? _rawRows
    : clientFilter && search.trim()
      ? _rawRows.filter((row) => clientFilter(row, search))
      : _rawRows;

  // ── Status tab filter (client-side only)
  const rows = (() => {
    if (serverSearch || statusTab === "all" || !statusField)
      return searchFiltered;
    if (statusTabFilter)
      return searchFiltered.filter((r) => statusTabFilter(r, statusTab));
    if (statusTab === "active")
      return searchFiltered.filter((r) => r[statusField] === 1);
    if (statusTab === "inactive")
      return searchFiltered.filter((r) => r[statusField] === 0);
    // support arbitrary string values (e.g. "online" / "offline")
    return searchFiltered.filter((r) => String(r[statusField]) === statusTab);
  })();

  // ── Tab counts (derived from search-filtered, pre-status-tab)
  const counts = {
    all: searchFiltered.length,
    ...(statusField
      ? {
          active: searchFiltered.filter((r) => r[statusField] === 1).length,
          inactive: searchFiltered.filter((r) => r[statusField] === 0).length,
        }
      : {}),
  };

  // Client-side total should reflect filtered rows
  const displayTotal = serverSearch ? total : rows.length;

  // Client-side paginated slice
  const pagedRows = serverSearch
    ? rows
    : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Setters that also reset page
  const setSearch = useCallback(
    (val) => {
      setSearchState(val);
      if (!serverSearch) setPageState(0);
    },
    [serverSearch],
  );

  const setPage = useCallback((p) => setPageState(p), []);

  const setRowsPerPage = useCallback((rpp) => {
    setRowsPerPageState(rpp);
    setPageState(0);
  }, []);

  const setStatusTab = useCallback((val) => {
    setStatusTabState(val);
    setPageState(0);
  }, []);

  // ── Local optimistic updates
  const prependRow = useCallback((row) => {
    setRawRows((prev) => [row, ...prev]);
    setTotal((t) => t + 1);
  }, []);

  const replaceRow = useCallback((id, row, key = "id") => {
    setRawRows((prev) => prev.map((r) => (r[key] === id ? row : r)));
  }, []);

  const removeRow = useCallback((id, key = "id") => {
    setRawRows((prev) => prev.filter((r) => r[key] !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return {
    // Data
    rows: pagedRows,
    allRows: rows, // all rows (pre-pagination, post-filter)
    total: displayTotal,
    loading,
    error,
    counts,

    // Pagination
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,

    // Search
    search,
    setSearch,

    // Status tab
    statusTab,
    setStatusTab,

    // Actions
    refresh: fetch_,
    prependRow,
    replaceRow,
    removeRow,
  };
}

export default useAdminTable;
