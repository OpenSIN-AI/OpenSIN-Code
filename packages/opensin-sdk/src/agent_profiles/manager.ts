/**
 * OpenSIN Agent Profiles — Profile Manager
 *
 * Loads, merges, and resolves agent profiles from multiple sources
 * with proper precedence: builtin < global < project < config < env.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import type {
  AgentProfile,
  ProfileConfig,
  ProfileResolution,
  ResolvedPermissions,
  PermissionAction,
  PermissionRule,
} from './types.js';
import { BUILTIN_PROFILES } from './builtin_profiles.js';

export class ProfileManager {
  private projectDir: string;
  private profiles: Map<string, AgentProfile> = new Map();
  private activeProfile: string = 'code';

  constructor(projectDir?: string) {
    this.projectDir = projectDir || process.cwd();
  }

  async init(): Promise<void> {
    this.profiles.clear();

    for (const [name, profile] of Object.entries(BUILTIN_PROFILES)) {
      this.profiles.set(name, { ...profile });
    }

    await this.loadGlobalProfiles();
    await this.loadProjectProfiles();
    await this.loadConfigProfiles();
    await this.loadAgentMarkdownFiles();
  }

  private async loadGlobalProfiles(): Promise<void> {
    const globalConfigPath = path.join(os.homedir(), '.opensin', 'profiles.json');
    await this.loadConfigFile(globalConfigPath, 'global');
  }

  private async loadProjectProfiles(): Promise<void> {
    const projectConfigPath = path.join(this.projectDir, '.opensin', 'profiles.json');
    await this.loadConfigFile(projectConfigPath, 'project');
  }

  private async loadConfigProfiles(): Promise<void> {
    const opensinConfigPath = path.join(this.projectDir, 'opensin.json');
    try {
      const raw = await fs.readFile(opensinConfigPath, 'utf-8');
      const config = JSON.parse(raw) as ProfileConfig;
      if (config.agent) {
        for (const [name, overrides] of Object.entries(config.agent)) {
          this.mergeProfile(name, overrides, 'config');
        }
      }
    } catch {
      // No opensin.json
    }
  }

  private async loadAgentMarkdownFiles(): Promise<void> {
    const agentDirs = [
      path.join(this.projectDir, '.opensin', 'agents'),
      path.join(this.projectDir, '.opensin', 'agent'),
      path.join(os.homedir(), '.opensin', 'agents'),
      path.join(os.homedir(), '.opensin', 'agent'),
    ];

    for (const dir of agentDirs) {
      await this.loadAgentDir(dir);
    }
  }

  private async loadAgentDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

        const fullPath = path.join(dir, entry.name);
        const raw = await fs.readFile(fullPath, 'utf-8');
        const profile = this.parseAgentMarkdown(raw, entry.name.replace(/\.md$/, ''));

        if (profile && !profile.disabled) {
          this.profiles.set(profile.name, { ...profile, source: 'project' });
        }
      }
    } catch {
      // Dir doesn't exist
    }
  }

  private async loadConfigFile(filePath: string, source: 'global' | 'project'): Promise<void> {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(raw) as ProfileConfig;

      if (config.agent) {
        for (const [name, overrides] of Object.entries(config.agent)) {
          this.mergeProfile(name, overrides, source);
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  private mergeProfile(name: string, overrides: Partial<AgentProfile>, source: string): void {
    const existing = this.profiles.get(name);

    if (existing) {
      this.profiles.set(name, {
        ...existing,
        ...overrides,
        name: existing.name,
        permission: {
          ...existing.permission,
          ...overrides.permission,
        },
        source: source as AgentProfile['source'],
      });
    } else {
      this.profiles.set(name, {
        name,
        description: overrides.description || '',
        prompt: overrides.prompt || '',
        mode: overrides.mode || 'all',
        ...overrides,
        source: source as AgentProfile['source'],
      });
    }
  }

  private parseAgentMarkdown(raw: string, filename: string): AgentProfile | null {
    const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const frontmatterRaw = frontmatterMatch[1];
    const body = frontmatterMatch[2].trim();

    const fm: Record<string, unknown> = {};
    for (const line of frontmatterRaw.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();

      if (value === 'true') value = true as unknown as string;
      else if (value === 'false') value = false as unknown as string;
      else if (value === 'allow' || value === 'deny' || value === 'ask') value = value;
      else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);

      fm[key] = value;
    }

    const permission: Record<string, unknown> = {};
    if (fm.permission && typeof fm.permission === 'object') {
      Object.assign(permission, fm.permission);
    }

    return {
      name: filename,
      description: (fm.description as string) || '',
      prompt: body,
      mode: (fm.mode as AgentProfile['mode']) || 'all',
      model: fm.model as string,
      temperature: fm.temperature as number,
      top_p: fm.top_p as number,
      steps: fm.steps as number,
      color: fm.color as string,
      permission: Object.keys(permission).length > 0 ? permission as AgentProfile['permission'] : undefined,
      hidden: fm.hidden === true,
      disabled: fm.disable === true,
    };
  }

  resolveProfile(name?: string): ProfileResolution | null {
    const profileName = name || this.activeProfile;
    const profile = this.profiles.get(profileName);
    if (!profile) return null;

    return {
      profile,
      effectivePermissions: this.resolvePermissions(profile),
      effectiveModel: profile.model,
      effectiveTemperature: profile.temperature,
    };
  }

  private resolvePermissions(profile: AgentProfile): ResolvedPermissions {
    const resolved: ResolvedPermissions = {};

    if (!profile.permission) return resolved;

    for (const [tool, rule] of Object.entries(profile.permission)) {
      if (typeof rule === 'string') {
        resolved[tool] = { action: rule as PermissionAction };
      } else if (typeof rule === 'object' && rule !== null) {
        resolved[tool] = {
          action: 'ask',
          patterns: rule as Record<string, PermissionAction>,
        };
      }
    }

    return resolved;
  }

  isToolAllowed(profileName: string, tool: string, filePath?: string): boolean {
    const resolution = this.resolveProfile(profileName);
    if (!resolution) return false;

    const perm = resolution.effectivePermissions[tool];
    if (!perm) return true;

    if (perm.action === 'deny') return false;
    if (perm.action === 'allow') return true;

    if (perm.patterns && filePath) {
      for (const [pattern, action] of Object.entries(perm.patterns)) {
        if (this.matchGlob(pattern, filePath)) {
          return action !== 'deny';
        }
      }
    }

    return perm.action !== 'deny';
  }

  private matchGlob(pattern: string, filePath: string): boolean {
    const regex = pattern
      .replace(/\*\*/g, '__DOUBLESTAR__')
      .replace(/\*/g, '[^/]*')
      .replace(/__DOUBLESTAR__/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${regex}$`).test(filePath);
  }

  setActiveProfile(name: string): boolean {
    if (!this.profiles.has(name)) return false;
    this.activeProfile = name;
    return true;
  }

  getActiveProfile(): string {
    return this.activeProfile;
  }

  listProfiles(): AgentProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => !p.hidden && !p.disabled)
      .sort((a, b) => {
        if (a.source === 'builtin' && b.source !== 'builtin') return -1;
        if (a.source !== 'builtin' && b.source === 'builtin') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  getProfile(name: string): AgentProfile | undefined {
    return this.profiles.get(name);
  }

  async createProfile(profile: Omit<AgentProfile, 'source'>): Promise<void> {
    const content = this.toAgentMarkdown(profile);

    const agentDirs = [
      path.join(this.projectDir, '.opensin', 'agents'),
      path.join(this.projectDir, '.opencode', 'agents'),
      path.join(this.projectDir, '.kilo', 'agents'),
    ];

    for (const dir of agentDirs) {
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${profile.name}.md`);
      await fs.writeFile(filePath, content, 'utf-8');
    }

    this.profiles.set(profile.name, { ...profile, source: 'project' });
  }

  async deleteProfile(name: string): Promise<boolean> {
    if (BUILTIN_PROFILES[name]) return false;

    const agentDirs = [
      path.join(this.projectDir, '.opensin', 'agents'),
      path.join(this.projectDir, '.opencode', 'agents'),
      path.join(this.projectDir, '.kilo', 'agents'),
    ];

    let anyDeleted = false;
    for (const dir of agentDirs) {
      const filePath = path.join(dir, `${name}.md`);
      try {
        await fs.unlink(filePath);
        anyDeleted = true;
      } catch {
        // File doesn't exist in this dir
      }
    }

    if (anyDeleted) {
      this.profiles.delete(name);
    }
    return anyDeleted;
  }

    this.profiles.set(profile.name, { ...profile, source: 'project' });
  }

  async deleteProfile(name: string): Promise<boolean> {
    if (BUILTIN_PROFILES[name]) return false;

    const agentDirs = [
      path.join(this.projectDir, '.opensin', 'agents'),
      path.join(this.projectDir, '.opencode', 'agents'),
      path.join(this.projectDir, '.kilo', 'agents'),
    ];

    let anyDeleted = false;
    for (const dir of agentDirs) {
      const filePath = path.join(dir, `${name}.md`);
      try {
        await fs.unlink(filePath);
        anyDeleted = true;
      } catch {
        // File doesn't exist in this dir
      }
    }

    if (anyDeleted) {
      this.profiles.delete(name);
    }
    return anyDeleted;
  }

  private toAgentMarkdown(profile: Omit<AgentProfile, 'source'>): string {
    let frontmatter = '---\n';
    frontmatter += `description: ${profile.description}\n`;
    frontmatter += `mode: ${profile.mode}\n`;
    if (profile.model) frontmatter += `model: ${profile.model}\n`;
    if (profile.temperature) frontmatter += `temperature: ${profile.temperature}\n`;
    if (profile.color) frontmatter += `color: ${profile.color}\n`;
    if (profile.permission) {
      frontmatter += 'permission:\n';
      for (const [tool, rule] of Object.entries(profile.permission)) {
        if (typeof rule === 'string') {
          frontmatter += `  ${tool}: ${rule}\n`;
        } else {
          frontmatter += `  ${tool}:\n`;
          for (const [pattern, action] of Object.entries(rule)) {
            frontmatter += `    "${pattern}": ${action}\n`;
          }
        }
      }
    }
    frontmatter += '---\n\n';
    frontmatter += profile.prompt;
    return frontmatter;
  }

  getActiveProfilePrompt(): string {
    const resolution = this.resolveProfile();
    return resolution?.profile.prompt || '';
  }

  getAvailableProfileNames(): string[] {
    return this.listProfiles().map(p => p.name);
  }
}

export function createProfileManager(projectDir?: string): ProfileManager {
  return new ProfileManager(projectDir);
}
