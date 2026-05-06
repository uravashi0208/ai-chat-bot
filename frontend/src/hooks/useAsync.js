import { useState, useEffect, useCallback } from 'react';

/**
 * useAsync — minimal data-fetching hook with loading / error / refetch.
 *
 * @param {Function} fn       - async function that returns data
 * @param {Array}    deps     - dependency array (like useEffect)
 * @param {boolean}  immediate - whether to fire immediately on mount (default true)
 */
export function useAsync(fn, deps = [], immediate = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      return result;
    } catch (e) {
      setError(e.message || 'Something went wrong');
      throw e;
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => {
    if (immediate) execute();
  }, [immediate, ...deps]); // eslint-disable-line

  return { data, loading, error, refetch: execute };
}

/**
 * usePagination — page state helper.
 */
export function usePagination(pageSize = 20) {
  const [page, setPage]  = useState(0);
  const [total, setTotal] = useState(0);

  const offset      = page * pageSize;
  const pageCount   = Math.ceil(total / pageSize);
  const handlePage  = (_, p) => setPage(p - 1);

  return { page, offset, total, setTotal, pageCount, pageSize, handlePage, reset: () => setPage(0) };
}
