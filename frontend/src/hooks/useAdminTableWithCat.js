import { useState, useEffect, useCallback, useMemo } from "react";

const DEFAULT_PAGE_SIZE = 10;

/**
 * @param {object}          opts
 * @param {function}        opts.dataFetcher    - (categoryId|undefined) => Promise<array>
 * @param {function}        opts.catFetcher     - () => Promise<array>
 * @param {string}          [opts.searchField]  - dot-notation field to search, e.g. "emoji" or "title"
 * @param {function}        [opts.searchFilter] - custom (row, query) => boolean  (overrides searchField)
 * @param {number}          [opts.pageSize]     - default rows per page
 */
export function useAdminTableWithCat({
  dataFetcher,
  catFetcher,
  searchField,
  searchFilter,
  pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  // ── Raw data
  const [_rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Filter / pagination state
  const [filterCat, setFilterCatState] = useState("");
  const [search, setSearchState] = useState("");
  const [statusTab, setStatusTabState] = useState("all");
  const [page, setPageState] = useState(0);
  const [rpp, setRppState] = useState(pageSize);

  // ── Fetch both APIs in parallel
  const load = useCallback(async () => {
    if (!dataFetcher || !catFetcher) return;
    setLoading(true);
    try {
      const [dataResult, catResult] = await Promise.all([
        dataFetcher(filterCat || undefined),
        catFetcher(),
      ]);
      setRows(Array.isArray(dataResult) ? dataResult : []);
      setCategories(Array.isArray(catResult) ? catResult : []);
    } catch (_) {}
    setLoading(false);
  }, [dataFetcher, catFetcher, filterCat]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset page on filter changes
  useEffect(() => {
    setPageState(0);
  }, [search, statusTab, filterCat]);

  // ── Derived: tab counts
  const counts = useMemo(
    () => ({
      all: _rows.length,
      active: _rows.filter((r) => r.status === 1).length,
      inactive: _rows.filter((r) => r.status === 0).length,
    }),
    [_rows],
  );

  // ── Derived: filtered rows (status + search)
  const filtered = useMemo(() => {
    let arr = _rows;
    if (statusTab === "active") arr = arr.filter((r) => r.status === 1);
    if (statusTab === "inactive") arr = arr.filter((r) => r.status === 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      if (searchFilter) {
        arr = arr.filter((r) => searchFilter(r, search));
      } else if (searchField) {
        arr = arr.filter((r) =>
          (r[searchField] || "").toLowerCase().includes(q),
        );
      }
    }
    return arr;
  }, [_rows, statusTab, search, searchField, searchFilter]);

  // ── Derived: paginated slice
  const pagedRows = useMemo(
    () => filtered.slice(page * rpp, page * rpp + rpp),
    [filtered, page, rpp],
  );

  // ── Setters (with page-reset side-effects)
  const setFilterCat = useCallback((v) => {
    setFilterCatState(v);
    setPageState(0);
  }, []);

  const setSearch = useCallback((v) => {
    setSearchState(v);
    setPageState(0);
  }, []);

  const setStatusTab = useCallback((v) => {
    setStatusTabState(v);
    setPageState(0);
  }, []);

  const setPage = useCallback((p) => setPageState(p), []);

  const setRpp = useCallback((v) => {
    setRppState(v);
    setPageState(0);
  }, []);

  // ── Optimistic local mutations (avoids extra API round-trip after CRUD)
  const prependRow = useCallback((row) => {
    setRows((prev) => [row, ...prev]);
  }, []);

  const replaceRow = useCallback((id, row, key = "id") => {
    setRows((prev) => prev.map((r) => (r[key] === id ? row : r)));
  }, []);

  const removeRow = useCallback((id, key = "id") => {
    setRows((prev) => prev.filter((r) => r[key] !== id));
  }, []);

  return {
    // Data
    rows: _rows, // all raw rows (pre-filter)
    filtered, // after status + search filter
    pagedRows, // current page slice
    categories,
    loading,
    counts,

    // Filters
    filterCat,
    setFilterCat,
    search,
    setSearch,
    statusTab,
    setStatusTab,

    // Pagination
    page,
    setPage,
    rpp,
    setRpp,

    // Actions
    refresh: load,
    prependRow,
    replaceRow,
    removeRow,
  };
}

export default useAdminTableWithCat;
