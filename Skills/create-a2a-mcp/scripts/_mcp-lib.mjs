#!/usr/bin/env node
// _mcp-lib.mjs — Shared helpers for create-a2a-mcp skill scripts
// Usage: import { parseArgs, slugToNamespace, readJson, writeJson, ... } from './_mcp-lib.mjs';

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

// ── Arg Parsing ──────────────────────────────────────────────
export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

export function requireArg(args, name, msg) {
  if (!args[name]) {
    console.error(`❌ Missing required arg: --${name}${msg ? ` (${msg})` : ''}`);
    process.exit(1);
  }
  return args[name];
}

// ── Slug / Namespace ─────────────────────────────────────────
export function slugToNamespace(slug) {
  return slug.replace(/-/g, '_');
}

export function slugToClassName(slug) {
  return slug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function slugToMcpKey(slug) {
  // opencode.json uses the slug directly as the key
  return slug;
}

// ── File I/O ─────────────────────────────────────────────────
export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJson(filePath, data) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

export function writeText(filePath, content) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf8');
}

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function fileExists(p) {
  return existsSync(p);
}

// ── Zod Type Mapping ─────────────────────────────────────────
const TYPE_MAP = {
  'string':   { zod: 'z.string()',                   jsonType: 'string' },
  'string?':  { zod: 'z.string().optional()',         jsonType: 'string' },
  'number':   { zod: 'z.number()',                    jsonType: 'number' },
  'number?':  { zod: 'z.number().optional()',         jsonType: 'number' },
  'boolean':  { zod: 'z.boolean()',                   jsonType: 'boolean' },
  'boolean?': { zod: 'z.boolean().optional()',        jsonType: 'boolean' },
  'integer':  { zod: 'z.number().int()',              jsonType: 'integer' },
  'integer?': { zod: 'z.number().int().optional()',   jsonType: 'integer' },
  'array':    { zod: 'z.array(z.string())',           jsonType: 'array' },
  'array?':   { zod: 'z.array(z.string()).optional()', jsonType: 'array' },
};

export function mapTypeToZod(typeStr) {
  return TYPE_MAP[typeStr]?.zod || 'z.string().optional()';
}

export function mapTypeToJsonSchema(typeStr) {
  const isOptional = typeStr.endsWith('?');
  const base = typeStr.replace('?', '');
  const jsonType = TYPE_MAP[typeStr]?.jsonType || TYPE_MAP[base]?.jsonType || 'string';
  return { type: jsonType, required: !isOptional };
}

// ── Tool Definitions ─────────────────────────────────────────
export function getDefaultTools(namespace) {
  return [
    {
      name: `${namespace}_help`,
      description: 'Describe available agent actions.',
      params: {},
      action: 'agent.help',
    },
    {
      name: `${namespace}_health`,
      description: 'Check base agent readiness.',
      params: {},
      action: `${namespace.replace(/_/g, '.')}.health`,
    },
    {
      name: `${namespace}_onboarding_status`,
      description: 'Read onboarding state.',
      params: {},
      action: `${namespace.replace(/_/g, '.')}.onboarding.status`,
    },
    {
      name: `${namespace}_onboarding_save`,
      description: 'Persist onboarding state. Requires confirm=true.',
      params: {},
      action: `${namespace.replace(/_/g, '.')}.onboarding.save`,
    },
  ];
}

// ── Output Helpers ───────────────────────────────────────────
export function ok(msg) { console.log(`✅ ${msg}`); }
export function warn(msg) { console.log(`⚠️  ${msg}`); }
export function fail(msg) { console.log(`❌ ${msg}`); }
export function info(msg) { console.log(`ℹ️  ${msg}`); }

export function jsonOutput(data) {
  console.log(JSON.stringify(data, null, 2));
}

// ── Paths ────────────────────────────────────────────────────
export const OPENCODE_CONFIG = resolve(
  process.env.HOME || '/Users/jeremy',
  '.config/opencode/opencode.json'
);
export const SIN_SOLVER_BIN = resolve(
  process.env.HOME || '/Users/jeremy',
  'dev/SIN-Solver/bin'
);
export const TEMPLATE_ROOT = resolve(
  process.env.HOME || '/Users/jeremy',
  'dev/SIN-Solver/a2a/template-repo/A2A-SIN-Agent-Template'
);
