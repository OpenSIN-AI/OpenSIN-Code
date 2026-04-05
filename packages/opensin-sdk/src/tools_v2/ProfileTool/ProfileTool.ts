/**
 * OpenSIN Profile Tool — Manage agent profiles
 *
 * CLI tool for listing, switching, creating, and deleting agent profiles.
 * Modeled after Kilo Code's agent/mode switching.
 *
 * Branded: OpenSIN/sincode
 */

import type { ToolDefinition, ToolResult } from '../../types.js';
import { createProfileManager, ProfileManager } from '../../agent_profiles/manager.js';
import type { AgentProfile } from '../../agent_profiles/types.js';

let globalProfileManager: ProfileManager | null = null;

function getProfileManager(): ProfileManager {
  if (!globalProfileManager) {
    globalProfileManager = createProfileManager(process.cwd());
  }
  return globalProfileManager;
}

export function resetProfileManager(): void {
  globalProfileManager = null;
}

interface ProfileInput {
  action: 'list' | 'switch' | 'create' | 'delete' | 'show' | 'current';
  name?: string;
  description?: string;
  prompt?: string;
  mode?: 'primary' | 'subagent' | 'all';
  model?: string;
  temperature?: number;
  color?: string;
  permission?: Record<string, unknown>;
}

export const ProfileTool: ToolDefinition = {
  name: 'profile',
  description: 'Manage agent profiles. Actions: list (show all profiles), switch (activate a profile), create (make new profile), delete (remove custom profile), show (view profile details), current (show active profile).',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'switch', 'create', 'delete', 'show', 'current'],
        description: 'Action to perform',
      },
      name: {
        type: 'string',
        description: 'Profile name (required for switch, create, delete, show)',
      },
      description: {
        type: 'string',
        description: 'Profile description (for create)',
      },
      prompt: {
        type: 'string',
        description: 'Profile system prompt (for create)',
      },
      mode: {
        type: 'string',
        enum: ['primary', 'subagent', 'all'],
        description: 'Profile mode (for create)',
      },
      model: {
        type: 'string',
        description: 'Model to pin (for create)',
      },
      temperature: {
        type: 'number',
        description: 'Temperature (for create)',
      },
      color: {
        type: 'string',
        description: 'UI color hex (for create)',
      },
      permission: {
        type: 'object',
        description: 'Tool permissions (for create)',
      },
    },
    required: ['action'],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const { action, name, description, prompt, mode, model, temperature, color, permission } = input as ProfileInput;
    const pm = getProfileManager();

    try {
      switch (action) {
        case 'list': {
          const profiles = pm.listProfiles();
          const active = pm.getActiveProfile();
          const lines = profiles.map(p => {
            const marker = p.name === active ? ' ◀ ACTIVE' : '';
            const sourceTag = p.source === 'builtin' ? '[built-in]' : `[${p.source}]`;
            return `${p.name} ${sourceTag} — ${p.description}${marker}`;
          });
          return {
            content: [{ type: 'text', text: `Available profiles:\n\n${lines.join('\n')}` }],
          };
        }

        case 'current': {
          const active = pm.getActiveProfile();
          const resolution = pm.resolveProfile();
          if (!resolution) {
            return { content: [{ type: 'text', text: `No active profile.` }], isError: true };
          }
          const p = resolution.profile;
          const info = [
            `Active profile: ${p.name}`,
            `Description: ${p.description}`,
            `Mode: ${p.mode}`,
            `Source: ${p.source}`,
            p.model ? `Model: ${p.model}` : null,
            p.color ? `Color: ${p.color}` : null,
          ].filter(Boolean).join('\n');
          return { content: [{ type: 'text', text: info }] };
        }

        case 'switch': {
          if (!name) {
            return { content: [{ type: 'text', text: 'Usage: profile switch <name>' }], isError: true };
          }
          const success = pm.setActiveProfile(name);
          if (!success) {
            return { content: [{ type: 'text', text: `Profile "${name}" not found. Use "profile list" to see available profiles.` }], isError: true };
          }
          const resolution = pm.resolveProfile();
          const modelName = resolution?.effectiveModel || 'default';
          return {
            content: [{ type: 'text', text: `Switched to profile: ${name}\nModel: ${modelName}\nPrompt: ${resolution?.profile.prompt?.slice(0, 200)}...` }],
          };
        }

        case 'show': {
          if (!name) {
            return { content: [{ type: 'text', text: 'Usage: profile show <name>' }], isError: true };
          }
          const profile = pm.getProfile(name);
          if (!profile) {
            return { content: [{ type: 'text', text: `Profile "${name}" not found.` }], isError: true };
          }
          const details = [
            `Name: ${profile.name}`,
            `Description: ${profile.description}`,
            `Mode: ${profile.mode}`,
            `Source: ${profile.source}`,
            profile.model ? `Model: ${profile.model}` : null,
            profile.temperature ? `Temperature: ${profile.temperature}` : null,
            profile.color ? `Color: ${profile.color}` : null,
            profile.steps ? `Max Steps: ${profile.steps}` : null,
            '',
            'Prompt:',
            profile.prompt,
            profile.permission ? `\nPermissions: ${JSON.stringify(profile.permission, null, 2)}` : null,
          ].filter(Boolean).join('\n');
          return { content: [{ type: 'text', text: details }] };
        }

        case 'create': {
          if (!name || !prompt) {
            return { content: [{ type: 'text', text: 'Usage: profile create <name> --prompt "system prompt" [--description "desc"] [--mode primary|subagent|all] [--model provider/model] [--temperature 0.7] [--color #hex]' }], isError: true };
          }
          const newProfile: Omit<AgentProfile, 'source'> = {
            name,
            description: description || '',
            prompt,
            mode: mode || 'all',
            model,
            temperature,
            color,
            permission: permission as AgentProfile['permission'],
          };
          await pm.createProfile(newProfile);
          return { content: [{ type: 'text', text: `Created profile: ${name}\nSaved to: .opensin/agents/${name}.md` }] };
        }

        case 'delete': {
          if (!name) {
            return { content: [{ type: 'text', text: 'Usage: profile delete <name>' }], isError: true };
          }
          const success = await pm.deleteProfile(name);
          if (!success) {
            return { content: [{ type: 'text', text: `Cannot delete "${name}". Built-in profiles cannot be deleted, or profile does not exist.` }], isError: true };
          }
          return { content: [{ type: 'text', text: `Deleted profile: ${name}` }] };
        }

        default:
          return { content: [{ type: 'text', text: `Unknown action: ${action}. Use: list, switch, create, delete, show, current` }], isError: true };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Profile error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true,
      };
    }
  },
};
