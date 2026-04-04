import type { Skill } from './types.js'

export const BUNDLED_SKILLS: Skill[] = [
  { name: 'code-review', description: 'Comprehensive code review with best practices', version: '1.0.0', category: 'development', instructions: 'Review the code for bugs, style issues, performance problems, and security vulnerabilities.', triggers: ['review', 'code review', 'audit'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'git-workflow', description: 'Git workflow assistance and best practices', version: '1.0.0', category: 'development', instructions: 'Help with git operations, branch management, and commit practices.', triggers: ['git', 'branch', 'commit', 'merge'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'test-generator', description: 'Generate comprehensive test suites', version: '1.0.0', category: 'testing', instructions: 'Create unit tests, integration tests, and edge case coverage for the given code.', triggers: ['test', 'unit test', 'coverage'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'documentation', description: 'Write and improve documentation', version: '1.0.0', category: 'writing', instructions: 'Generate clear, concise documentation including README, API docs, and inline comments.', triggers: ['docs', 'document', 'readme'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'debug-helper', description: 'Systematic debugging assistance', version: '1.0.0', category: 'development', instructions: 'Use systematic debugging approach: reproduce, isolate, hypothesize, test, fix, verify.', triggers: ['debug', 'bug', 'error', 'fix'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'refactor', description: 'Code refactoring with preservation of behavior', version: '1.0.0', category: 'development', instructions: 'Refactor code for readability, maintainability, and performance while preserving behavior.', triggers: ['refactor', 'clean up', 'improve'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'security-audit', description: 'Security vulnerability scanning and recommendations', version: '1.0.0', category: 'security', instructions: 'Scan for common vulnerabilities: injection, XSS, CSRF, auth issues, data exposure.', triggers: ['security', 'vulnerability', 'audit'], source: 'bundled', enabled: true, usageCount: 0 },
  { name: 'performance', description: 'Performance analysis and optimization', version: '1.0.0', category: 'development', instructions: 'Identify performance bottlenecks and suggest optimizations.', triggers: ['performance', 'optimize', 'slow'], source: 'bundled', enabled: true, usageCount: 0 },
]

export function getBundledSkills(): Skill[] { return BUNDLED_SKILLS.map(s => ({ ...s })) }
export function getBundledSkill(name: string): Skill | undefined { return BUNDLED_SKILLS.find(s => s.name === name) }
