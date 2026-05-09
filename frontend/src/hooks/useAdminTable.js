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
 *  - Manual refresh
 *
 * React StrictMode-safe: uses an AbortController / ignore-flag pattern so
 * StrictMode's intentional double-mount does NOT fire two real API requests.
 *
 * Usage — server-side pagination:
 *   const table = useAdminTable({
 *     fetcher: (limit, offset, search) => adminUsersApi.getAll(limit, offset, search),
 *     responseKey: { rows: 'users', total: 'total' },
 *     serverSearch: true,
 *   });
 *
 * Usage — full list (client-side search/filter):
 *   const table = useAdminTable({
 *     fetcher: () => adminEmojiCatApi.getAll(),
 *     serverSearch: false,
 *     clientFilter: (row, q) => row.category_name.toLowerCase().includes(q.toLowerCase()),
 *   });
 */

import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE_SIZE = 20;

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
  // ── Stabilise responseKey: callers often pass an inline object literal which
  //    would change reference every render. Store in ref to avoid effect loops.
  const responseKeyRef = useRef(responseKey);
  useEffect(() => {
    responseKeyRef.current = responseKey;
  });

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

  // ── Debounced search value that actually goes to the API
  const [_debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef(null);
  const fetchCount = useRef(0); // increments on each logical fetch trigger; used to deduplicate

  // ── Debounce search (server-side only)
  useEffect(() => {
    if (!serverSearch) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPageState(0);
    }, debounceMs);
    return () => clearTimeout(debounceTimer.current);
  }, [search, serverSearch, debounceMs]);

  // ── Reset page when status tab changes (client-side)
  useEffect(() => {
    if (!serverSearch) setPageState(0);
  }, [statusTab, serverSearch]);

  // ── Core fetch — StrictMode-safe via ignore flag
  //    We do NOT include fetcher/page/etc in a useCallback here; instead we
  //    use a single useEffect that reads current values from refs.
  const fetcherRef = useRef(fetcher);
  const pageRef = useRef(page);
  const rowsPerPageRef = useRef(rowsPerPage);
  const serverSearchRef = useRef(serverSearch);
  const debouncedSRef = useRef(_debouncedSearch);

  // Keep refs in sync (no re-render triggered)
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  useEffect(() => {
    pageRef.current = page;
  });
  useEffect(() => {
    rowsPerPageRef.current = rowsPerPage;
  });
  useEffect(() => {
    serverSearchRef.current = serverSearch;
  });
  useEffect(() => {
    debouncedSRef.current = _debouncedSearch;
  });

  // ── Stable fetch_ function that always reads fresh values from refs
  const fetch_ = useCallback(async () => {
    const fn = fetcherRef.current;
    if (!fn) return;

    // Increment generation; capture it. If another call starts while this one
    // is in-flight, the stale call will silently discard its result.
    fetchCount.current += 1;
    const gen = fetchCount.current;

    setLoading(true);
    setError(null);
    try {
      const result = await fn(
        rowsPerPageRef.current,
        pageRef.current * rowsPerPageRef.current,
        serverSearchRef.current ? debouncedSRef.current : undefined,
      );

      // Discard if a newer fetch started while we were awaiting
      if (gen !== fetchCount.current) return;

      const rKey = responseKeyRef.current;
      if (
        rKey &&
        result &&
        typeof result === "object" &&
        !Array.isArray(result)
      ) {
        const rows = result[rKey.rows] ?? result.items ?? result.data ?? [];
        const tot = result[rKey.total] ?? result.total ?? rows.length;
        setRawRows(rows);
        setTotal(tot);
      } else {
        const arr = Array.isArray(result) ? result : [];
        setRawRows(arr);
        setTotal(arr.length);
      }
    } catch (err) {
      if (gen !== fetchCount.current) return;
      setError(err?.message || "Failed to load data");
      setRawRows([]);
      setTotal(0);
    } finally {
      if (gen === fetchCount.current) setLoading(false);
    }
  }, []); // stable — reads everything from refs

  // ── Trigger fetch when pagination / search changes
  //    Using a "trigger" counter avoids direct dependency on fetch_ changing.
  const [_trigger, setTrigger] = useState(0);

  // Watch the things that should cause a real re-fetch
  const prevPage = useRef(page);
  const prevRpp = useRef(rowsPerPage);
  const prevDS = useRef(_debouncedSearch);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (immediate) fetch_();
      return;
    }
    // Only re-fetch if something that affects the API call actually changed
    if (
      prevPage.current !== page ||
      prevRpp.current !== rowsPerPage ||
      prevDS.current !== _debouncedSearch
    ) {
      fetch_();
    }
    prevPage.current = page;
    prevRpp.current = rowsPerPage;
    prevDS.current = _debouncedSearch;
  }, [page, rowsPerPage, _debouncedSearch, fetch_, immediate]);

  // ── Client-side filter
  const searchFiltered = serverSearch
    ? _rawRows
    : clientFilter && search.trim()
      ? _rawRows.filter((row) => clientFilter(row, search))
      : _rawRows;

  // ── Status tab filter
  const rows = (() => {
    if (serverSearch || statusTab === "all" || !statusField)
      return searchFiltered;
    if (statusTabFilter)
      return searchFiltered.filter((r) => statusTabFilter(r, statusTab));
    if (statusTab === "active")
      return searchFiltered.filter((r) => r[statusField] === 1);
    if (statusTab === "inactive")
      return searchFiltered.filter((r) => r[statusField] === 0);
    return searchFiltered.filter((r) => String(r[statusField]) === statusTab);
  })();

  // ── Tab counts
  const counts = {
    all: searchFiltered.length,
    ...(statusField
      ? {
          active: searchFiltered.filter((r) => r[statusField] === 1).length,
          inactive: searchFiltered.filter((r) => r[statusField] === 0).length,
        }
      : {}),
  };

  const displayTotal = serverSearch ? total : rows.length;
  const pagedRows = serverSearch
    ? rows
    : rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Setters
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

  // ── Optimistic mutations
  const prependRow = useCallback((row) => {
    setRawRows((p) => [row, ...p]);
    setTotal((t) => t + 1);
  }, []);
  const replaceRow = useCallback((id, row, key = "id") => {
    setRawRows((p) => p.map((r) => (r[key] === id ? row : r)));
  }, []);
  const removeRow = useCallback((id, key = "id") => {
    setRawRows((p) => p.filter((r) => r[key] !== id));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return {
    rows: pagedRows,
    allRows: rows,
    total: displayTotal,
    loading,
    error,
    counts,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    search,
    setSearch,
    statusTab,
    setStatusTab,
    refresh: fetch_,
    prependRow,
    replaceRow,
    removeRow,
  };
}

export default useAdminTable;
