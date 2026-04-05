/**
 * OpenSIN Background Agents — Persistence Layer
 *
 * Handles disk I/O for delegation artifacts.
 * Results are saved as markdown files that survive context compaction,
 * session restarts, and process crashes.
 *
 * Storage path: ~/.local/share/opensin/delegations/<parent-session-id>/<delegation-id>.md
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { DelegationRecord } from './types.js';

/**
 * Ensure the delegations directory exists for a given parent session.
 */
export async function ensureDelegationsDir(
  baseDir: string,
  parentSessionId: string,
): Promise<string> {
  const dir = path.join(baseDir, parentSessionId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Get the artifact file path for a delegation.
 */
export function getArtifactPath(baseDir: string, parentSessionId: string, delegationId: string): string {
  return path.join(baseDir, parentSessionId, `${delegationId}.md`);
}

/**
 * Persist delegation result to a markdown file.
 */
export async function persistDelegationResult(
  delegation: DelegationRecord,
  content: string,
): Promise<{ success: boolean; byteLength?: number; error?: string }> {
  try {
    const title = delegation.title || delegation.id;
    const description = delegation.description || '(No description generated)';
    const startedAt = delegation.startedAt || delegation.createdAt;

    const header = `# ${title}

${description}

**ID:** ${delegation.id}
**Agent:** ${delegation.agentType}
**Status:** ${delegation.status}
**Session:** ${delegation.sessionId}
**Started:** ${startedAt.toISOString()}
**Completed:** ${delegation.completedAt?.toISOString() || 'N/A'}

---

`;

    await fs.writeFile(delegation.artifact.filePath, header + content, 'utf8');
    const stats = await fs.stat(delegation.artifact.filePath);

    return {
      success: true,
      byteLength: stats.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Read a persisted delegation artifact.
 * Returns null if the file doesn't exist yet.
 */
export async function readArtifact(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Wait for an artifact to be persisted (polling).
 */
export async function waitForArtifact(
  filePath: string,
  maxWaitMs: number,
  pollIntervalMs: number = 250,
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const content = await readArtifact(filePath);
    if (content !== null) return content;
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  return null;
}

/**
 * List all delegation artifacts for a parent session.
 */
export async function listArtifacts(
  baseDir: string,
  parentSessionId: string,
): Promise<string[]> {
  try {
    const dir = path.join(baseDir, parentSessionId);
    const entries = await fs.readdir(dir);
    return entries
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(dir, f));
  } catch {
    return [];
  }
}

/**
 * Delete a delegation artifact.
 */
export async function deleteArtifact(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
