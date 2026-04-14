/**
 * OpenSIN Code - Background Agents Plugin
 * BackgroundAgentManager: Core delegation engine
 *
 * Claude Code-style background agents with:
 * - Async agent spawning via /spawn
 * - Status tracking (/agents list, /agents status, /agents kill, /agents read)
 * - Context persistence between agent turns
 * - Results delivery when agents complete
 * - Agent isolation (separate sessions)
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { OpenSINClient } from '../client'
import type { Message, ToolDefinition } from '../types'
import type {
  BackgroundAgentStatus,
  TerminalStatus,
  BackgroundAgentRecord,
  SpawnAgentInput,
  AgentListItem,
  AgentManagerOptions,
} from './types'
import {
  isTerminalStatus,
  DEFAULT_MAX_RUN_TIME_MS,
  TERMINAL_WAIT_GRACE_MS,
  READ_POLL_INTERVAL_MS,
  ALL_COMPLETE_QUIET_PERIOD_MS,
} from './types'

// ==========================================
// READABLE ID GENERATION
// ==========================================

const ADJECTIVES = [
  'swift', 'bold', 'calm', 'deep', 'fast', 'keen', 'lucky', 'proud',
  'sharp', 'smart', 'vivid', 'warm', 'wise', 'bright', 'clear', 'cool',
  'eager', 'fair', 'fine', 'grand', 'light', 'neat', 'prime',
]

const COLORS = [
  'red', 'blue', 'green', 'gold', 'cyan', 'pink', 'teal', 'navy',
  'amber', 'coral', 'ivory', 'lilac', 'olive', 'pearl', 'ruby', 'snow',
]

const ANIMALS = [
  'hawk', 'wolf', 'bear', 'fox', 'lynx', 'owl', 'eagle', 'tiger',
  'lion', 'shark', 'whale', 'crane', 'cobra', 'raven', 'falcon', 'puma',
]

function generateReadableId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const col = COLORS[Math.floor(Math.random() * COLORS.length)]
  const ani = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adj}-${col}-${ani}`
}

// ==========================================
// LOGGING HELPER
// ==========================================

interface Logger {
  debug: (msg: string) => void
  info: (msg: string) => void
  warn: (msg: string) => void
  error: (msg: string) => void
}

function createLogger(): Logger {
  return {
    debug: (msg: string) => { /* silent in production */ },
    info: (msg: string) => { /* silent in production */ },
    warn: (msg: string) => console.warn(`[sin-bg-agents] ${msg}`),
    error: (msg: string) => console.error(`[sin-bg-agents] ${msg}`),
  }
}

// ==========================================
// PARENT NOTIFICATION STATE
// ==========================================

interface ParentNotificationState {
  allCompleteNotifiedAt?: Date
  allCompleteNotificationCount: number
  allCompleteCycle: number
  allCompleteCycleToken: string
  allCompleteNotifiedCycle?: number
  allCompleteNotifiedCycleToken?: string
  allCompleteScheduledCycle?: number
  allCompleteScheduledCycleToken?: string
  allCompleteScheduledTimer?: ReturnType<typeof setTimeout>
}

// ==========================================
// BACKGROUND AGENT MANAGER
// ==========================================

export class BackgroundAgentManager {
  private agents: Map<string, BackgroundAgentRecord> = new Map()
  private agentsBySession: Map<string, string> = new Map()
  private terminalWaiters: Map<string, { promise: Promise<void>; resolve: () => void }> = new Map()
  private timeoutTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private client: OpenSINClient
  private baseDir: string
  private log: Logger
  private maxRunTimeMs: number
  private readPollIntervalMs: number
  private terminalWaitGraceMs: number
  private allCompleteQuietPeriodMs: number
  private idGenerator: () => string
  private pendingByParent: Map<string, Set<string>> = new Map()
  private parentNotificationState: Map<string, ParentNotificationState> = new Map()

