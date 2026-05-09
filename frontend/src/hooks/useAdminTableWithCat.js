/**
 * useAdminTableWithCat.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generic hook for admin pages that have:
 *   - A server-paginated DATA list  (emoji, wallpaper, theme-color)
 *   - A full CATEGORY look-up list  (always small — no pagination needed)
 *
 * React StrictMode-safe: uses a generation counter so StrictMode's
 * double-mount does NOT fire two real API requests — the second invocation
 * is silently discarded before any state update.
 *
 * Categories are fetched ONCE on mount (not on every data refetch).
 *
 * @param {object}   opts
 * @param {function} opts.dataFetcher   ({ categoryId, limit, offset, search }) => Promise<{ items, total }>
 * @param {function} opts.catFetcher    () => Promise<array>
 * @param {number}   [opts.pageSize]    default rows per page (default ADMIN_PAGE_SIZE)
 * @param {number}   [opts.debounceMs]  search debounce delay (default 400)
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ADMIN_PAGE_SIZE } from "../services/adminApi";

export function useAdminTableWithCat({
  dataFetcher,
  catFetcher,
  pageSize = ADMIN_PAGE_SIZE,
  debounceMs = 400,
} = {}) {
  // ── Raw server data
  const [_items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalInactive, setTotalInactive] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Filter / pagination state
  const [filterCat, _setFilterCat] = useState("");
  const [search, _setSearch] = useState("");
  const [statusTab, _setStatusTab] = useState("all");
  const [page, _setPage] = useState(0);
  const [rpp, _setRpp] = useState(pageSize);

  // ── Debounced search (sent to API only after user stops typing)
  const [_apiSearch, setApiSearch] = useState("");
  const debounceRef = useRef(null);
  const fetchGen = useRef(0); // generation counter — deduplicate concurrent fetches
  const catFetchDone = useRef(false); // guard: fetch categories only once
  const hasMounted = useRef(false); // guard: skip first debounce effect run

  // ── Keep fetcher refs fresh without causing re-renders
  const dataFetcherRef = useRef(dataFetcher);
  const catFetcherRef = useRef(catFetcher);
  useEffect(() => {
    dataFetcherRef.current = dataFetcher;
  });
  useEffect(() => {
    catFetcherRef.current = catFetcher;
  });

  // ── Fetch categories ONCE on mount
  useEffect(() => {
    if (catFetchDone.current || !catFetcherRef.current) return;
    catFetchDone.current = true; // prevent StrictMode's second run from re-fetching
    catFetcherRef
      .current()
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []); // empty deps = mount only

  // ── Stable load function — always reads fresh state from refs
  const filterCatRef = useRef(filterCat);
  const rppRef = useRef(rpp);
  const pageRef = useRef(page);
  const apiSearchRef = useRef(_apiSearch);

  useEffect(() => {
    filterCatRef.current = filterCat;
  });
  useEffect(() => {
    rppRef.current = rpp;
  });
  useEffect(() => {
    pageRef.current = page;
  });
  useEffect(() => {
    apiSearchRef.current = _apiSearch;
  });

  const load = useCallback(async () => {
    const fn = dataFetcherRef.current;
    if (!fn) return;

    fetchGen.current += 1;
    const gen = fetchGen.current;

    setLoading(true);
    try {
      const result = await fn({
        categoryId: filterCatRef.current || undefined,
        limit: rppRef.current,
        offset: pageRef.current * rppRef.current,
        search: apiSearchRef.current || undefined,
      });

      if (gen !== fetchGen.current) return; // stale — a newer fetch is in-flight

      setItems(Array.isArray(result?.items) ? result.items : []);
      setTotal(result?.total ?? 0);
      setTotalActive(result?.totalActive ?? 0);
      setTotalInactive(result?.totalInactive ?? 0);
    } catch (_) {
      if (gen !== fetchGen.current) return;
      setItems([]);
      setTotal(0);
    } finally {
      if (gen === fetchGen.current) setLoading(false);
    }
  }, []); // stable — no deps, reads from refs

  // ── Trigger load on mount and whenever filters/pagination actually change
  const prevFilterCat = useRef(filterCat);
  const prevRpp = useRef(rpp);
  const prevPage = useRef(page);
  const prevApiSearch = useRef(_apiSearch);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      load(); // initial fetch
      return;
    }
    // Only re-fetch if something that affects the API query changed
    if (
      prevFilterCat.current !== filterCat ||
      prevRpp.current !== rpp ||
      prevPage.current !== page ||
      prevApiSearch.current !== _apiSearch
    ) {
      load();
    }
    prevFilterCat.current = filterCat;
    prevRpp.current = rpp;
    prevPage.current = page;
    prevApiSearch.current = _apiSearch;
  }, [filterCat, rpp, page, _apiSearch, load]);

  // ── Debounce search input (skip first mount to avoid double-call)
  const isFirstDebounce = useRef(true);
  useEffect(() => {
    if (isFirstDebounce.current) {
      isFirstDebounce.current = false;
      return; // mount: initial load() already handles the first fetch
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setApiSearch(search);
      _setPage(0);
    }, debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [search, debounceMs]);

  // ── Client-side status-tab filter (server doesn't filter by status)
  // _items is only the current page — filter it for display
  const filtered = useMemo(() => {
    if (statusTab === "all") return _items;
    if (statusTab === "active") return _items.filter((r) => r.status === 1);
    if (statusTab === "inactive") return _items.filter((r) => r.status === 0);
    return _items;
  }, [_items, statusTab]);

  // Counts come from server (accurate across ALL pages, not just the current page)
  const counts = useMemo(
    () => ({
      all: total,
      active: totalActive,
      inactive: totalInactive,
    }),
    [total, totalActive, totalInactive],
  );

  // Total for pagination: use server counts per tab
  const displayTotal =
    statusTab === "all"
      ? total
      : statusTab === "active"
        ? totalActive
        : totalInactive;

  // ── Setters
  const setFilterCat = useCallback((v) => {
    _setFilterCat(v);
    _setPage(0);
  }, []);
  const setSearch = useCallback((v) => _setSearch(v), []);
  const setStatusTab = useCallback((v) => {
    _setStatusTab(v);
    _setPage(0);
  }, []);
  const setPage = useCallback((p) => _setPage(p), []);
  const setRpp = useCallback((v) => {
    _setRpp(v);
    _setPage(0);
  }, []);

  // ── Optimistic mutations
  const prependRow = useCallback((row) => {
    setItems((p) => [row, ...p]);
    setTotal((t) => t + 1);
    if (row.status === 1) setTotalActive((t) => t + 1);
    else setTotalInactive((t) => t + 1);
  }, []);
  const replaceRow = useCallback((id, row, key = "id") => {
    setItems((p) =>
      p.map((r) => {
        if (r[key] !== id) return r;
        // If status changed, adjust counts
        if (r.status !== row.status) {
          if (row.status === 1) {
            setTotalActive((t) => t + 1);
            setTotalInactive((t) => Math.max(0, t - 1));
          } else {
            setTotalInactive((t) => t + 1);
            setTotalActive((t) => Math.max(0, t - 1));
          }
        }
        return row;
      }),
    );
  }, []);
  const removeRow = useCallback((id, key = "id") => {
    setItems((p) => {
      const removed = p.find((r) => r[key] === id);
      if (removed) {
        setTotal((t) => Math.max(0, t - 1));
        if (removed.status === 1) setTotalActive((t) => Math.max(0, t - 1));
        else setTotalInactive((t) => Math.max(0, t - 1));
      }
      return p.filter((r) => r[key] !== id);
    });
  }, []);

  return {
    pagedRows: filtered,
    filtered,
    categories,
    loading,
    total: displayTotal, // pagination total = tab-aware server count
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
    refresh: load,
    prependRow,
    replaceRow,
    removeRow,
  };
}

export default useAdminTableWithCat;
