/**
 * Simple in-memory cache for API responses
 * Football-data.org limits: 10 req/min
 * Caching strategy:
 * - Fixtures: 5-10 minutes
 * - Standings: 1 hour
 */

import fs from 'fs';
import path from 'path';

import os from 'os';

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// Vercel serverless functions have a read-only filesystem.
// used os.tmpdir() (which maps to /tmp) for any runtime file writes.
const DISK_CACHE_DIR = path.join(os.tmpdir(), 'safescore-cache');

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();

  constructor() {
    if (typeof window === 'undefined' && !fs.existsSync(DISK_CACHE_DIR)) {
      try {
        fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });
      } catch (e) {
        console.warn('Cache: Could not create disk cache directory', e);
      }
    }
  }

  /**
   * Get cached value if it exists and hasn't expired
   * Now checks Disk Cache if in-memory fails (on server-side)
   */
  get<T>(key: string, maxAgeMs: number): T | null {
    // 1. Check Memory
    const entry = this.store.get(key);
    if (entry) {
      const ageMs = Date.now() - entry.timestamp;
      if (ageMs > maxAgeMs) {
        this.store.delete(key);
      } else {
        return entry.data as T;
      }
    }

    // 2. Check Disk (Server-only)
    if (typeof window === 'undefined') {
      const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
      const filePath = path.join(DISK_CACHE_DIR, `${sanitizedKey}.json`);

      if (fs.existsSync(filePath)) {
        try {
          const stats = fs.statSync(filePath);
          const ageMs = Date.now() - stats.mtimeMs;

          if (ageMs < maxAgeMs) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            // Refill memory cache
            this.store.set(key, { timestamp: stats.mtimeMs, data });
            return data as T;
          } else {
            fs.unlinkSync(filePath); // Cleanup expired file
          }
        } catch (e) {
          console.warn(`Cache: Error reading disk cache for ${key}`, e);
        }
      }
    }

    return null;
  }

  /**
   * Set a value in cache and persist to disk
   */
  set<T>(key: string, data: T): void {
    const timestamp = Date.now();
    // Update Memory
    this.store.set(key, { timestamp, data });

    // Update Disk (Server-only)
    if (typeof window === 'undefined') {
      try {
        const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
        const filePath = path.join(DISK_CACHE_DIR, `${sanitizedKey}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data));
      } catch (e) {
        console.warn(`Cache: Error writing disk cache for ${key}`, e);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  delete(key: string): void {
    this.store.delete(key);
    if (typeof window === 'undefined') {
      const sanitizedKey = key.replace(/[^a-z0-9_-]/gi, '_');
      const filePath = path.join(DISK_CACHE_DIR, `${sanitizedKey}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new Cache();

export const CACHE_DURATIONS = {
  FIXTURES: 5 * 60 * 1000,
  STANDINGS: 24 * 60 * 60 * 1000, // Extend to 24h for disk cache
  H2H: 24 * 60 * 60 * 1000,
};