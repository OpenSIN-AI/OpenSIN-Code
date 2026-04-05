import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '../core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function generateId(prefix = ''): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return prefix ? `${prefix}_${random}` : random;
}

export function loadConfig(cwd: string = process.cwd()): Config {
  const configPaths = [
    join(cwd, 'sincode.json'),
    join(cwd, '.opensin', 'config.json'),
    join(process.env.HOME || '', '.config', 'sincode', 'config.json'),
  ];

  for (const path of configPaths) {
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8');
        return JSON.parse(content) as Config;
      } catch {
        continue;
      }
    }
  }

  return {
    model: 'openai/gpt-4o',
    effort: 'medium',
    permissions: {
      mode: 'ask',
      rules: [],
    },
  };
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '\n... (truncated)';
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function maskSecrets(text: string): string {
  const patterns = [
    /(sk-[a-zA-Z0-9]{20,})/g,
    /(ghp_[a-zA-Z0-9]{36})/g,
    /(glpat-[a-zA-Z0-9_-]{20,})/g,
    /(AKIA[0-9A-Z]{16})/g,
    /(["']?[a-zA-Z0-9_]*(?:api[_-]?key|secret|token|password)["']?\s*[:=]\s*["'])([^"']{8,})/gi,
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '$1[REDACTED]');
  }
  return result;
}
