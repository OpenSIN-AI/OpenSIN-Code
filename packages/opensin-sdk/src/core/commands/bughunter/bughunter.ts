import { readdir, readFile, stat } from 'fs/promises'
import { join, extname, relative } from 'path'
import type { LocalCommandResult } from '../../types/command.js'
import type { ToolUseContext } from '../../Tool.js'

// ============================================================================
// BugHunter — Systematic codebase scanning for bugs and anti-patterns
// ============================================================================

type BugSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

type BugReport = {
  file: string
  line?: number
  severity: BugSeverity
  category: string
  title: string
  description: string
  suggestion: string
}

type ScanScope = 'dir' | 'file' | 'project'
type ScanDepth = 'shallow' | 'deep'

type ScanOptions = {
  scope: ScanScope
  depth: ScanDepth
  targetPath: string
  cwd: string
}

// File extensions to scan
const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.sh', '.mjs', '.cjs',
])

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', '.cache',
  '__pycache__', 'vendor', '.venv', 'coverage', '.turbo',
])

// ============================================================================
// Pattern-based bug detection rules
// ============================================================================

interface BugPattern {
  name: string
  severity: BugSeverity
  category: string
  test: (line: string, lineNumber: number, filePath: string) => BugReport | null
}

const BUG_PATTERNS: BugPattern[] = [
  {
    name: 'console-log',
    severity: 'low' as BugSeverity,
    category: 'Debug Code',
    test: (line, lineNumber, filePath) => {
      if (/\bconsole\.(log|warn|debug|info|trace)\s*\(/.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        const method = line.match(/console\.(log|warn|debug|info|trace)/)?.[1] ?? 'log'
        return {
          file: filePath, line: lineNumber, severity: 'low' as BugSeverity,
          category: 'Debug Code', title: 'Console statement found',
          description: `Found console.${method}() which should be removed before production`,
          suggestion: 'Remove console statements or use a proper logging framework',
        }
      }
      return null
    },
  },
  {
    name: 'todo-fixme',
    severity: 'info' as BugSeverity,
    category: 'Technical Debt',
    test: (line, lineNumber, filePath) => {
      const match = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)\b[:\s]*(.*)/i)
      if (match) {
        return {
          file: filePath, line: lineNumber, severity: 'info' as BugSeverity,
          category: 'Technical Debt', title: `${match[1]} comment found`,
          description: match[2] ? `${match[1]}: ${match[2].trim()}` : `Unresolved ${match[1]} marker`,
          suggestion: `Address the ${match[1]} or create a tracking issue`,
        }
      }
      return null
    },
  },
  {
    name: 'any-type',
    severity: 'medium' as BugSeverity,
    category: 'Type Safety',
    test: (line, lineNumber, filePath) => {
      if (extname(filePath).startsWith('.ts') && /:\s*any\b/.test(line) && !line.trim().startsWith('//')) {
        return {
          file: filePath, line: lineNumber, severity: 'medium' as BugSeverity,
          category: 'Type Safety', title: 'Explicit `any` type used',
          description: 'Using `any` defeats TypeScript type checking',
          suggestion: 'Use a more specific type, unknown, or generics',
        }
      }
      return null
    },
  },
  {
    name: 'eval-usage',
    severity: 'critical' as BugSeverity,
    category: 'Security',
    test: (line, lineNumber, filePath) => {
      if (/\beval\s*\(/.test(line) && !line.trim().startsWith('//')) {
        return {
          file: filePath, line: lineNumber, severity: 'critical' as BugSeverity,
          category: 'Security', title: 'eval() usage detected',
          description: 'eval() can execute arbitrary code and is a security risk',
          suggestion: 'Use JSON.parse(), Function constructor with caution, or safer alternatives',
        }
      }
      return null
    },
  },
  {
    name: 'hardcoded-secret',
    severity: 'high' as BugSeverity,
    category: 'Security',
    test: (line, lineNumber, filePath) => {
      const secretPatterns = [
        /(api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/i,
        /(secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
        /(aws_access_key|aws_secret_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{16,}['"]/i,
      ]
      for (const pattern of secretPatterns) {
        if (pattern.test(line) && !line.trim().startsWith('//')) {
          return {
            file: filePath, line: lineNumber, severity: 'high' as BugSeverity,
            category: 'Security', title: 'Possible hardcoded secret',
            description: 'A value that looks like a secret/key/token is hardcoded',
            suggestion: 'Use environment variables or a secrets manager',
          }
        }
      }
      return null
    },
  },
  {
    name: 'empty-catch',
    severity: 'medium' as BugSeverity,
    category: 'Error Handling',
    test: (line, lineNumber, filePath) => {
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
        return {
          file: filePath, line: lineNumber, severity: 'medium' as BugSeverity,
          category: 'Error Handling', title: 'Empty catch block',
          description: 'Errors are silently swallowed, making debugging difficult',
          suggestion: 'Log the error or handle it appropriately',
        }
      }
      return null
    },
  },
  {
    name: 'magic-number',
    severity: 'info' as BugSeverity,
    category: 'Code Quality',
    test: (line, lineNumber, filePath) => {
      if (!line.trim().startsWith('//') && !line.trim().startsWith('import') && !line.includes('const ') && !line.includes('let ') && /\b[0-9]{4,}\b/.test(line)) {
        return {
          file: filePath, line: lineNumber, severity: 'info' as BugSeverity,
          category: 'Code Quality', title: 'Possible magic number',
          description: 'Large numeric literal found without explanation',
          suggestion: 'Extract to a named constant for clarity',
        }
      }
      return null
    },
  },
]

// ============================================================================
// File discovery
// ============================================================================

async function discoverFiles(dir: string, skipDirs: Set<string> = SKIP_DIRS): Promise<string[]> {
  const files: string[] = []
  let entries: import('fs').Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        files.push(...(await discoverFiles(fullPath, skipDirs)))
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name)
      if (SCAN_EXTENSIONS.has(ext)) {
        files.push(fullPath)
      }
    }
  }
  return files
}

