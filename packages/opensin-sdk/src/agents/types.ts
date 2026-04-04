/**
 * A2A SIN Agent — Base Types
 *
 * Defines the standard interface for all built-in and user-defined
 * OpenSIN agents. Mirrors the sub-agent pattern from Claude Code
 * but rebranded for the OpenSIN ecosystem.
 */

export type EffortValue = 'minimal' | 'low' | 'medium' | 'high' | 'maximum'

export type AgentColorName =
  | 'red' | 'green' | 'blue' | 'yellow' | 'cyan' | 'magenta' | 'white' | 'gray'

export type AgentSource =
  | 'built-in'
  | 'plugin'
  | 'userSettings'
  | 'projectSettings'
  | 'policySettings'
  | 'flagSettings'

export type AgentIsolation = 'worktree' | 'remote'
export type AgentMemory = 'user' | 'project' | 'local'
export type AgentModel = string | 'inherit'
export type PermissionMode = 'acceptEdits' | 'bubble' | 'autoEdit' | 'plan'

export interface AgentMcpServerSpec {
  name: string
  config?: Record<string, unknown>
}

export interface HooksSetting {
  pre?: string[]
  post?: string[]
}

/**
 * Base definition for any SIN agent.
 * Agents can be spawned synchronously or asynchronously,
 * and can participate in swarms/teams via the A2A protocol.
 */
export interface SinAgentDefinition {
  /** Unique agent type identifier (e.g. "sin-explorer", "sin-creator") */
  agentType: string

  /** Human-readable description of when to use this agent */
  whenToUse: string

  /** Tools this agent is allowed to use (empty = all available) */
  tools?: string[]

  /** Tools this agent is NOT allowed to use */
  disallowedTools?: string[]

  /** Skills available to this agent */
  skills?: string[]

  /** MCP servers this agent can access */
  mcpServers?: AgentMcpServerSpec[]

  /** Hook configuration */
  hooks?: HooksSetting

  /** Display color in terminal output */
  color?: AgentColorName

  /** Model to use (model ID or "inherit" from parent) */
  model?: AgentModel

  /** Reasoning effort level */
  effort?: EffortValue

  /** Permission mode for file edits */
  permissionMode?: PermissionMode

  /** Maximum number of turns before auto-stop */
  maxTurns?: number

  /** Whether to run in background (async) */
  background?: boolean

  /** Initial prompt sent when agent is spawned */
  initialPrompt?: string

  /** Memory scope */
  memory?: AgentMemory

  /** Isolation level */
  isolation?: AgentIsolation

  /** Whether to omit AGENTS.md context */
  omitAgentsMd?: boolean

  /** Required MCP servers (agent fails if not available) */
  requiredMcpServers?: string[]

  /** Source of this agent definition */
  source?: AgentSource

  /** Base directory for relative paths */
  baseDir?: string

  /** System prompt generator function */
  getSystemPrompt?: () => string
}

/**
 * A spawned agent instance with runtime state.
 */
export interface SpawnedAgent {
  /** Unique agent instance ID */
  id: string

  /** Agent type */
  agentType: string

  /** Team name (if part of a swarm) */
  teamName?: string

  /** Parent agent ID (undefined if root) */
  parentId?: string

  /** Session ID */
  sessionId?: string

  /** Current turn count */
  currentTurn: number

  /** Status */
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled'

  /** Result (when completed) */
  result?: string

  /** Error (if failed) */
  error?: string

  /** Start timestamp */
  startedAt: string

  /** End timestamp */
  endedAt?: string
}

/**
 * Request to spawn a new agent.
 */
export interface SpawnAgentRequest {
  /** Agent type (e.g. "sin-explorer") */
  agentType: string

  /** Description of the task */
  description: string

  /** Initial prompt / task description */
  prompt: string

  /** Whether to run asynchronously */
  background?: boolean

  /** Team name (for swarm coordination) */
  teamName?: string

  /** Override model for this spawn */
  model?: string

  /** Override max turns */
  maxTurns?: number

  /** Override effort level */
  effort?: EffortValue
}

/**
 * Result from a spawned agent.
 */
export interface SpawnAgentResult {
  /** Whether the agent completed successfully */
  success: boolean

  /** Agent instance ID */
  agentId: string

  /** Agent type */
  agentType: string

  /** Output / report from the agent */
  output: string

  /** Error message (if failed) */
  error?: string

  /** Duration in milliseconds */
  durationMs: number

  /** Number of turns executed */
  turns: number
}
