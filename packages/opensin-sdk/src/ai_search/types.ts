/**
 * OpenSIN AI Search Types
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface SearchConfig {
  maxResults: number;
  cacheTimeoutMs: number;
  rateLimitMs: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxResults: 5,
  cacheTimeoutMs: 5 * 60 * 1000,
  rateLimitMs: 1000,
};
