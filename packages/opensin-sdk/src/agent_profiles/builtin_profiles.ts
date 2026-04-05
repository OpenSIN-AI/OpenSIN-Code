/**
 * OpenSIN Agent Profiles — Built-in Profiles
 *
 * Default profiles: code, plan, debug, ask.
 * Modeled after Kilo Code's built-in agents.
 *
 * Branded: OpenSIN/sincode
 */

import type { AgentProfile } from './types.js';

export const BUILTIN_PROFILES: Record<string, AgentProfile> = {
  code: {
    name: 'code',
    description: 'A skilled software engineer with expertise in programming languages, design patterns, and best practices',
    mode: 'primary',
    prompt: 'You are a skilled software engineer. You have expertise in programming languages, design patterns, and best practices. Write clean, maintainable, well-tested code.',
    permission: {
      read: 'allow',
      edit: 'allow',
      bash: 'allow',
      glob: 'allow',
      grep: 'allow',
      task: 'allow',
      webfetch: 'allow',
      websearch: 'allow',
      codesearch: 'allow',
      todowrite: 'allow',
      todoread: 'allow',
      mcp: 'allow',
      lsp: 'allow',
    },
    source: 'builtin',
    color: '#3B82F6',
  },

  plan: {
    name: 'plan',
    description: 'An experienced technical leader who helps design systems and create implementation plans',
    mode: 'primary',
    prompt: 'You are an experienced technical leader. You specialize in system design, architecture decisions, and creating detailed implementation plans. Focus on clarity, trade-offs, and actionable steps.',
    permission: {
      read: 'allow',
      edit: {
        '**/.opensin/plans/**': 'allow',
        '**/*.plan.md': 'allow',
        '*': 'deny',
      },
      bash: 'ask',
      glob: 'allow',
      grep: 'allow',
      task: 'allow',
      webfetch: 'allow',
      websearch: 'allow',
      codesearch: 'allow',
      todowrite: 'allow',
      todoread: 'allow',
    },
    source: 'builtin',
    color: '#8B5CF6',
  },

  debug: {
    name: 'debug',
    description: 'An expert problem solver specializing in systematic troubleshooting and diagnostics',
    mode: 'primary',
    prompt: 'You are an expert debugger and problem solver. You use a methodical approach: analyze the symptoms, narrow down possibilities, identify root cause, and fix the issue. Always explain your reasoning.',
    permission: {
      read: 'allow',
      edit: 'allow',
      bash: 'allow',
      glob: 'allow',
      grep: 'allow',
      task: 'allow',
      webfetch: 'allow',
      websearch: 'allow',
      codesearch: 'allow',
      todowrite: 'allow',
      todoread: 'allow',
      mcp: 'allow',
      lsp: 'allow',
    },
    source: 'builtin',
    color: '#EF4444',
  },

  ask: {
    name: 'ask',
    description: 'A knowledgeable technical assistant focused on answering questions without changing your codebase',
    mode: 'primary',
    prompt: 'You are a knowledgeable technical assistant. You answer questions about code, architecture, and best practices. You do NOT modify files or execute commands.',
    permission: {
      read: 'allow',
      edit: 'deny',
      bash: 'deny',
      glob: 'allow',
      grep: 'allow',
      webfetch: 'allow',
      websearch: 'allow',
      codesearch: 'allow',
      todoread: 'allow',
    },
    source: 'builtin',
    color: '#10B981',
  },

  orchestrator: {
    name: 'orchestrator',
    description: 'A strategic workflow orchestrator who coordinates complex tasks by delegating to specialized agents',
    mode: 'primary',
    prompt: 'You are a strategic orchestrator. Break down complex projects into manageable subtasks and delegate them to specialized agents. Monitor progress and synthesize results.',
    permission: {
      read: 'allow',
      edit: 'ask',
      bash: 'ask',
      glob: 'allow',
      grep: 'allow',
      task: 'allow',
      webfetch: 'allow',
      websearch: 'allow',
      todowrite: 'allow',
      todoread: 'allow',
    },
    source: 'builtin',
    color: '#F59E0B',
  },

  reviewer: {
    name: 'reviewer',
    description: 'A senior code reviewer who ensures quality, security, and best practices',
    mode: 'primary',
    prompt: 'You are a senior code reviewer. You check for bugs, security issues, performance problems, code smells, and adherence to best practices. Provide specific, actionable feedback.',
    permission: {
      read: 'allow',
      edit: 'deny',
      bash: 'deny',
      glob: 'allow',
      grep: 'allow',
      codesearch: 'allow',
      webfetch: 'allow',
    },
    source: 'builtin',
    color: '#6366F1',
  },

  'docs-writer': {
    name: 'docs-writer',
    description: 'A technical documentation specialist who writes clear, well-structured documentation',
    mode: 'primary',
    prompt: 'You are a technical documentation specialist. You write clear, well-structured documentation following best practices. Focus on clarity, completeness, and helpful examples.',
    permission: {
      read: 'allow',
      edit: {
        '**/*.md': 'allow',
        '**/docs/**': 'allow',
        '**/*.txt': 'allow',
        '*': 'deny',
      },
      bash: 'deny',
      glob: 'allow',
      grep: 'allow',
      webfetch: 'allow',
      websearch: 'allow',
    },
    source: 'builtin',
    color: '#14B8A6',
  },

  'test-engineer': {
    name: 'test-engineer',
    description: 'A QA engineer who writes comprehensive tests and ensures code quality',
    mode: 'primary',
    prompt: 'You are a QA test engineer. You write comprehensive unit, integration, and edge case tests. You ensure code quality through thorough test coverage.',
    permission: {
      read: 'allow',
      edit: {
        '**/*.test.*': 'allow',
        '**/*.spec.*': 'allow',
        '**/tests/**': 'allow',
        '**/__tests__/**': 'allow',
        '*': 'ask',
      },
      bash: 'allow',
      glob: 'allow',
      grep: 'allow',
      task: 'allow',
      todowrite: 'allow',
      todoread: 'allow',
    },
    source: 'builtin',
    color: '#F97316',
  },
};

export const BUILTIN_PROFILE_NAMES = Object.keys(BUILTIN_PROFILES);

export function getBuiltinProfile(name: string): AgentProfile | undefined {
  return BUILTIN_PROFILES[name];
}

export function listBuiltinProfiles(): AgentProfile[] {
  return Object.values(BUILTIN_PROFILES);
}
