import fs from 'fs';
import yaml from 'yaml';
import { SkillMetadata, SkillDefinition } from './types';

export function parseSkillFile(filePath: string, content: string, source: 'project' | 'global' | 'bundled'): SkillDefinition | null {
  try {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return null;
    }

    const frontmatter = match[1];
    const instructions = match[2].trim();
    
    const metadata = yaml.parse(frontmatter) as SkillMetadata;
    if (!metadata.name || !metadata.description) {
      return null;
    }

    return {
      id: metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      metadata,
      instructions,
      source,
      filePath,
    };
  } catch (error) {
    return null;
  }
}

export function loadSkillFile(filePath: string, source: 'project' | 'global' | 'bundled'): SkillDefinition | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseSkillFile(filePath, content, source);
}