// ============================================================================
// File scanning
// ============================================================================

async function scanFile(filePath: string, cwd: string, depth: ScanDepth): Promise<BugReport[]> {
  const bugs: BugReport[] = []
  let content: string
  try {
    content = await readFile(filePath, 'utf-8')
  } catch {
    return bugs
  }
  const lines = content.split('\n')
  const relPath = relative(cwd, filePath)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const pattern of BUG_PATTERNS) {
      const bug = pattern.test(line, i + 1, relPath)
      if (bug) bugs.push(bug)
    }
  }

  if (depth === 'deep') {
    if (lines.length > 1000) {
      bugs.push({
        file: relPath, severity: 'info' as BugSeverity, category: 'Code Quality',
        title: 'Very long file',
        description: `File has ${lines.length} lines, consider splitting into smaller modules`,
        suggestion: 'Break into smaller, focused modules',
      })
    }
    const importLines = lines.map((l, i) => ({ line: l, num: i + 1 })).filter(({ line }) => /^\s*import\s/.test(line))
    const importSources = importLines.map(({ line }) => line.match(/from\s+['"]([^'"]+)['"]/)?.[1])
    const seen = new Map<string, number>()
    for (let i = 0; i < importSources.length; i++) {
      const src = importSources[i]
      if (src) {
        const first = seen.get(src)
        if (first !== undefined) {
          bugs.push({
            file: relPath, line: importLines[i].num, severity: 'info' as BugSeverity,
            category: 'Code Quality', title: 'Duplicate import source',
            description: `Module "${src}" is imported multiple times`,
            suggestion: 'Consolidate imports from the same module',
          })
        } else {
          seen.set(src, i)
        }
      }
    }
  }
  return bugs
}

// ============================================================================
// Argument parsing
// ============================================================================

function parseArgs(args: string, cwd: string): ScanOptions {
  const options: ScanOptions = { scope: 'project', depth: 'shallow', targetPath: cwd, cwd }
  const parts = args.trim().split(/\s+/).filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    switch (parts[i]) {
      case '--scope':
        if (parts[i + 1] === 'dir' || parts[i + 1] === 'file' || parts[i + 1] === 'project') {
          options.scope = parts[i + 1] as ScanScope
          i++
        }
        break
      case '--depth':
        if (parts[i + 1] === 'shallow' || parts[i + 1] === 'deep') {
          options.depth = parts[i + 1] as ScanDepth
          i++
        }
        break
      default:
        options.targetPath = parts[i].startsWith('/') ? parts[i] : join(cwd, parts[i])
        break
    }
  }
  return options
}

// ============================================================================
// Report formatting
// ============================================================================

function formatReport(bugs: BugReport[], filesScanned: number): string {
  if (bugs.length === 0) {
    return `BugHunter Report\n${'='.repeat(40)}\n\nFiles scanned: ${filesScanned}\nIssues found: 0\n\nNo issues detected. Great job!`
  }
  const bySeverity: Record<BugSeverity, BugReport[]> = { critical: [], high: [], medium: [], low: [], info: [] }
  for (const bug of bugs) bySeverity[bug.severity].push(bug)

  const lines: string[] = [
    'BugHunter Report', '='.repeat(40), '',
    `Files scanned: ${filesScanned}`, `Issues found: ${bugs.length}`,
    `  Critical: ${bySeverity.critical.length}`, `  High:     ${bySeverity.high.length}`,
    `  Medium:   ${bySeverity.medium.length}`, `  Low:      ${bySeverity.low.length}`,
    `  Info:     ${bySeverity.info.length}`, '',
  ]

  const byCategory = new Map<string, BugReport[]>()
  for (const bug of bugs) {
    const existing = byCategory.get(bug.category) || []
    existing.push(bug)
    byCategory.set(bug.category, existing)
  }

  for (const [category, categoryBugs] of byCategory) {
    lines.push(`-- ${category} --`)
    for (const bug of categoryBugs) {
      const loc = bug.line ? `:${bug.line}` : ''
      lines.push(`  [${bug.severity.toUpperCase()}] ${bug.file}${loc}`, `    ${bug.title}`, `    ${bug.description}`, `    -> ${bug.suggestion}`, '')
    }
  }
  return lines.join('\n')
}

// ============================================================================
// Main command entry point
// ============================================================================

export async function call(args: string, context: ToolUseContext): Promise<LocalCommandResult> {
  const cwd = context.cwd || process.cwd()
  const options = parseArgs(args, cwd)

  if (options.scope === 'file') {
    try {
      const s = await stat(options.targetPath)
      if (!s.isFile()) return { type: 'text', value: `Error: ${options.targetPath} is not a file` }
    } catch {
      return { type: 'text', value: `Error: File not found: ${options.targetPath}` }
    }
    const bugs = await scanFile(options.targetPath, cwd, options.depth)
    return { type: 'text', value: formatReport(bugs, 1) }
  }

  try {
    const s = await stat(options.targetPath)
    if (!s.isDirectory()) return { type: 'text', value: `Error: ${options.targetPath} is not a directory` }
  } catch {
    return { type: 'text', value: `Error: Directory not found: ${options.targetPath}` }
  }

  const files = await discoverFiles(options.targetPath)
  const allBugs: BugReport[] = []
  for (const file of files) {
    const bugs = await scanFile(file, cwd, options.depth)
    allBugs.push(...bugs)
  }

  const severityOrder: Record<BugSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  allBugs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return { type: 'text', value: formatReport(allBugs, files.length) }
}
