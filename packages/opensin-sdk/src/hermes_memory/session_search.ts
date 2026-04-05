/**
 * OpenSIN Session Search — TypeScript port of Hermes session_search_tool.py
 *
 * Searches past session transcripts and returns focused summaries.
 * Two modes: recent sessions (no query) and keyword search (with query).
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

export interface SessionMeta {
  session_id: string;
  title?: string;
  source?: string;
  started_at?: number | string;
  last_active?: number | string;
  message_count?: number;
  preview?: string;
}

export interface SessionSearchResult {
  session_id: string;
  when?: string;
  source?: string;
  model?: string;
  summary: string;
}

export interface SessionSearchResponse {
  success: boolean;
  query?: string;
  results?: SessionSearchResult[] | SessionMeta[];
  count?: number;
  message?: string;
  error?: string;
  sessions_searched?: number;
  mode?: string;
}

const MAX_SESSION_CHARS = 100000;
const HIDDEN_SESSION_SOURCES = new Set(['tool']);

function getHermesHome(): string {
  if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
  return path.join(os.homedir(), '.hermes');
}

function getSessionsDir(): string {
  return path.join(getHermesHome(), 'sessions');
}

export function formatTimestamp(ts: number | string | null | undefined): string {
  if (ts == null) return 'unknown';
  try {
    const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

export function truncateAroundMatches(fullText: string, query: string, maxChars = MAX_SESSION_CHARS): string {
  if (fullText.length <= maxChars) return fullText;
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = fullText.toLowerCase();
  let firstMatch = fullText.length;
  for (const term of queryTerms) {
    const pos = textLower.indexOf(term);
    if (pos !== -1 && pos < firstMatch) firstMatch = pos;
  }
  if (firstMatch === fullText.length) firstMatch = 0;
  const half = Math.floor(maxChars / 2);
  let start = Math.max(0, firstMatch - half);
  let end = Math.min(fullText.length, start + maxChars);
  if (end - start < maxChars) start = Math.max(0, end - maxChars);
  const truncated = fullText.slice(start, end);
  const prefix = start > 0 ? '...[earlier conversation truncated]...\n\n' : '';
  const suffix = end < fullText.length ? '\n\n...[later conversation truncated]...' : '';
  return prefix + truncated + suffix;
}

async function listSessionFiles(sessionsDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && (e.name.endsWith('.json') || e.name.endsWith('.jsonl')))
      .map(e => e.name)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function loadSessionMeta(sessionsDir: string, fileName: string): Promise<SessionMeta | null> {
  try {
    const filePath = path.join(sessionsDir, fileName);
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return {
      session_id: data.id || fileName.replace(/\.(json|jsonl)$/, ''),
      title: data.title,
      source: data.source,
      started_at: data.started_at,
      last_active: data.last_active,
      message_count: data.message_count,
      preview: data.preview,
    };
  } catch {
    return null;
  }
}

async function loadSessionMessages(sessionsDir: string, fileName: string): Promise<Array<Record<string, unknown>>> {
  try {
    const filePath = path.join(sessionsDir, fileName);
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data.messages) ? data.messages : Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatConversation(messages: Array<Record<string, unknown>>): string {
  const parts: string[] = [];
  for (const msg of messages) {
    const role = String(msg.role || 'unknown').toUpperCase();
    const content = String(msg.content || '');
    const toolName = msg.tool_name as string | undefined;
    if (role === 'TOOL' && toolName) {
      const truncated = content.length > 500 ? content.slice(0, 250) + '\n...[truncated]...\n' + content.slice(-250) : content;
      parts.push(`[TOOL:${toolName}]: ${truncated}`);
    } else if (role === 'ASSISTANT') {
      const toolCalls = msg.tool_calls as Array<Record<string, unknown>> | undefined;
      if (toolCalls?.length) {
        const names = toolCalls.map(tc => (tc as Record<string, unknown>).name || (tc as Record<string, unknown>).function?.name || '?').filter(Boolean);
        if (names.length) parts.push(`[ASSISTANT]: [Called: ${names.join(', ')}]`);
      }
      if (content) parts.push(`[ASSISTANT]: ${content}`);
    } else {
      parts.push(`[${role}]: ${content}`);
    }
  }
  return parts.join('\n\n');
}

export async function sessionSearch(
  query = '',
  roleFilter?: string,
  limit = 3,
  currentSessionId?: string,
  sessionsDir?: string,
): Promise<string> {
  const dir = sessionsDir || getSessionsDir();
  limit = Math.min(limit, 5);

  if (!query || !query.trim()) {
    return listRecentSessions(dir, limit, currentSessionId);
  }

  return searchSessions(query.trim(), roleFilter, limit, currentSessionId, dir);
}

async function listRecentSessions(sessionsDir: string, limit: number, currentSessionId?: string): Promise<string> {
  try {
    const files = await listSessionFiles(sessionsDir);
    const results: SessionMeta[] = [];
    for (const file of files) {
      const meta = await loadSessionMeta(sessionsDir, file);
      if (!meta) continue;
      if (meta.session_id === currentSessionId) continue;
      if (meta.source && HIDDEN_SESSION_SOURCES.has(meta.source)) continue;
      results.push(meta);
      if (results.length >= limit) break;
    }
    return JSON.stringify({
      success: true,
      mode: 'recent',
      results,
      count: results.length,
      message: `Showing ${results.length} most recent sessions. Use a keyword query to search specific topics.`,
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ success: false, error: `Failed to list recent sessions: ${e}` }, null, 2);
  }
}

async function searchSessions(
  query: string,
  roleFilter: string | undefined,
  limit: number,
  currentSessionId: string | undefined,
  sessionsDir: string,
): Promise<string> {
  try {
    const files = await listSessionFiles(sessionsDir);
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results: SessionSearchResult[] = [];

    for (const file of files) {
      if (results.length >= limit) break;
      const meta = await loadSessionMeta(sessionsDir, file);
      if (!meta || meta.session_id === currentSessionId) continue;
      if (meta.source && HIDDEN_SESSION_SOURCES.has(meta.source)) continue;

      const messages = await loadSessionMessages(sessionsDir, file);
      const filteredMessages = roleFilter
        ? messages.filter(m => roleFilter.split(',').includes(String(m.role)))
        : messages;

      const conversationText = formatConversation(filteredMessages);
      const matches = queryTerms.some(term => conversationText.toLowerCase().includes(term));

      if (matches) {
        const truncated = truncateAroundMatches(conversationText, query);
        const summary = generateSummary(query, meta, truncated);
        results.push({
          session_id: meta.session_id,
          when: formatTimestamp(meta.started_at),
          source: meta.source,
          summary,
        });
      }
    }

    return JSON.stringify({
      success: true,
      query,
      results,
      count: results.length,
      sessions_searched: files.length,
    }, null, 2);
  } catch (e) {
    return JSON.stringify({ success: false, error: `Search failed: ${e}` }, null, 2);
  }
}

function generateSummary(query: string, meta: SessionMeta, conversationText: string): string {
  const preview = conversationText.slice(0, 2000);
  return `[Session: ${meta.title || meta.session_id}]\n[Date: ${formatTimestamp(meta.started_at)}]\n\n${preview}\n\n...[truncated]`;
}

export const SESSION_SEARCH_SCHEMA = {
  name: 'session_search',
  description: 'Search your long-term memory of past conversations, or browse recent sessions. Two modes: recent sessions (no query) returns titles, previews, timestamps. Keyword search (with query) returns summaries of matching sessions. Use proactively when user says "we did this before", "remember when", "last time".',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query — keywords to find in past sessions. Omit to browse recent sessions.' },
      role_filter: { type: 'string', description: 'Optional: only search messages from specific roles (comma-separated). E.g. "user,assistant".' },
      limit: { type: 'integer', description: 'Max sessions to return (default: 3, max: 5).', default: 3 },
    },
    required: [],
  },
};