  constructor(
    client: OpenSINClient,
    baseDir: string,
    options: AgentManagerOptions = {},
  ) {
    this.client = client
    this.baseDir = baseDir
    this.log = createLogger()
    this.maxRunTimeMs = options.maxRunTimeMs ?? DEFAULT_MAX_RUN_TIME_MS
    this.readPollIntervalMs = options.readPollIntervalMs ?? READ_POLL_INTERVAL_MS
    this.terminalWaitGraceMs = options.terminalWaitGraceMs ?? TERMINAL_WAIT_GRACE_MS
    this.allCompleteQuietPeriodMs = options.allCompleteQuietPeriodMs ?? ALL_COMPLETE_QUIET_PERIOD_MS
    this.idGenerator = options.idGenerator ?? generateReadableId
  }

  // ==========================================
  // SESSION HELPERS
  // ==========================================

  private async getAgentsDir(sessionID: string): Promise<string> {
    return path.join(this.baseDir, sessionID)
  }

  private async ensureAgentsDir(sessionID: string): Promise<string> {
    const dir = await this.getAgentsDir(sessionID)
    await fs.mkdir(dir, { recursive: true })
    return dir
  }

  // ==========================================
  // TERMINAL WAITER
  // ==========================================

  private createTerminalWaiter(id: string): void {
    if (this.terminalWaiters.has(id)) return
    let resolve: (() => void) | undefined
    const promise = new Promise<void>((r) => { resolve = r })
    if (!resolve) throw new Error(`Failed to initialize terminal waiter for agent ${id}`)
    this.terminalWaiters.set(id, { promise, resolve })
  }

  private resolveTerminalWaiter(id: string): void {
    const waiter = this.terminalWaiters.get(id)
    if (waiter) waiter.resolve()
  }

  // ==========================================
  // TIMEOUT MANAGEMENT
  // ==========================================

  private clearTimeoutTimer(id: string): void {
    const timer = this.timeoutTimers.get(id)
    if (timer) { clearTimeout(timer); this.timeoutTimers.delete(id) }
  }

  private scheduleTimeout(id: string): void {
    this.clearTimeoutTimer(id)
    const timer = setTimeout(() => { void this.handleTimeout(id) }, this.maxRunTimeMs + 5_000)
    this.timeoutTimers.set(id, timer)
  }

  // ==========================================
  // DELEGATION STATE MUTATION
  // ==========================================

  private updateAgent(
    id: string,
    mutate: (agent: BackgroundAgentRecord, now: Date) => void,
  ): BackgroundAgentRecord | undefined {
    const agent = this.agents.get(id)
    if (!agent) return undefined
    const now = new Date()
    mutate(agent, now)
    agent.updatedAt = now
    return agent
  }

  private registerAgent(input: {
    id: string
    rootSessionID: string
    sessionID: string
    parentSessionID: string
    parentMessageID: string
    parentAgent: string
    prompt: string
    agent: string
    artifactPath: string
  }): BackgroundAgentRecord {
    if (!this.pendingByParent.has(input.parentSessionID)) {
      this.pendingByParent.set(input.parentSessionID, new Set())
      this.resetParentAllCompleteNotificationCycle(input.parentSessionID)
    }

    const now = new Date()

    const record: BackgroundAgentRecord = {
      id: input.id,
      rootSessionID: input.rootSessionID,
      sessionID: input.sessionID,
      parentSessionID: input.parentSessionID,
      parentMessageID: input.parentMessageID,
      parentAgent: input.parentAgent,
      prompt: input.prompt,
      agent: input.agent,
      status: 'registered',
      createdAt: now,
      updatedAt: now,
      timeoutAt: new Date(now.getTime() + this.maxRunTimeMs),
      progress: { toolCalls: 0, lastUpdateAt: now, lastHeartbeatAt: now },
      notification: { terminalNotificationCount: 0 },
      retrieval: { retrievalCount: 0 },
      artifact: { filePath: input.artifactPath },
    }

    this.agents.set(record.id, record)
    this.agentsBySession.set(record.sessionID, record.id)
    this.createTerminalWaiter(record.id)
    this.pendingByParent.get(record.parentSessionID)?.add(record.id)

    return record
  }

