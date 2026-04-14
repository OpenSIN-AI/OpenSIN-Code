/**
 * Session cache clearing utilities.
 * This module is imported at startup by main.tsx, so keep imports minimal.
 */
import { feature } from 'bun:bundle'
import {
  clearInvokedSkills,
  setLastEmittedDate,
} from '../../bootstrap/state'
import { clearCommandsCache } from '../../commands'
import { getSessionStartDate } from '../../constants/common'
import {
  getGitStatus,
  getSystemContext,
  getUserContext,
  setSystemPromptInjection,
} from '../../context'
import { clearFileSuggestionCaches } from '../../hooks/fileSuggestions'
import { clearAllPendingCallbacks } from '../../hooks/useSwarmPermissionPoller'
import { clearAllDumpState } from '../../services/api/dumpPrompts'
import { resetPromptCacheBreakDetection } from '../../services/api/promptCacheBreakDetection'
import { clearAllSessions } from '../../services/api/sessionIngress'
import { runPostCompactCleanup } from '../../services/compact/postCompactCleanup'
import { resetAllLSPDiagnosticState } from '../../services/lsp/LSPDiagnosticRegistry'
import { clearTrackedMagicDocs } from '../../services/MagicDocs/magicDocs'
import { clearDynamicSkills } from '../../skills/loadSkillsDir'
import { resetSentSkillNames } from '../../utils/attachments'
import { clearCommandPrefixCaches } from '../../utils/bash/commands'
import { resetGetMemoryFilesCache } from '../../utils/claudemd'
import { clearRepositoryCaches } from '../../utils/detectRepository'
import { clearResolveGitDirCache } from '../../utils/git/gitFilesystem'
import { clearStoredImagePaths } from '../../utils/imageStore'
import { clearSessionEnvVars } from '../../utils/sessionEnvVars'

/**
 * Clear all session-related caches.
 * Call this when resuming a session to ensure fresh file/skill discovery.
 * This is a subset of what clearConversation does - it only clears caches
 * without affecting messages, session ID, or triggering hooks.
 *
 * @param preservedAgentIds - Agent IDs whose per-agent state should survive
 *   the clear (e.g., background tasks preserved across /clear). When non-empty,
 *   agentId-keyed state (invoked skills) is selectively cleared and requestId-keyed
 *   state (pending permission callbacks, dump state, cache-break tracking) is left
 *   intact since it cannot be safely scoped to the main session.
 */
export function clearSessionCaches(
  preservedAgentIds: ReadonlySet<string> = new Set(),
): void {
  const hasPreserved = preservedAgentIds.size > 0
  // Clear context caches
  getUserContext.cache.clear?.()
  getSystemContext.cache.clear?.()
  getGitStatus.cache.clear?.()
  getSessionStartDate.cache.clear?.()
  // Clear file suggestion caches (for @ mentions)
  clearFileSuggestionCaches()

  // Clear commands/skills cache
  clearCommandsCache()

  // Clear prompt cache break detection state
  if (!hasPreserved) resetPromptCacheBreakDetection()

  // Clear system prompt injection (cache breaker)
  setSystemPromptInjection(null)

  // Clear last emitted date so it's re-detected on next turn
  setLastEmittedDate(null)

  // Run post-compaction cleanup (clears system prompt sections, microcompact tracking,
  // classifier approvals, speculative checks, and — for main-thread compacts — memory
  // files cache with load_reason 'compact').
  runPostCompactCleanup()
  // Reset sent skill names so the skill listing is re-sent after /clear.
  // runPostCompactCleanup intentionally does NOT reset this (post-compact
  // re-injection costs ~4K tokens), but /clear wipes messages entirely so
  // the model needs the full listing again.
  resetSentSkillNames()
  // Override the memory cache reset with 'session_start': clearSessionCaches is called
  // from /clear and --resume/--continue, which are NOT compaction events. Without this,
  // the InstructionsLoaded hook would fire with load_reason 'compact' instead of
  // 'session_start' on the next getMemoryFiles() call.
  resetGetMemoryFilesCache('session_start')

  // Clear stored image paths cache
  clearStoredImagePaths()

  // Clear all session ingress caches (lastUuidMap, sequentialAppendBySession)
  clearAllSessions()
  // Clear swarm permission pending callbacks
  if (!hasPreserved) clearAllPendingCallbacks()

  // Clear tungsten session usage tracking
  if (process.env.USER_TYPE === 'ant') {
    void import('../../tools/TungstenTool/TungstenTool').then(
      ({ clearSessionsWithTungstenUsage, resetInitializationState }) => {
        clearSessionsWithTungstenUsage()
        resetInitializationState()
      },
    )
  }
  // Clear attribution caches (file content cache, pending bash states)
  // Dynamic import to preserve dead code elimination for COMMIT_ATTRIBUTION feature flag
  if (feature('COMMIT_ATTRIBUTION')) {
    void import('../../utils/attributionHooks').then(
      ({ clearAttributionCaches }) => clearAttributionCaches(),
    )
  }
  // Clear repository detection caches
  clearRepositoryCaches()
  // Clear bash command prefix caches (Haiku-extracted prefixes)
  clearCommandPrefixCaches()
  // Clear dump prompts state
  if (!hasPreserved) clearAllDumpState()
  // Clear invoked skills cache (each entry holds full skill file content)
  clearInvokedSkills(preservedAgentIds)
  // Clear git dir resolution cache
  clearResolveGitDirCache()
  // Clear dynamic skills (loaded from skill directories)
  clearDynamicSkills()
  // Clear LSP diagnostic tracking state
  resetAllLSPDiagnosticState()
  // Clear tracked magic docs
  clearTrackedMagicDocs()
  // Clear session environment variables
  clearSessionEnvVars()
  // Clear WebFetch URL cache (up to 50MB of cached page content)
  void import('../../tools/WebFetchTool/utils').then(
    ({ clearWebFetchCache }) => clearWebFetchCache(),
  )
  // Clear ToolSearch description cache (full tool prompts, ~500KB for 50 MCP tools)
  void import('../../tools/ToolSearchTool/ToolSearchTool').then(
    ({ clearToolSearchDescriptionCache }) => clearToolSearchDescriptionCache(),
  )
  // Clear agent definitions cache (accumulates per-cwd via EnterWorktreeTool)
  void import('../../tools/AgentTool/loadAgentsDir').then(
    ({ clearAgentDefinitionsCache }) => clearAgentDefinitionsCache(),
  )
  // Clear SkillTool prompt cache (accumulates per project root)
  void import('../../tools/SkillTool/prompt').then(({ clearPromptCache }) =>
    clearPromptCache(),
  )
}
