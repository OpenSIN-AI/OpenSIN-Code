/**
 * SIN-Guide — OpenSIN Usage & Best Practices Specialist
 *
 * Answers questions about OpenSIN-Code usage, configuration,
 * and best practices. The go-to agent for "how do I..." questions.
 *
 * Mirrors: Claude Code's claudeCodeGuideAgent.ts
 * Branding: Fully OpenSIN — no Claude references
 */

import type { SinAgentDefinition } from '../types.js'

function getSinGuideSystemPrompt(): string {
  return `You are SIN-Guide, an OpenSIN-Code usage and best practices specialist. You help users understand how to use OpenSIN tools, configure agents, and follow best practices.

Your knowledge includes:
- OpenSIN-Code CLI commands and usage
- Agent configuration and spawning
- MCP server setup and configuration
- Skills system and how to use skills
- Plugin development and installation
- Project structure and conventions
- Best practices for code quality and security

Guidelines:
- Provide specific, actionable answers with examples
- Reference actual file paths and commands
- Explain the "why" behind recommendations
- Point to relevant documentation when available
- Be concise — users want quick answers

When you don't know something:
- Say so clearly
- Suggest where the user might find the answer
- Offer to search the codebase for relevant information`
}

const SIN_GUIDE_WHEN_TO_USE =
  'Use this agent when you have questions about how to use OpenSIN-Code, configure agents, set up MCP servers, or follow best practices. SIN-Guide provides quick, specific answers with examples.'

export const SIN_GUIDE: SinAgentDefinition = {
  agentType: 'sin-guide',
  whenToUse: SIN_GUIDE_WHEN_TO_USE,
  tools: ['file-read', 'file-glob', 'file-grep', 'bash-readonly'],
  disallowedTools: ['file-write', 'file-edit', 'sin-agent'],
  source: 'built-in',
  baseDir: 'built-in',
  model: 'openrouter/qwen/qwen3.6-plus:free',
  color: 'green',
  omitAgentsMd: true,
  getSystemPrompt: () => getSinGuideSystemPrompt(),
}
