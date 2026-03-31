#!/usr/bin/env node
// mcp-verify.mjs — Validate MCP setup completeness for an A2A agent
//
// Usage:
//   node mcp-verify.mjs --agent-root /path/to/agent --slug sin-myagent [--format json]
//
// Checks:
//   1. src/mcp-server.ts exists and has registerTool calls
//   2. mcp-config.json exists with correct slug
//   3. clients/opencode-mcp.json exists with correct slug
//   4. src/cli.ts has serve-mcp command
//   5. No template name drift (template-a2a-sin-agent)
//   6. Global opencode.json registration (optional check)

import { resolve, join } from 'path';
import {
  parseArgs, requireArg, readText, readJson,
  fileExists, ok, warn, fail, info, jsonOutput,
  OPENCODE_CONFIG,
} from './_mcp-lib.mjs';

const args = parseArgs();
const agentRoot = resolve(requireArg(args, 'agent-root', 'Absolute path to agent'));
const slug = requireArg(args, 'slug', 'MCP slug e.g. sin-myagent');
const format = args.format || 'text';

const checks = [];
let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, result, message) {
  if (result === true) {
    ok(`${name}: ${message}`);
    checks.push({ name, status: 'pass', message });
    passed++;
  } else if (result === 'warn') {
    warn(`${name}: ${message}`);
    checks.push({ name, status: 'warn', message });
    warnings++;
  } else {
    fail(`${name}: ${message}`);
    checks.push({ name, status: 'fail', message });
    failed++;
  }
}

// ── 1. src/mcp-server.ts ─────────────────────────────────────
const mcpServerPath = join(agentRoot, 'src/mcp-server.ts');
const mcpServerContent = readText(mcpServerPath);
if (mcpServerContent) {
  check('mcp-server.ts', true, 'File exists');

  const hasRegisterTool = mcpServerContent.includes('registerTool') || mcpServerContent.includes('setRequestHandler');
  check('mcp-server.ts:tools', hasRegisterTool, hasRegisterTool
    ? 'Has tool registration calls'
    : 'Missing registerTool/setRequestHandler calls');

  const hasSlug = mcpServerContent.includes(slug);
  check('mcp-server.ts:slug', hasSlug, hasSlug
    ? `References correct slug "${slug}"`
    : `Does not reference slug "${slug}"`);

  const hasImport = mcpServerContent.includes('@modelcontextprotocol/sdk');
  check('mcp-server.ts:sdk', hasImport, hasImport
    ? 'Imports MCP SDK'
    : 'Missing MCP SDK import');
} else {
  check('mcp-server.ts', false, `File not found: ${mcpServerPath}`);
}

// ── 2. mcp-config.json ──────────────────────────────────────
const mcpConfigPath = join(agentRoot, 'mcp-config.json');
const mcpConfig = readJson(mcpConfigPath);
if (mcpConfig) {
  check('mcp-config.json', true, 'File exists');

  const hasSlugKey = mcpConfig.mcpServers && mcpConfig.mcpServers[slug];
  check('mcp-config.json:slug', !!hasSlugKey, hasSlugKey
    ? `Has correct key "${slug}"`
    : `Missing key "${slug}" in mcpServers`);

  if (hasSlugKey) {
    const hasServeMcp = JSON.stringify(hasSlugKey).includes('serve-mcp');
    check('mcp-config.json:serve-mcp', hasServeMcp, hasServeMcp
      ? 'Command includes serve-mcp'
      : 'Missing serve-mcp in command/args');
  }
} else {
  check('mcp-config.json', false, `File not found: ${mcpConfigPath}`);
}

// ── 3. clients/opencode-mcp.json ────────────────────────────
const clientConfigPath = join(agentRoot, 'clients/opencode-mcp.json');
const clientConfig = readJson(clientConfigPath);
if (clientConfig) {
  check('clients/opencode-mcp.json', true, 'File exists');

  const hasSlugKey = clientConfig.mcpServers && clientConfig.mcpServers[slug];
  check('clients/opencode-mcp.json:slug', !!hasSlugKey, hasSlugKey
    ? `Has correct key "${slug}"`
    : `Missing key "${slug}" in mcpServers`);
} else {
  check('clients/opencode-mcp.json', false, `File not found: ${clientConfigPath}`);
}

// ── 4. src/cli.ts serve-mcp ─────────────────────────────────
const cliPath = join(agentRoot, 'src/cli.ts');
const cliContent = readText(cliPath);
if (cliContent) {
  check('cli.ts', true, 'File exists');

  const hasServeMcp = cliContent.includes('serve-mcp');
  check('cli.ts:serve-mcp', hasServeMcp, hasServeMcp
    ? 'Has serve-mcp command'
    : 'Missing serve-mcp command — MCP will not work');
} else {
  check('cli.ts', false, `File not found: ${cliPath}`);
}

// ── 5. Template name drift ──────────────────────────────────
const driftTargets = [mcpServerContent, JSON.stringify(mcpConfig), JSON.stringify(clientConfig)].filter(Boolean);
const hasDrift = driftTargets.some(c => c.includes('template-a2a-sin-agent') || c.includes('template_a2a_sin_agent'));
check('template-drift', !hasDrift, hasDrift
  ? 'DRIFT DETECTED: Found "template-a2a-sin-agent" references — must be replaced'
  : 'No template name drift detected');

// ── 6. Global opencode.json registration ────────────────────
const globalConfig = readJson(OPENCODE_CONFIG);
if (globalConfig && globalConfig.mcp && globalConfig.mcp[slug]) {
  check('opencode.json', true, `Registered globally as "${slug}"`);
  const isEnabled = globalConfig.mcp[slug].enabled !== false;
  check('opencode.json:enabled', isEnabled ? true : 'warn', isEnabled
    ? 'MCP is enabled'
    : 'MCP is registered but disabled');
} else {
  check('opencode.json', 'warn', `Not registered globally — run mcp-register-global.mjs to register`);
}

// ── 7. dist/ build check ────────────────────────────────────
const distMcpPath = join(agentRoot, 'dist/src/mcp-server.js');
if (fileExists(distMcpPath)) {
  check('build', true, 'dist/src/mcp-server.js exists (built)');
} else {
  check('build', 'warn', 'dist/src/mcp-server.js not found — run npm run build');
}

// ── Summary ──────────────────────────────────────────────────
console.log('');
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`MCP Verify: ${slug}`);
console.log(`  ✅ ${passed} passed  ⚠️  ${warnings} warnings  ❌ ${failed} failed`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

if (format === 'json') {
  jsonOutput({
    success: failed === 0,
    slug,
    summary: { passed, warnings, failed },
    checks,
  });
}

process.exit(failed > 0 ? 1 : 0);