  private markStarted(id: string): BackgroundAgentRecord | undefined {
    return this.updateAgent(id, (agent, now) => {
      if (isTerminalStatus(agent.status)) return
      agent.status = 'running'
      agent.startedAt = now
      agent.progress.lastUpdateAt = now
      agent.progress.lastHeartbeatAt = now
    })
  }

  private markProgress(id: string, messageText?: string): BackgroundAgentRecord | undefined {
    return this.updateAgent(id, (agent, now) => {
      if (isTerminalStatus(agent.status)) return
      if (agent.status === 'registered') {
        agent.status = 'running'
        agent.startedAt = agent.startedAt ?? now
      }
      agent.progress.lastUpdateAt = now
      agent.progress.lastHeartbeatAt = now
      if (messageText) {
        agent.progress.lastMessage = messageText
        agent.progress.lastMessageAt = now
      }
    })
  }

  private markTerminal(
    id: string,
    status: TerminalStatus,
    error?: string,
  ): { transitioned: boolean; agent?: BackgroundAgentRecord } {
    const agent = this.agents.get(id)
    if (!agent) return { transitioned: false }
    if (isTerminalStatus(agent.status)) return { transitioned: false, agent }

    const now = new Date()
    agent.status = status
    agent.completedAt = now
    agent.updatedAt = now
    if (error) agent.error = error

    const pending = this.pendingByParent.get(agent.parentSessionID)
    if (pending) {
      pending.delete(agent.id)
      if (pending.size === 0) this.pendingByParent.delete(agent.parentSessionID)
    }

    this.clearTimeoutTimer(id)
    this.resolveTerminalWaiter(id)

    return { transitioned: true, agent }
  }

  private markNotified(id: string): BackgroundAgentRecord | undefined {
    return this.updateAgent(id, (agent) => {
      agent.notification.terminalNotifiedAt = new Date()
      agent.notification.terminalNotificationCount += 1
    })
  }

  private markRetrieved(id: string, readerSessionID: string): BackgroundAgentRecord | undefined {
    return this.updateAgent(id, (agent) => {
      agent.retrieval.retrievedAt = new Date()
      agent.retrieval.retrievalCount += 1
      agent.retrieval.lastReaderSessionID = readerSessionID
    })
  }

  // ==========================================
  // PARENT NOTIFICATION
  // ==========================================

  private getParentNotificationState(parentSessionID: string): ParentNotificationState {
    const existing = this.parentNotificationState.get(parentSessionID)
    if (existing) return existing
    const state: ParentNotificationState = {
      allCompleteNotificationCount: 0,
      allCompleteCycle: 0,
      allCompleteCycleToken: `${parentSessionID}:0`,
    }
    this.parentNotificationState.set(parentSessionID, state)
    return state
  }

  private resetParentAllCompleteNotificationCycle(parentSessionID: string): void {
    const state = this.getParentNotificationState(parentSessionID)
    this.cancelScheduledAllComplete(state)
    state.allCompleteCycle += 1
    state.allCompleteCycleToken = `${parentSessionID}:${state.allCompleteCycle}`
    state.allCompleteNotifiedAt = undefined
    state.allCompleteNotifiedCycle = undefined
    state.allCompleteNotifiedCycleToken = undefined
  }

  private cancelScheduledAllComplete(state: ParentNotificationState): void {
    if (state.allCompleteScheduledTimer) {
      clearTimeout(state.allCompleteScheduledTimer)
    }
    state.allCompleteScheduledTimer = undefined
    state.allCompleteScheduledCycle = undefined
    state.allCompleteScheduledCycleToken = undefined
  }

  private areCycleTerminalNotificationsComplete(
    parentSessionID: string,
    cycleToken: string,
  ): boolean {
    let count = 0
    for (const agent of this.agents.values()) {
      if (agent.parentSessionID !== parentSessionID) continue
      if (agent.status === 'registered' || agent.status === 'running') continue
      count += 1
      if (!agent.notification.terminalNotifiedAt) return false
    }
    return count > 0
  }

