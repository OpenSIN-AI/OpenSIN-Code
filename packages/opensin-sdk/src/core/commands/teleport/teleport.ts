import { mkdir, readFile, writeFile, stat } from 'fs/promises'
import { join } from 'path'
import type { LocalCommandResult } from '../../types/command'
import type { ToolUseContext } from '../../Tool'

// ============================================================================
// Teleport — Session teleportation between repos/directories
// ============================================================================

type TeleportStash = {
  sourceRepo: string
  sourceDir: string
  timestamp: string
  todos: string[]
  notes: string
  context: string
}

function getTeleportDir(cwd: string): string {
  return join(cwd, '.opensin', 'teleport')
}

function getStashFile(cwd: string): string {
  return join(getTeleportDir(cwd), 'stash.json')
}

async function loadStash(cwd: string): Promise<TeleportStash | null> {
  try {
    const content = await readFile(getStashFile(cwd), 'utf-8')
    return JSON.parse(content) as TeleportStash
  } catch {
    return null
  }
}

async function saveStash(cwd: string, stash: TeleportStash): Promise<void> {
  const dir = getTeleportDir(cwd)
  await mkdir(dir, { recursive: true })
  await writeFile(getStashFile(cwd), JSON.stringify(stash, null, 2), 'utf-8')
}

function getRepoName(dir: string): string {
  const parts = dir.split('/')
  return parts[parts.length - 1] || dir
}

export async function call(args: string, context: ToolUseContext): Promise<LocalCommandResult> {
  const cwd = context.cwd || process.cwd()
  const parts = args.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return {
      type: 'text',
      value:
        '🌀 Teleport — Session Teleportation\n' +
        '===================================\n\n' +
        'Usage:\n' +
        '  /teleport <target-directory>          Teleport to another directory\n' +
        '  /teleport <target-directory> --stash  Stash current context before teleporting\n' +
        '  /teleport --resume                    Resume from last stashed context\n' +
        '  /teleport --status                    Show current stash status\n\n' +
        'Current directory: ' + cwd,
    }
  }

  // --status: show stash info
  if (parts[0] === '--status') {
    const stash = await loadStash(cwd)
    if (!stash) {
      return { type: 'text', value: 'No stashed context found.' }
    }
    return {
      type: 'text',
      value:
        `🌀 Teleport Stash Status\n` +
        `========================\n\n` +
        `Source: ${stash.sourceRepo} (${stash.sourceDir})\n` +
        `Stashed: ${new Date(stash.timestamp).toLocaleString()}\n` +
        `Notes: ${stash.notes || 'none'}\n` +
        `Todos: ${stash.todos.length} items\n` +
        `Context: ${stash.context.slice(0, 200)}${stash.context.length > 200 ? '...' : ''}`,
    }
  }

  // --resume: load stashed context
  if (parts[0] === '--resume') {
    const stash = await loadStash(cwd)
    if (!stash) {
      return {
        type: 'text',
        value: 'No stashed context found. Use /teleport <dir> --stash first.',
      }
    }
    const lines = [
      '🌀 Teleport — Resumed Context',
      '=============================',
      '',
      `Resumed from: ${stash.sourceRepo}`,
      `Stashed at: ${new Date(stash.timestamp).toLocaleString()}`,
      '',
    ]
    if (stash.notes) {
      lines.push(`Notes: ${stash.notes}`, '')
    }
    if (stash.todos.length > 0) {
      lines.push('Todos:', ...stash.todos.map((t: string, i: number) => `  ${i + 1}. ${t}`), '')
    }
    lines.push(`Context: ${stash.context}`)
    return { type: 'text', value: lines.join('\n') }
  }

  // Parse target directory and flags
  let targetDir = ''
  let doStash = false
  for (let i = 0; i < parts.length; i++) {
    switch (parts[i]) {
      case '--stash':
        doStash = true
        break
      case '--resume':
      case '--status':
        break
      default:
        targetDir = parts[i].startsWith('/') ? parts[i] : join(cwd, parts[i])
        break
    }
  }

  if (!targetDir) {
    return { type: 'text', value: 'Error: No target directory specified.' }
  }

  // Verify target exists
  try {
    const s = await stat(targetDir)
    if (!s.isDirectory()) {
      return { type: 'text', value: `Error: ${targetDir} is not a directory.` }
    }
  } catch {
    return { type: 'text', value: `Error: Directory not found: ${targetDir}` }
  }

  // Build stash if requested
  if (doStash) {
    const stash: TeleportStash = {
      sourceRepo: getRepoName(cwd),
      sourceDir: cwd,
      timestamp: new Date().toISOString(),
      todos: [],
      notes: `Stashed before teleporting to ${targetDir}`,
      context: `Session context from ${cwd}`,
    }
    await saveStash(cwd, stash)
  }

  const repoName = getRepoName(targetDir)
  return {
    type: 'text',
    value:
      `🌀 Teleport Complete\n` +
      `====================\n\n` +
      `From: ${cwd}\n` +
      `To:   ${targetDir} (${repoName})\n` +
      (doStash ? 'Context stashed successfully.\n' : '') +
      `\nUse /teleport --resume to restore stashed context.\n` +
      `Use /teleport --status to check stash state.`,
  }
}
