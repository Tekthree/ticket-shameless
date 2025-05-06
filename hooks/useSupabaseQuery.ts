import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// Cache for query results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error: any | null;
}

const queryCache = new Map<string, CacheEntry<any>>();
const DEFAULT_CACHE_TTL = 30000; // 30 seconds in milliseconds

type QueryOptions = {
  enabled?: boolean;
  cacheTime?: number; // Time in milliseconds to keep data in cache
  staleTime?: number; // Time in milliseconds before data is considered stale
  retries?: number; // Number of retries on error
  retryDelay?: number; // Delay between retries in milliseconds
};

/**
 * Custom hook for optimized Supabase queries with caching
 * @param queryFn Function that returns a Supabase query
 * @param cacheKey Unique key for caching the query result
 * @param options Query options
 * @returns Query result and status
 */
export function useSupabaseQuery<T>(
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<PostgrestSingleResponse<T | null>>,
  cacheKey: string,
  options: QueryOptions = {}
) {
  const {
    enabled = true,
    cacheTime = DEFAULT_CACHE_TTL,
    staleTime = DEFAULT_CACHE_TTL / 2,
    retries = 2,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const retriesLeft = useRef(retries);
  const supabase = createClient();

  // Function to fetch data
  const fetchData = async (skipCache = false) => {
    // Check cache first if not skipping cache
    if (!skipCache) {
      const cachedResult = queryCache.get(cacheKey);
      if (cachedResult) {
        const isStale = Date.now() - cachedResult.timestamp > staleTime;
        
        // Use cached data immediately
        setData(cachedResult.data);
        setError(cachedResult.error);
        
        // If data is stale, refetch in the background
        if (isStale) {
          setIsRefetching(true);
        } else {
          // If data is fresh, return early
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const result = await queryFn(supabase);
      
      // Update state with the result
      setData(result.data);
      setError(result.error);
      
      // Cache the result
      queryCache.set(cacheKey, {
        data: result.data,
        error: result.error,
        timestamp: Date.now(),
      });
      
      // Reset retries on successful fetch
      retriesLeft.current = retries;
    } catch (err) {
      setError(err);
      
      // Retry logic
      if (retriesLeft.current > 0) {
        retriesLeft.current--;
        setTimeout(() => fetchData(true), retryDelay);
        return;
      }
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  // Function to manually refetch data
  const refetch = () => {
    setIsRefetching(true);
    return fetchData(true);
  };

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    // Reset state when cache key changes
    setData(null);
    setError(null);
    
    if (enabled) {
      setIsLoading(true);
      fetchData();
    }
    
    // Clean up cache entries older than cacheTime
    const cleanup = () => {
      const now = Date.now();
      queryCache.forEach((entry, key) => {
        if (now - entry.timestamp > cacheTime) {
          queryCache.delete(key);
        }
      });
    };
    
    cleanup();
    
    // Set up interval to clean up cache
    const intervalId = setInterval(cleanup, cacheTime);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [cacheKey, enabled]);

  return { data, error, isLoading, isRefetching, refetch };
}

/**
 * Clear the entire query cache
 */
export function clearQueryCache() {
  queryCache.clear();
}

/**
 * Clear a specific query from the cache
 * @param cacheKey The cache key to clear
 */
export function clearQueryCacheItem(cacheKey: string) {
  queryCache.delete(cacheKey);
}
