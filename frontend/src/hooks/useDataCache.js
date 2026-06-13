/**
 * SomaSync — Data Cache Hook (Stale-While-Revalidate)
 * Shows cached data instantly, silently refreshes in background.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const cache = new Map();

export function useCachedData(cacheKey, fetchFn, { ttl = 5 * 60 * 1000 } = {}) {
  const [data, setData] = useState(() => {
    const cached = cache.get(cacheKey);
    if (cached) return cached.data;
    // Try sessionStorage
    try {
      const stored = sessionStorage.getItem(`ss_cache_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.ts < ttl * 2) { // allow 2x TTL for stale data
          cache.set(cacheKey, { data: parsed.data, ts: parsed.ts });
          return parsed.data;
        }
      }
    } catch {}
    return null;
  });

  const [loading, setLoading] = useState(!data);
  const [isStale, setIsStale] = useState(() => {
    const cached = cache.get(cacheKey);
    return cached ? Date.now() - cached.ts > ttl : false;
  });
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const refetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (!isMounted.current) return;

      setData(result);
      setIsStale(false);
      setLoading(false);

      // Update both caches
      const entry = { data: result, ts: Date.now() };
      cache.set(cacheKey, entry);
      try {
        sessionStorage.setItem(`ss_cache_${cacheKey}`, JSON.stringify(entry));
      } catch {}
    } catch (err) {
      if (!isMounted.current) return;
      setError(err.message || "Failed to fetch");
      setLoading(false);
    }
  }, [cacheKey, fetchFn]);

  // Initial fetch
  useEffect(() => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < ttl) {
      // Fresh cache, no fetch needed
      setLoading(false);
      setIsStale(false);
    } else if (cached) {
      // Stale cache — show it but refetch silently
      setLoading(false);
      setIsStale(true);
      refetch(true);
    } else {
      // No cache — full loading state
      refetch(false);
    }
  }, [cacheKey, refetch, ttl]);

  return { data, loading, isStale, error, refetch };
}
