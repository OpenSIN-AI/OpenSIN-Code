import { describe, it, expect } from 'vitest'
import { CLIAgent } from '../cli-agent/index'

describe('CLIAgent orchestrator integration', () => {
  it('should expose an orchestrator and route model selection during command processing', async () => {
    const agent = new CLIAgent({
      sessionId: 'session-1',
      model: 'openai/gpt-4o-mini',
      provider: 'openai',
      workspacePath: '/tmp',
      maxTokens: 4096,
      temperature: 0,
      interactive: false,
      batchMode: true,
      contextWindowSize: 8192,
      toolTimeoutMs: 5000,
      autoApproveTools: [],
      verbose: false,
    })

    expect(agent.getOrchestrator()).toBeDefined()

    await agent.processCommand({
      type: 'chat',
      input: 'Hello there',
    })

    expect(agent.getState().config.model).toBe('google/antigravity-gemini-3-flash')
    expect(agent.getState().config.provider).toBe('antigravity')
  })
})
