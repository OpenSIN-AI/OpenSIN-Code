export type Modifier = 'Ctrl' | 'Alt' | 'Meta' | 'Shift'
export type KeyChord = string[]
export type KeySequence = string

export interface KeyBinding {
  keys: KeySequence | KeyChord
  command: string
  when?: string
  description?: string
  args?: Record<string, unknown>
}

export interface ResolvedBinding {
  command: string
  args?: Record<string, unknown>
  description?: string
  source: 'default' | 'user' | 'extension'
}

export interface KeybindingConfig { bindings: KeyBinding[]; context?: string }
export interface BindingMatch { binding: KeyBinding; matchedKeys: string[]; isPartial: boolean }
export interface ConflictInfo { keys: string; bindings: [KeyBinding, KeyBinding]; context?: string }
export type KeybindingContext = 'global' | 'terminal' | 'input' | 'vim-normal' | 'vim-insert' | 'voice' | 'file-explorer'
