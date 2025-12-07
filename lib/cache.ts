/**
 * Simple in-memory cache for API responses
 * Football-data.org limits: 10 req/min
 * Caching strategy:
 * - Fixtures: 5-10 minutes
 * - Standings: 1 hour
 */

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Get cached value if it exists and hasn't expired
   */
  get<T>(key: string, maxAgeMs: number): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const ageMs = Date.now() - entry.timestamp;
    if (ageMs > maxAgeMs) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T): void {
    this.store.set(key, {
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get cache size for debugging
   */
  size(): number {
    return this.store.size;
  }
}

export const cache = new Cache();

// Cache durations (in milliseconds)
export const CACHE_DURATIONS = {
  FIXTURES: 5 * 60 * 1000, // 5 minutes
  STANDINGS: 60 * 60 * 1000, // 1 hour
  H2H: 24 * 60 * 60 * 1000, // 24 hours
};
