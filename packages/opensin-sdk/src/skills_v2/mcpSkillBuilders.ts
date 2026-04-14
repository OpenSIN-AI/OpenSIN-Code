import type { MCPSkillConfig, Skill } from './types'

export function buildMCPSkill(config: MCPSkillConfig): Skill {
  return { name: `mcp-${config.serverName}-${config.toolName}`, description: config.description || `MCP skill from ${config.serverName}: ${config.toolName}`, version: '1.0.0', category: 'mcp', instructions: `Execute MCP tool ${config.toolName} on server ${config.serverName}${config.args ? ` with args: ${JSON.stringify(config.args)}` : ''}.`, triggers: [config.toolName.toLowerCase(), config.serverName.toLowerCase()], metadata: { mcpServer: config.serverName, mcpTool: config.toolName, mcpArgs: config.args }, source: 'mcp', enabled: true, usageCount: 0 }
}

export function buildMCPSkills(configs: MCPSkillConfig[]): Skill[] { return configs.map(buildMCPSkill) }
export function isMCPSkill(skill: Skill): boolean { return skill.source === 'mcp' && skill.metadata?.mcpServer !== undefined }
export function getMCPServerSkills(skills: Skill[], serverName: string): Skill[] { return skills.filter(s => isMCPSkill(s) && s.metadata?.mcpServer === serverName) }