  private scheduleAllCompleteForParent(parentSessionID: string, _parentAgent: string): void {
    const state = this.getParentNotificationState(parentSessionID)
    const cycleToken = state.allCompleteCycleToken
    if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return
    if (state.allCompleteNotifiedCycleToken === cycleToken) return
    if (state.allCompleteScheduledCycleToken === cycleToken) return

    this.cancelScheduledAllComplete(state)
    state.allCompleteScheduledCycleToken = cycleToken
    state.allCompleteScheduledTimer = setTimeout(() => {
      void this.dispatchAllCompleteNotification(parentSessionID, cycleToken)
    }, this.allCompleteQuietPeriodMs)
  }

  private async dispatchAllCompleteNotification(
    parentSessionID: string,
    cycleToken: string,
  ): Promise<void> {
    const state = this.getParentNotificationState(parentSessionID)
    if (state.allCompleteScheduledCycleToken !== cycleToken) return
    this.cancelScheduledAllComplete(state)
    if (state.allCompleteCycleToken !== cycleToken) return
    if (!this.areCycleTerminalNotificationsComplete(parentSessionID, cycleToken)) return
    if (state.allCompleteNotifiedCycleToken === cycleToken) return

    const notification = [
      '<sin-agent-notification>',
      '<type>all-complete</type>',
      '<status>completed</status>',
      '<summary>All OpenSIN background agents complete.</summary>',
      `<parent-session-id>${parentSessionID}</parent-session-id>`,
      `<cycle-token>${cycleToken}</cycle-token>`,
      '</sin-agent-notification>',
    ].join('\n')

    this.log.info(`All agents complete for session ${parentSessionID}: ${notification}`)

    state.allCompleteNotifiedAt = new Date()
    state.allCompleteNotificationCount += 1
    state.allCompleteNotifiedCycleToken = cycleToken
  }

  // ==========================================
  // UNIQUE ID GENERATION
  // ==========================================

