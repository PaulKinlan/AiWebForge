export interface CacheEntry {
  content: string;
  timestamp: number;
  contentType: string;
}

export interface RateLimitEntry {
  count: number;
  timestamp: number;
}

export interface ContextData {
  previousRequests: Array<{
    path: string;
    content: string;
    timestamp: number;
  }>;
}

export type ContentType = 'html' | 'css' | 'js';
