import { RateLimitEntry } from '../types';

class RateLimitService {
  private limits: Map<string, RateLimitEntry>;
  private readonly WINDOW_MS: number;
  private readonly MAX_REQUESTS: number;

  constructor() {
    this.limits = new Map();
    this.WINDOW_MS = 60000; // 1 minute
    this.MAX_REQUESTS = 60; // 60 requests per minute
    setInterval(() => this.cleanup(), this.WINDOW_MS);
  }

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(ip);

    if (!entry) {
      this.limits.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (now - entry.timestamp > this.WINDOW_MS) {
      this.limits.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (entry.count >= this.MAX_REQUESTS) {
      return false;
    }

    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.limits.entries()) {
      if (now - entry.timestamp > this.WINDOW_MS) {
        this.limits.delete(ip);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();