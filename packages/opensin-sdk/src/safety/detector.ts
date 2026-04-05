import type { SafetyCheck } from './types.js'

const DESTRUCTIVE_PATTERNS = [
  { regex: /\brm\s+(-rf?|--no-preserve-root)?\s*\/?/i, risk: 'critical' as const, reason: 'File/directory deletion' },
  { regex: /\brmdir\s+/i, risk: 'high' as const, reason: 'Directory deletion' },
  { regex: /\bmv\s+/i, risk: 'medium' as const, reason: 'File move/rename' },
  { regex: /\bsed\s+-i/i, risk: 'medium' as const, reason: 'In-place file modification' },
  { regex: /\btruncate\s+/i, risk: 'high' as const, reason: 'File truncation' },
  { regex: /\bdd\s+/i, risk: 'critical' as const, reason: 'Low-level disk write' },
  { regex: /\bshred\s+/i, risk: 'critical' as const, reason: 'Secure file deletion' },
  { regex: /\bgit\s+(reset|clean)\s+/i, risk: 'high' as const, reason: 'Git history/workspace modification' },
  { regex: /\bchmod\s+777/i, risk: 'high' as const, reason: 'Overly permissive file permissions' },
  { regex: /\bchown\s+/i, risk: 'medium' as const, reason: 'File ownership change' },
  { regex: /\bsudo\s+/i, risk: 'medium' as const, reason: 'Elevated privileges' },
  { regex: /\bmkfs\b/i, risk: 'critical' as const, reason: 'Filesystem formatting' },
  { regex: /\b>[^>]/, risk: 'low' as const, reason: 'Output redirect (overwrite)' },
]

export class SafetyDetector {
  check(command: string): SafetyCheck {
    if (!command.trim()) return { isDestructive: false, risk: 'none', reason: 'Empty command' }
    for (const { regex, risk, reason } of DESTRUCTIVE_PATTERNS) {
      if (regex.test(command)) {
        return { isDestructive: true, risk, reason: `${reason} (matched: ${regex.source})`, suggestions: this.getSuggestions(risk, command) }
      }
    }
    return { isDestructive: false, risk: 'none', reason: 'No destructive patterns detected' }
  }

  private getSuggestions(risk: string, command: string): string[] {
    const suggestions: string[] = []
    if (risk === 'critical') { suggestions.push('This command can cause irreversible damage'); suggestions.push('Consider using a dry-run or preview first') }
    if (risk === 'high') { suggestions.push('This command may modify or delete files'); suggestions.push('Consider creating a backup first') }
    if (command.includes('rm -rf')) { suggestions.push('Use rm -i for interactive confirmation'); suggestions.push('Use trash-put instead of rm for recoverable deletion') }
    return suggestions
  }
}

export function createSafetyDetector(): SafetyDetector { return new SafetyDetector() }
