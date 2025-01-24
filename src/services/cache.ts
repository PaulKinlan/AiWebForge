import { CacheEntry, ContextData } from '../types';

class CacheService {
  private cache: Map<string, CacheEntry>;
  private context: ContextData;
  private readonly MAX_CACHE_AGE: number;
  private readonly MAX_CONTEXT_ENTRIES: number;

  constructor() {
    this.cache = new Map();
    this.context = {
      previousRequests: []
    };
    this.MAX_CACHE_AGE = 3600000; // 1 hour
    this.MAX_CONTEXT_ENTRIES = 10;
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.MAX_CACHE_AGE) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, content: string, contentType: string): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      contentType
    });

    this.updateContext(key, content);
  }

  private updateContext(path: string, content: string): void {
    this.context.previousRequests.unshift({
      path,
      content,
      timestamp: Date.now()
    });

    // Keep only the most recent entries
    if (this.context.previousRequests.length > this.MAX_CONTEXT_ENTRIES) {
      this.context.previousRequests.pop();
    }
  }

  getContext(): ContextData {
    return this.context;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();