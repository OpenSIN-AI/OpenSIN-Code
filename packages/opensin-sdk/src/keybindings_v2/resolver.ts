import type { KeyBinding, KeybindingContext, ResolvedBinding, ConflictInfo } from './types'
import { parseKeySequence } from './parser'

export class KeybindingResolver {
  private bindings: Map<string, KeyBinding[]> = new Map()
  private chords: Map<string, KeyBinding[]> = new Map()

  constructor(bindings: KeyBinding[] = []) { for (const b of bindings) this.addBinding(b) }

  addBinding(binding: KeyBinding): void {
    const parsed = parseKeySequence(typeof binding.keys === 'string' ? binding.keys : binding.keys.join(' '))
    if (Array.isArray(parsed) && parsed.length > 1) {
      const ck = parsed[0]!; const existing = this.chords.get(ck) || []
      this.chords.set(ck, [...existing, binding])
    } else {
      const key = typeof parsed === 'string' ? parsed : parsed[0] || ''
      const existing = this.bindings.get(key) || []
      this.bindings.set(key, [...existing, binding])
    }
  }

  resolve(keySequence: string, context: KeybindingContext = 'global'): ResolvedBinding | null {
    const direct = this.bindings.get(keySequence)
    if (direct) { const match = direct.find(b => this.contextMatches(b, context)); if (match) return { command: match.command, args: match.args, description: match.description, source: 'default' } }
    return null
  }

  resolveChord(firstKey: string, secondKey: string, context: KeybindingContext = 'global'): ResolvedBinding | null {
    const cb = this.chords.get(firstKey); if (!cb) return null
    const match = cb.find(b => { if (!this.contextMatches(b, context)) return false; const p = parseKeySequence(typeof b.keys === 'string' ? b.keys : b.keys.join(' ')); return Array.isArray(p) && p.length === 2 && p[1] === secondKey })
    return match ? { command: match.command, args: match.args, description: match.description, source: 'default' } : null
  }

  isPartialMatch(keySequence: string, context: KeybindingContext = 'global'): boolean {
    for (const [ck] of this.chords) if (ck === keySequence) return true
    return false
  }

  detectConflicts(): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    for (const [key, bindings] of this.bindings) {
      const ctxBindings = bindings.filter(b => this.contextMatches(b, 'global'))
      if (ctxBindings.length > 1) conflicts.push({ keys: key, bindings: [ctxBindings[0]!, ctxBindings[1]!] })
    }
    return conflicts
  }

  private contextMatches(binding: KeyBinding, context: KeybindingContext): boolean { return !binding.when || binding.when === context || binding.when === 'global' }

  getBindingsForContext(context: KeybindingContext): KeyBinding[] {
    const result: KeyBinding[] = []
    for (const [, bindings] of this.bindings) for (const b of bindings) if (this.contextMatches(b, context)) result.push(b)
    for (const [, bindings] of this.chords) for (const b of bindings) if (this.contextMatches(b, context)) result.push(b)
    return result
  }
}
