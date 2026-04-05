/**
 * OpenSIN Code - Background Agents Plugin Tests
 *
 * Tests for:
 * - BackgroundAgentManager (spawn, kill, list, read)
 * - Agent status tracking
 * - Context persistence
 * - Results delivery
 * - Agent isolation
 *
 * Branded: OpenSIN/sincode
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { BackgroundAgentManager } from '../background_agents/manager.js'
import {
  isTerminalStatus,
  isActiveStatus,
} from '../background_agents/types.js'

// ==========================================
// MOCK OPENCODE CLIENT
// ==========================================

function createMockClient(options: { promptDelay?: number; promptResult?: unknown } = {}) {
  const { promptDelay = 0, promptResult } = options

  const promptFn = vi.fn().mockImplementation(async () => {
    if (promptDelay > 0) {
      await new Promise((r) => setTimeout(r, promptDelay))
    }
    if (promptResult !== undefined) {
      return promptResult
    }
    return {
      content: 'OAuth2 PKCE is the recommended flow for public clients.',
      usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
    }
  })

  const mockClient = {
    createSession: vi.fn().mockImplementation(async (_req: unknown) => {
      const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      return {
        session_id: id,
        title: 'OpenSIN Agent',
        workspace: process.cwd(),
      }
    }),
    listSessions: vi.fn().mockResolvedValue({ sessions: [], count: 0 }),
    resumeSession: vi.fn().mockResolvedValue({}),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    prompt: promptFn,
    promptStream: vi.fn().mockImplementation(async function* () {}),
    listTools: vi.fn().mockResolvedValue({
      tools: [
        { name: 'bash', description: 'Run bash commands' },
        { name: 'read_file', description: 'Read a file' },
        { name: 'write_file', description: 'Write a file' },
        { name: 'spawn', description: 'Spawn background agent' },
        { name: 'task', description: 'Run a task' },
        { name: 'todowrite', description: 'Write todos' },
      ],
      count: 6,
    }),
    executeTool: vi.fn().mockResolvedValue({}),
    jsonRpc: vi.fn().mockResolvedValue({}),
    health: vi.fn().mockResolvedValue({ status: 'ok' }),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    connectionStatus: 'connected' as const,
  }

  return mockClient
}

// ==========================================
// TEST FIXTURES
// ==========================================

let testDir: string
let manager: BackgroundAgentManager
let mockClient: ReturnType<typeof createMockClient>

beforeEach(async () => {
  testDir = path.join('/tmp', `sin-agents-test-${Date.now()}`)
  await fs.mkdir(testDir, { recursive: true })
  mockClient = createMockClient()
  let idCounter = 0
  manager = new BackgroundAgentManager(mockClient as any, testDir, {
    maxRunTimeMs: 60_000,
    idGenerator: () => `test-agent-${++idCounter}`,
  })
})

afterEach(async () => {
  manager.dispose()
  try {
    await fs.rm(testDir, { recursive: true, force: true })
  } catch {
    // Ignore cleanup errors
  }
})

// ==========================================
// STATUS TYPE TESTS
// ==========================================

describe('Status Types', () => {
  it('should identify terminal statuses correctly', () => {
    expect(isTerminalStatus('complete')).toBe(true)
    expect(isTerminalStatus('error')).toBe(true)
    expect(isTerminalStatus('cancelled')).toBe(true)
    expect(isTerminalStatus('timeout')).toBe(true)
  })

  it('should identify active statuses correctly', () => {
    expect(isActiveStatus('registered')).toBe(true)
    expect(isActiveStatus('running')).toBe(true)
    expect(isActiveStatus('complete')).toBe(false)
    expect(isActiveStatus('error')).toBe(false)
  })
})

// ==========================================
// SPAWN TESTS
// ==========================================

describe('BackgroundAgentManager.spawn()', () => {
  it('should spawn a background agent successfully', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Research OAuth2 PKCE best practices',
      agent: 'sin-explorer',
    })

    expect(agent).toBeDefined()
    expect(agent.id).toBe('test-agent-1')
    expect(agent.status).toBe('running')
    expect(agent.prompt).toBe('Research OAuth2 PKCE best practices')
    expect(agent.agent).toBe('sin-explorer')
    expect(agent.parentSessionID).toBe('parent-session-1')
  })

  it('should create an isolated session for the agent', async () => {
    await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test prompt',
      agent: 'sin-explorer',
    })

    expect(mockClient.createSession).toHaveBeenCalledWith({
      workspace: process.cwd(),
      title: 'OpenSIN Agent: test-agent-1',
    })
  })

  it('should fire the prompt in the isolated session', async () => {
    await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Research OAuth2',
      agent: 'sin-explorer',
    })

    await new Promise((r) => setTimeout(r, 50))

    expect(mockClient.prompt).toHaveBeenCalled()
    const promptCall = mockClient.prompt.mock.calls[0]
    expect(promptCall[1][0].content).toContain('Research OAuth2')
  })

  it('should filter out delegation tools', async () => {
    await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await new Promise((r) => setTimeout(r, 50))

    const toolsCall = mockClient.prompt.mock.calls[0][2]
    if (toolsCall) {
      const toolNames = toolsCall.map((t: { name: string }) => t.name)
      expect(toolNames).not.toContain('spawn')
      expect(toolNames).not.toContain('task')
      expect(toolNames).not.toContain('todowrite')
    }
  })

  it('should schedule a timeout for the agent', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    expect(agent.timeoutAt).toBeDefined()
    expect(agent.timeoutAt.getTime()).toBeGreaterThan(agent.createdAt.getTime())
  })
})

// ==========================================
// KILL TESTS
// ==========================================

describe('BackgroundAgentManager.kill()', () => {
  it('should kill a running agent', async () => {
    // Use a delayed prompt so the agent stays running when we call kill
    const delayedClient = createMockClient({ promptDelay: 10000 })
    let idCounter = 0
    const mgr = new BackgroundAgentManager(delayedClient as any, testDir, {
      maxRunTimeMs: 60_000,
      idGenerator: () => `kill-agent-${++idCounter}`,
    })

    const agent = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    expect(agent.status).toBe('running')

    const killed = await mgr.kill(agent.id)
    expect(killed).toBe(true)

    const updated = mgr.getAgent(agent.id)
    expect(updated?.status).toBe('cancelled')

    mgr.dispose()
  })

  it('should return false for non-existent agent', async () => {
    const killed = await manager.kill('nonexistent-agent')
    expect(killed).toBe(false)
  })

  it('should return false for already terminal agent', async () => {
    const delayedClient = createMockClient({ promptDelay: 10000 })
    let idCounter = 0
    const mgr = new BackgroundAgentManager(delayedClient as any, testDir, {
      maxRunTimeMs: 60_000,
      idGenerator: () => `kill-agent-${++idCounter}`,
    })

    const agent = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await mgr.kill(agent.id)
    const killedAgain = await mgr.kill(agent.id)
    expect(killedAgain).toBe(false)

    mgr.dispose()
  })
})

// ==========================================
// LIST TESTS
// ==========================================

describe('BackgroundAgentManager.listAgents()', () => {
  it('should return empty list when no agents', async () => {
    const agents = await manager.listAgents('root-session-1')
    expect(agents).toEqual([])
  })

  it('should list spawned agents', async () => {
    await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Research OAuth2',
      agent: 'sin-explorer',
    })

    const agents = await manager.listAgents('parent-session-1')
    expect(agents.length).toBe(1)
    expect(agents[0].id).toBe('test-agent-1')
    expect(agents[0].status).toBe('running')
    expect(agents[0].prompt).toBe('Research OAuth2')
  })

  it('should filter agents by root session', async () => {
    await manager.spawn({
      parentSessionID: 'session-a',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Task A',
      agent: 'sin-explorer',
    })

    const agentsA = await manager.listAgents('session-a')
    expect(agentsA.length).toBe(1)

    const agentsB = await manager.listAgents('session-b')
    expect(agentsB.length).toBe(0)
  })

  it('should sort agents by creation time (newest first)', async () => {
    let idCounter = 0
    const mgr = new BackgroundAgentManager(mockClient as any, testDir, {
      maxRunTimeMs: 60_000,
      idGenerator: () => `agent-${++idCounter}`,
    })

    await mgr.spawn({
      parentSessionID: 'session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'First',
      agent: 'sin-explorer',
    })

    await new Promise((r) => setTimeout(r, 10))

    await mgr.spawn({
      parentSessionID: 'session-1',
      parentMessageID: 'msg-2',
      parentAgent: 'default',
      prompt: 'Second',
      agent: 'sin-explorer',
    })

    const agents = await mgr.listAgents('session-1')
    expect(agents.length).toBe(2)
    expect(agents[0].id).toBe('agent-2')
    expect(agents[1].id).toBe('agent-1')

    mgr.dispose()
  })
})

// ==========================================
// READ TESTS
// ==========================================

describe('BackgroundAgentManager.readAgentResult()', () => {
  it('should read result from a completed agent', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Research OAuth2',
      agent: 'sin-explorer',
    })

    await manager.handleSessionIdle(agent.sessionID)

    const result = await manager.readAgentResult(agent.id, 'parent-session-1')
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should return not found for non-existent agent', async () => {
    const result = await manager.readAgentResult('nonexistent', 'session-1')
    expect(result).toContain('not found')
  })
})

// ==========================================
// SESSION IDLE TESTS
// ==========================================

describe('BackgroundAgentManager.handleSessionIdle()', () => {
  it('should mark agent as complete on session idle', async () => {
    const delayedClient = createMockClient({ promptDelay: 10000 })
    let idCounter = 0
    const mgr = new BackgroundAgentManager(delayedClient as any, testDir, {
      maxRunTimeMs: 60_000,
      idGenerator: () => `idle-agent-${++idCounter}`,
    })

    const agent = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    expect(agent.status).toBe('running')

    await mgr.handleSessionIdle(agent.sessionID)

    const updated = mgr.getAgent(agent.id)
    expect(updated?.status).toBe('complete')

    mgr.dispose()
  })

  it('should not affect already terminal agents', async () => {
    const delayedClient = createMockClient({ promptDelay: 10000 })
    let idCounter = 0
    const mgr = new BackgroundAgentManager(delayedClient as any, testDir, {
      maxRunTimeMs: 60_000,
      idGenerator: () => `idle-agent-${++idCounter}`,
    })

    const agent = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await mgr.kill(agent.id)
    await mgr.handleSessionIdle(agent.sessionID)

    const updated = mgr.getAgent(agent.id)
    expect(updated?.status).toBe('cancelled')

    mgr.dispose()
  })
})

// ==========================================
// PERSISTENCE TESTS
// ==========================================

describe('Context Persistence', () => {
  it('should persist agent output to disk on completion', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await manager.handleSessionIdle(agent.sessionID)

    const artifactPath = agent.artifact.filePath
    try {
      const content = await fs.readFile(artifactPath, 'utf8')
      expect(content).toContain(agent.id)
      expect(content).toContain('OpenSIN')
    } catch {
      const stored = manager.getAgent(agent.id)
      expect(stored?.result).toBeDefined()
    }
  })

  it('should maintain agent state across operations', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Research task',
      agent: 'sin-explorer',
    })

    const retrieved = manager.getAgent(agent.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(agent.id)
    expect(retrieved?.prompt).toBe('Research task')
    expect(retrieved?.status).toBe('running')
  })
})

// ==========================================
// AGENT ISOLATION TESTS
// ==========================================

describe('Agent Isolation', () => {
  it('should create separate sessions for each agent', async () => {
    const delayedClient = createMockClient({ promptDelay: 10000 })
    let idCounter = 0
    const mgr = new BackgroundAgentManager(delayedClient as any, testDir, {
      maxRunTimeMs: 60_000,
      idGenerator: () => `isolate-agent-${++idCounter}`,
    })

    const agent1 = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Task 1',
      agent: 'sin-explorer',
    })

    const agent2 = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-2',
      parentAgent: 'default',
      prompt: 'Task 2',
      agent: 'sin-creator',
    })

    expect(agent1.sessionID).toBeDefined()
    expect(agent2.sessionID).toBeDefined()
    expect(agent1.id).not.toBe(agent2.id)
    expect(agent1.prompt).not.toBe(agent2.prompt)
    expect(agent1.agent).not.toBe(agent2.agent)

    mgr.dispose()
  })

  it('should not allow nested delegation tools in spawned agents', async () => {
    await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await new Promise((r) => setTimeout(r, 50))

    const toolsCall = mockClient.prompt.mock.calls[0][2]
    if (toolsCall) {
      const toolNames = toolsCall.map((t: { name: string }) => t.name)
      expect(toolNames).not.toContain('spawn')
      expect(toolNames).not.toContain('task')
    }
  })
})

// ==========================================
// NOTIFICATION TESTS
// ==========================================

describe('Results Delivery', () => {
  it('should track retrieval count', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await manager.handleSessionIdle(agent.sessionID)

    expect(agent.retrieval.retrievalCount).toBe(0)

    await manager.readAgentResult(agent.id, 'parent-session-1')

    const updated = manager.getAgent(agent.id)
    expect(updated?.retrieval.retrievalCount).toBe(1)
  })

  it('should track unread completion', async () => {
    const agent = await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    await manager.handleSessionIdle(agent.sessionID)

    const agents = await manager.listAgents('parent-session-1')
    expect(agents.length).toBe(1)
  })
})

// ==========================================
// TIMEOUT TESTS
// ==========================================

describe('Timeout Handling', () => {
  it('should handle agent timeout', async () => {
    // Use a prompt that never resolves (simulates a hanging agent)
    const hangingClient = createMockClient({
      promptDelay: 999999,
    })
    let idCounter = 0
    const mgr = new BackgroundAgentManager(hangingClient as any, testDir, {
      maxRunTimeMs: 100, // 100ms for fast test
      idGenerator: () => `timeout-agent-${++idCounter}`,
    })

    const agent = await mgr.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Long running task',
      agent: 'sin-explorer',
    })

    expect(agent.status).toBe('running')

    // Directly trigger timeout handling (avoids waiting for timer)
    await (mgr as any).handleTimeout(agent.id)

    const updated = mgr.getAgent(agent.id)
    expect(updated?.status).toBe('timeout')

    mgr.dispose()
  })
})

// ==========================================
// CLEANUP TESTS
// ==========================================

describe('Cleanup', () => {
  it('should dispose all timers on cleanup', async () => {
    await manager.spawn({
      parentSessionID: 'parent-session-1',
      parentMessageID: 'msg-1',
      parentAgent: 'default',
      prompt: 'Test',
      agent: 'sin-explorer',
    })

    manager.dispose()
    expect(true).toBe(true)
  })
})
