export type KeyChord = string[]
export type KeySequence = string

export function parseKeySequence(input: string): KeySequence | KeyChord {
  const trimmed = input.trim()
  if (!trimmed) return []
  if (trimmed.includes(' ')) return trimmed.split(/\s+/).filter(Boolean) as KeyChord
  return normalizeKeyCombo(trimmed)
}

function normalizeKeyCombo(input: string): string {
  return input.split('+').map(p => p.trim()).join('+')
}

export function parseKeybindingString(input: string): { modifiers: string[]; key: string } {
  const parts = input.split('+').map(p => p.trim())
  if (parts.length === 0) return { modifiers: [], key: '' }
  return { modifiers: parts.slice(0, -1), key: parts[parts.length - 1] ?? '' }
}

export function formatKeybinding(modifiers: string[], key: string): string {
  const modMap: Record<string, string> = { Ctrl: 'Ctrl', Alt: 'Alt', Meta: 'Cmd', Shift: 'Shift', Control: 'Ctrl' }
  return [...modifiers.map(m => modMap[m] ?? m), key].filter(Boolean).join('+')
}

export function keysMatch(a: string | string[], b: string | string[]): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a === b
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i])
  return false
}

export function isPrefixOf(prefix: string | string[], full: string | string[]): boolean {
  if (typeof prefix === 'string' && typeof full === 'string') return full.startsWith(prefix)
  if (Array.isArray(prefix) && Array.isArray(full)) return prefix.length <= full.length && prefix.every((v, i) => v === full[i])
  return false
}