  private async generateUniqueAgentId(artifactDir: string): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = this.idGenerator()
      if (this.agents.has(candidate)) continue
      const candidatePath = path.join(artifactDir, `${candidate}.md`)
      try {
        await fs.access(candidatePath)
      } catch {
        return candidate
      }
    }
    throw new Error('Failed to generate unique agent ID after 20 attempts')
  }

  // ==========================================
  // PUBLIC API: SPAWN
  // ==========================================

  async spawn(input: SpawnAgentInput): Promise<BackgroundAgentRecord> {
    const artifactDir = await this.ensureAgentsDir(input.parentSessionID)
    const stableId = await this.generateUniqueAgentId(artifactDir)
    const artifactPath = path.join(artifactDir, `${stableId}.md`)

    this.log.debug(`spawn() called, generated stable ID: ${stableId}`)

    // Create isolated session for the background agent
    const sessionResult = await this.client.createSession({
      workspace: process.cwd(),
      title: `OpenSIN Agent: ${stableId}`,
    })

    if (!sessionResult?.session_id) {
      throw new Error('Failed to create background agent session')
    }

    const agent = this.registerAgent({
      id: stableId,
      rootSessionID: input.parentSessionID,
      sessionID: sessionResult.session_id,
      parentSessionID: input.parentSessionID,
      parentMessageID: input.parentMessageID,
      parentAgent: input.parentAgent,
      prompt: input.prompt,
      agent: input.agent,
      artifactPath,
    })

    this.log.debug(`Registered background agent ${agent.id} before execution`)
    this.scheduleTimeout(agent.id)
    this.markStarted(agent.id)

    // Fire the prompt in the isolated session (fire-and-forget)
    // Anti-recursion: disable nested spawning via tool restrictions
      const messages: Message[] = [
        { role: 'user', content: `You are a background agent (${input.agent}). Work on this task independently and provide a complete, self-contained result.

Task: ${input.prompt}` },
      ]

    // Get available tools and filter out delegation tools
    let tools: ToolDefinition[] | undefined
    try {
      const toolsResp = await this.client.listTools()
      tools = toolsResp.tools.filter((t: ToolDefinition) =>
        t.name !== 'spawn' && t.name !== 'task' && t.name !== 'todowrite'
      )
    } catch {
      // If tool listing fails, proceed without tool restrictions
      tools = undefined
    }

    this.client
      .prompt(agent.sessionID, messages, tools)
      .then((result) => {
        void this.finalizeAgentWithResult(agent.id, result.content)
      })
      .catch((error: Error) => {
        void this.finalizeAgent(agent.id, 'error', error.message)
      })

    return agent
  }

  // ==========================================
  // PUBLIC API: KILL
  // ==========================================

  async kill(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId)
    if (!agent) return false
    if (isTerminalStatus(agent.status)) return false

    // Try to delete the session
    try {
      await this.client.deleteSession(agent.sessionID)
    } catch {
      // Session may already be gone
    }

    await this.finalizeAgent(agent.id, 'cancelled', 'Agent was manually cancelled by user')
    return true
  }

  // ==========================================
  // PUBLIC API: STATUS
  // ==========================================

  async listAgents(rootSessionID: string): Promise<AgentListItem[]> {
    const items: AgentListItem[] = []
    for (const agent of this.agents.values()) {
      if (agent.rootSessionID !== rootSessionID) continue
      items.push({
        id: agent.id,
        status: agent.status,
        title: agent.title,
        description: agent.description,
        agent: agent.agent,
        prompt: agent.prompt,
        unread: this.hasUnreadCompletion(agent),
        createdAt: agent.createdAt,
        completedAt: agent.completedAt,
      })
    }
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  getAgent(agentId: string): BackgroundAgentRecord | undefined {
    return this.agents.get(agentId)
  }

  findBySession(sessionID: string): BackgroundAgentRecord | undefined {
    const agentId = this.agentsBySession.get(sessionID)
    if (!agentId) return undefined
    return this.agents.get(agentId)
  }

  // ==========================================
  // PUBLIC API: READ (retrieve result)
  // ==========================================

  async readAgentResult(
    agentId: string,
    readerSessionID: string,
  ): Promise<string> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      return this.readPersistedArtifactById(agentId)
    }

    this.markRetrieved(agentId, readerSessionID)

    if (!isTerminalStatus(agent.status)) {
      const result = await this.waitForTerminal(agentId, this.terminalWaitGraceMs)
      if (result === 'timeout') {
        return this.buildDeterministicReadResponse(agent)
      }
    }

    // Try persisted artifact first
    const persisted = await this.waitForPersistedArtifact(
      agent.artifact.filePath,
      this.terminalWaitGraceMs,
    )
    if (persisted) return persisted

    return this.buildDeterministicReadResponse(agent)
  }

  // ==========================================
  // TIMEOUT HANDLER
  // ==========================================

  private async handleTimeout(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent || isTerminalStatus(agent.status)) return

    this.log.debug(`handleTimeout for background agent ${agent.id}`)

    try {
      await this.client.deleteSession(agent.sessionID)
    } catch {
      // Ignore
    }

    await this.finalizeAgent(
      agent.id,
      'timeout',
      `Background agent timed out after ${this.maxRunTimeMs / 1000}s`,
    )
  }

  // ==========================================
  // SESSION IDLE HANDLER
  // ==========================================

  async handleSessionIdle(sessionID: string): Promise<void> {
    const agent = this.findBySession(sessionID)
    if (!agent || isTerminalStatus(agent.status)) return

    this.log.debug(`handleSessionIdle for background agent ${agent.id}`)
    await this.finalizeAgent(agent.id, 'complete')
  }

  // ==========================================
  // FINALIZATION
  // ==========================================

  private async finalizeAgent(
    agentId: string,
    status: TerminalStatus,
    error?: string,
  ): Promise<void> {
    const { transitioned, agent } = this.markTerminal(agentId, status, error)
    if (!transitioned || !agent) return

    this.log.debug(`finalizeAgent(${agent.id}, ${status}) started`)

    const resolvedResult = await this.resolveAgentResult(agent)
    agent.result = resolvedResult

    if (resolvedResult.trim().length > 0) {
      const metadata = this.generateMetadata(resolvedResult)
      agent.title = metadata.title
      agent.description = metadata.description
    }

    await this.persistOutput(agent, resolvedResult)
    await this.notifyParent(agent.id)
  }

  private async finalizeAgentWithResult(
    agentId: string,
    content: string,
  ): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return
    if (isTerminalStatus(agent.status)) return

    const { transitioned } = this.markTerminal(agentId, 'complete')
    if (!transitioned) return

    this.log.debug(`finalizeAgentWithResult(${agent.id}) started`)

    agent.result = content

    if (content.trim().length > 0) {
      const metadata = this.generateMetadata(content)
      agent.title = metadata.title
      agent.description = metadata.description
    }

    await this.persistOutput(agent, content)
    await this.notifyParent(agent.id)
  }

  private async resolveAgentResult(agent: BackgroundAgentRecord): Promise<string> {
    if (agent.status === 'error') {
      return `Error: ${agent.error || 'Background agent failed.'}`
    }
    if (agent.status === 'cancelled') {
      return 'Background agent was cancelled before completion.'
    }
    if (agent.status === 'timeout') {
      return `[TIMEOUT REACHED] Agent "${agent.title || agent.id}" did not complete within the time limit.`
    }
    return agent.result || 'Agent completed but produced no output.'
  }

  // ==========================================
  // METADATA GENERATION
  // ==========================================

  private generateMetadata(resultContent: string): { title: string; description: string } {
    const firstLine = resultContent.split('\n').find((l) => l.trim().length > 0) || 'Agent result'
    const title = firstLine.slice(0, 30).trim() + (firstLine.length > 30 ? '...' : '')
    const description = resultContent.slice(0, 150).trim() + (resultContent.length > 150 ? '...' : '')
    return { title, description }
  }

  // ==========================================
  // PERSISTENCE
  // ==========================================

  private async persistOutput(agent: BackgroundAgentRecord, content: string): Promise<void> {
    try {
      const title = agent.title || agent.id
      const description = agent.description || '(No description generated)'

      const header = `# ${title}

${description}

**ID:** ${agent.id}
**Agent:** ${agent.agent}
**Status:** ${agent.status}
**Session:** ${agent.sessionID}
**Started:** ${(agent.startedAt || agent.createdAt).toISOString()}
**Completed:** ${agent.completedAt?.toISOString() || 'N/A'}

---

`
      await fs.writeFile(agent.artifact.filePath, header + content, 'utf8')

      const stats = await fs.stat(agent.artifact.filePath)
      this.updateAgent(agent.id, (record) => {
        record.artifact.persistedAt = new Date()
        record.artifact.byteLength = stats.size
        record.artifact.persistError = undefined
      })

      this.log.debug(`Persisted agent output to ${agent.artifact.filePath} (${stats.size} bytes)`)
    } catch (error) {
      this.updateAgent(agent.id, (record) => {
        record.artifact.persistError = error instanceof Error ? error.message : 'Unknown error'
      })
      this.log.error(`Failed to persist agent output: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }

  private async readPersistedArtifact(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf8')
    } catch {
      return null
    }
  }

  private async waitForPersistedArtifact(
    filePath: string,
    maxWaitMs: number,
  ): Promise<string | null> {
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      const content = await this.readPersistedArtifact(filePath)
      if (content !== null) return content
      await new Promise((resolve) => setTimeout(resolve, this.readPollIntervalMs))
    }
    return null
  }

  private async readPersistedArtifactById(agentId: string): Promise<string> {
    const dirs = await this.findAllArtifactDirs()
    for (const dir of dirs) {
      const filePath = path.join(dir, `${agentId}.md`)
      const content = await this.readPersistedArtifact(filePath)
      if (content) return content
    }
    return `Background agent "${agentId}" not found in memory or on disk.`
  }

  private async findAllArtifactDirs(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true })
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => path.join(this.baseDir, e.name))
    } catch {
      return []
    }
  }

  // ==========================================
  // NOTIFICATION
  // ==========================================

  private async notifyParent(agentId: string): Promise<void> {
    try {
      const agent = this.agents.get(agentId)
      if (!agent) return
      if (!isTerminalStatus(agent.status)) return
      if (agent.notification.terminalNotifiedAt) {
        this.log.debug(`notifyParent skipped for ${agent.id}; already notified`)
        return
      }

      const remainingCount = this.getPendingCount(agent.parentSessionID)
      const terminalNotification = this.buildTerminalNotification(agent, remainingCount)

      this.log.info(`notifyParent sent for ${agent.id} (remaining=${remainingCount}, status=${agent.status})`)
      this.log.info(terminalNotification)

      this.markNotified(agent.id)
      this.scheduleAllCompleteForParent(agent.parentSessionID, agent.parentAgent)
    } catch (error) {
      this.log.debug(
        `notifyParent failed for ${agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private getPendingCount(parentSessionID: string): number {
    const pending = this.pendingByParent.get(parentSessionID)
    return pending ? pending.size : 0
  }

  private buildTerminalNotification(agent: BackgroundAgentRecord, remainingCount: number): string {
    const lines = [
      '<sin-agent-notification>',
      `<agent-id>${agent.id}</agent-id>`,
      `<status>${agent.status}</status>`,
      `<summary>OpenSIN background agent ${agent.status}: ${agent.title || agent.id}</summary>`,
      agent.title ? `<title>${agent.title}</title>` : '',
      agent.description ? `<description>${agent.description}</description>` : '',
      agent.error ? `<error>${agent.error}</error>` : '',
      `<artifact>${agent.artifact.filePath}</artifact>`,
      `<retrieval>Use /agents read "${agent.id}" for full output.</retrieval>`,
      remainingCount > 0 ? `<remaining>${remainingCount}</remaining>` : '',
      '</sin-agent-notification>',
    ]
    return lines.filter((line) => line.length > 0).join('\n')
  }

  private buildDeterministicReadResponse(agent: BackgroundAgentRecord): string {
    const lines = [
      `Agent ID: ${agent.id}`,
      `Status: ${agent.status}`,
      `Agent: ${agent.agent}`,
      `Started: ${agent.startedAt?.toISOString() || agent.createdAt.toISOString()}`,
      `Completed: ${agent.completedAt?.toISOString() || 'N/A'}`,
      `Artifact: ${agent.artifact.filePath}`,
    ]
    if (agent.title) lines.push(`Title: ${agent.title}`)
    if (agent.description) lines.push(`Description: ${agent.description}`)
    if (agent.error) lines.push(`Error: ${agent.error}`)
    lines.push(`\nUse /agents read "${agent.id}" again after persistence completes.`)
    return lines.join('\n')
  }

  // ==========================================
  // WAIT FOR TERMINAL
  // ==========================================

  private async waitForTerminal(id: string, timeoutMs: number): Promise<'terminal' | 'timeout'> {
    const agent = this.agents.get(id)
    if (!agent) return 'timeout'
    if (isTerminalStatus(agent.status)) return 'terminal'

    const waiter = this.terminalWaiters.get(id)
    if (!waiter) return 'timeout'

    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race<'terminal' | 'timeout'>([
        waiter.promise.then(() => 'terminal'),
        new Promise<'timeout'>((resolve) => {
          timer = setTimeout(() => resolve('timeout'), timeoutMs)
        }),
      ])
      return result
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  private hasUnreadCompletion(agent: BackgroundAgentRecord): boolean {
    if (!isTerminalStatus(agent.status)) return false
    if (!agent.notification.terminalNotifiedAt) return false
    if (!agent.completedAt) return false
    if (!agent.retrieval.retrievedAt) return true
    return agent.retrieval.retrievedAt.getTime() < agent.completedAt.getTime()
  }

  // ==========================================
  // CLEANUP
  // ==========================================

  dispose(): void {
    for (const timer of this.timeoutTimers.values()) {
      clearTimeout(timer)
    }
    this.timeoutTimers.clear()
    for (const state of this.parentNotificationState.values()) {
      this.cancelScheduledAllComplete(state)
    }
    this.parentNotificationState.clear()
  }
}
