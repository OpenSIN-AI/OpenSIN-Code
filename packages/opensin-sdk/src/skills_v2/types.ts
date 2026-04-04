export interface Skill { name: string; description: string; version: string; category: string; instructions: string; triggers: string[]; metadata?: Record<string, unknown>; source: 'bundled' | 'user' | 'mcp' | 'remote'; enabled: boolean; usageCount: number; lastUsed?: number; rating?: number }
export interface MCPSkillConfig { serverName: string; toolName: string; description?: string; args?: Record<string, unknown> }
export interface SkillMatch { skill: Skill; confidence: number; matchedTrigger: string }
export interface SkillImprovement { skillName: string; suggestion: string; timestamp: number; applied: boolean }
export interface SkillDirectory { path: string; skills: Skill[]; lastScanned: number }
