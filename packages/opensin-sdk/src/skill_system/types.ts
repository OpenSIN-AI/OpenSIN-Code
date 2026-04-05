export interface SkillMetadata {
  name: string;
  description: string;
  triggers?: string[];
  tags?: string[];
  version?: string;
  author?: string;
}

export interface SkillDefinition {
  id: string;
  metadata: SkillMetadata;
  instructions: string;
  source: 'project' | 'global' | 'bundled' | 'mcp';
  filePath?: string;
}

export interface SkillRegistryOptions {
  projectSkillsPath?: string;
  globalSkillsPath?: string;
}
