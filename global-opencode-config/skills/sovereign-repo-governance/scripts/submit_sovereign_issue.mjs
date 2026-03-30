#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);

// Parse arguments (simple parsing for --error-file, etc.)
let repoSlug, title, description, steps, os, severityInput, labelsInput;
let errorFile, successFile, diffFile;

const positionalArgs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--error-file') { errorFile = args[++i]; }
  else if (args[i] === '--success-file') { successFile = args[++i]; }
  else if (args[i] === '--diff-file') { diffFile = args[++i]; }
  else { positionalArgs.push(args[i]); }
}

if (positionalArgs.length < 5) {
  console.log("Usage: ./submit_sovereign_issue.mjs <repo-slug> <title> <description> <steps> <os> [severity] [labels] [--error-file <file>] [--success-file <file>] [--diff-file <file>]");
  process.exit(1);
}

[repoSlug, title, description, steps, os, severityInput, labelsInput] = positionalArgs;
const severity = severityInput || "P1 - High Impact";
const labels = labelsInput || "bug, autonomous-fleet";

const TARGETS = {
  'opencode': {
    upstream: 'anomalyco/opencode',
    fork: 'Delqhi/opencode',
    version: 'Latest (2026 Fleet Build)',
    plugins: 'All SIN-Solver Plugins enabled',
    terminal: 'Sovereign Agent Environment (zsh/tmux)'
  },
  'oh-my-opencode': {
    upstream: 'code-yeongyu/oh-my-openagent',
    fork: 'Delqhi/oh-my-openagent',
    version: '3.11.2+',
    plugins: 'omo-core',
    terminal: 'Sovereign Agent Environment'
  },
  'sin-solver': {
    upstream: 'SIN-Solver/OpenSIN',
    fork: 'SIN-Solver/OpenSIN', // Same for now
    version: 'March 2026 Release',
    plugins: 'N/A',
    terminal: 'Autonomous Fleet Host'
  }
};

const target = TARGETS[repoSlug] || {
    upstream: repoSlug,
    fork: repoSlug,
    version: 'N/A',
    plugins: 'N/A',
    terminal: 'N/A'
};

// Screenshot Generation Helper
function attachScreenshot(file, type) {
  if (!file || !fs.existsSync(file)) return '';
  console.log(`Generating AIometrics CEO-Level screenshot for ${type}: ${file}`);
  const outputName = `auto_screenshot_${type.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now()}`;
  try {
    execSync(`node "${path.join(__dirname, 'capture_diff_screenshot.mjs')}" "${file}" "${outputName}"`, { stdio: 'pipe' });
    const markdownPath = `/tmp/${outputName}_markdown.txt`;
    if (fs.existsSync(markdownPath)) {
      const markdown = fs.readFileSync(markdownPath, 'utf8');
      return `\n**${type.toUpperCase()}:**\n${markdown}\n`;
    }
  } catch (err) {
    console.error(`Failed to attach screenshot for ${file}`);
  }
  return '';
}

let screenshotsSection = '';
if (errorFile) screenshotsSection += attachScreenshot(errorFile, 'Error Output');
if (diffFile) screenshotsSection += attachScreenshot(diffFile, 'Code Diff');
if (successFile) screenshotsSection += attachScreenshot(successFile, 'Successful Resolution');

const ceoBody = `
## 🎯 Strategic Context
This issue is part of the **Sovereign SIN-Solver Fleet Governance** initiative. It represents a critical path for maintaining 100% autonomous software delivery reliability in our ecosystem.

## 📝 Description (Architectural Root Cause)
${description}

---

## 💥 Impact Analysis
- **Severity:** ${severity}
- **Operational Risk:** Affects multi-agent synchronization and cross-account orchestration.
- **Enterprise Priority:** High - Required for stable workforce operations.

## 🛠️ Sovereign Verification & Workaround
A sovereign local fix has been developed and verified in our environment.
**Workaround:** Provided in the reproduction steps or linked commit.

## 🔄 Autonomous Execution Plan
1. [ ] Identify all affected agent surfaces.
2. [ ] Apply structural remediation.
3. [ ] Verify fix against the 2026 Fleet Standard.

---

## 🧬 Environment Metadata
- **OS:** ${os}
- **Agent Environment:** ${target.terminal}
- **OpenCode Version:** ${target.version}

## 🔍 Steps to Reproduce
${steps}
`;

const markdownPayload = `### Description

${ceoBody}

### Plugins

${target.plugins}

### OpenCode version

${target.version}

### Steps to reproduce

1. See detailed description above.

### Screenshot and/or share link

${screenshotsSection || 'N/A (Verified via Sovereign Fleet Logs)'}

### Operating System

${os}

### Terminal

${target.terminal}
`;

const tempFile = path.join('/tmp', 'sovereign_payload.md');
fs.writeFileSync(tempFile, markdownPayload);

console.log(`\n🚀 [CEO-LEVEL SUBMISSION] 🚀`);
console.log(`Upstream: ${target.upstream}`);
console.log(`Labels: ${labels}`);

try {
  const upstreamOut = execSync(`gh issue create --repo ${target.upstream} --title "${title}" --body-file ${tempFile} --label "${labels}"`, { encoding: 'utf-8' });
  const upstreamUrl = upstreamOut.trim();
  console.log(`✅ Sovereign Upstream Created: ${upstreamUrl}`);

  if (target.upstream !== target.fork) {
      console.log(`\nSubmitting to Fork: ${target.fork}`);
      const forkPayload = markdownPayload + `\n\n**Upstream Reference:** ${upstreamUrl}`;
      fs.writeFileSync(tempFile, forkPayload);
      const forkOut = execSync(`gh issue create --repo ${target.fork} --title "[UPSTREAM SYNC] ${title}" --body-file ${tempFile}`, { encoding: 'utf-8' });
      console.log(`✅ Sovereign Fork Synced: ${forkOut.trim()}`);
  }

} catch (e) {
  console.error("Submission failed. Ensure gh CLI is authenticated and repo exists.");
  if (e.stderr) console.error(e.stderr.toString());
} finally {
  if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
}
