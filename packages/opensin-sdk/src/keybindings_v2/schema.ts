import type { KeyBinding, KeybindingContext } from './types.js'

export const VALID_CONTEXTS: KeybindingContext[] = ['global', 'terminal', 'input', 'vim-normal', 'vim-insert', 'voice', 'file-explorer']
export const RESERVED_SHORTCUTS = [
  { keys: 'Ctrl+C', reason: 'Interrupt/copy' }, { keys: 'Ctrl+V', reason: 'Paste' },
  { keys: 'Ctrl+Z', reason: 'Undo' }, { keys: 'Ctrl+Shift+C', reason: 'Terminal copy' },
  { keys: 'Ctrl+Shift+V', reason: 'Terminal paste' },
]

export function validateBinding(binding: KeyBinding): string[] {
  const errors: string[] = []
  if (!binding.command) errors.push('Command is required')
  if (!binding.keys || (typeof binding.keys === 'string' && !binding.keys.trim())) errors.push('Keys are required')
  if (binding.when) { const ctx = binding.when as KeybindingContext; if (!VALID_CONTEXTS.includes(ctx)) errors.push(`Invalid context: ${binding.when}`) }
  return errors
}

export function validateConfig(config: { bindings: KeyBinding[] }): string[] {
  const errors: string[] = []
  for (let i = 0; i < config.bindings.length; i++) {
    for (const err of validateBinding(config.bindings[i]!)) errors.push(`Binding #${i + 1}: ${err}`)
  }
  return errors
}
