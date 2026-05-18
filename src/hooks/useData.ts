'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache shared across all hook instances
const cache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

const CACHE_TTL = 30_000; // 30 seconds stale time

export function useData<T>(url: string | null, options?: { refreshInterval?: number }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (urlKey: string, showLoading = false) => {
    // Check cache first
    const cached = cache.get(urlKey) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    // If cached but stale, show cached data while fetching fresh
    if (cached) {
      setData(cached.data);
      setLoading(false);
    } else if (showLoading) {
      setLoading(true);
    }

    // Dedupe requests
    if (pendingRequests.has(urlKey)) {
      try {
        const result = await pendingRequests.get(urlKey) as T;
        setData(result);
        setError(null);
        cache.set(urlKey, { data: result, timestamp: Date.now() });
      } catch {
        // Already handled by the original request
      }
      setLoading(false);
      return;
    }

    const fetchPromise = fetch(urlKey)
      .then(async (res) => {
        if (!res.ok) throw new Error('Fetch failed');
        const json = await res.json();
        return json as T;
      });

    pendingRequests.set(urlKey, fetchPromise);

    try {
      const result = await fetchPromise;
      setData(result);
      setError(null);
      cache.set(urlKey, { data: result, timestamp: Date.now() });
    } catch (err) {
      if (!cached) {
        setError(err instanceof Error ? err.message : 'حدث خطأ');
      }
    } finally {
      pendingRequests.delete(urlKey);
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!url) return;
    // Force fresh fetch by invalidating cache
    cache.delete(url);
    setLoading(true);
    await fetchData(url, true);
  }, [url, fetchData]);

  // Invalidate cache for a specific URL (useful after mutations)
  const invalidate = useCallback((urlKey: string) => {
    cache.delete(urlKey);
  }, []);

  useEffect(() => {
    if (!url) {
      setData(null);
      setLoading(false);
      return;
    }

    fetchData(url, true);

    // Auto refresh
    if (options?.refreshInterval) {
      refreshTimerRef.current = setInterval(() => {
        fetchData(url, false);
      }, options.refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [url, options?.refreshInterval, fetchData]);

  return { data, loading, error, refresh, invalidate };
}

// Clear entire cache (e.g. on logout)
export function clearCache() {
  cache.clear();
  pendingRequests.clear();
}
