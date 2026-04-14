import type { KeyBinding } from './types'

export const DEFAULT_KEYBINDINGS: KeyBinding[] = [
  { keys: 'Ctrl+C', command: 'cancel', description: 'Cancel current operation', when: 'global' },
  { keys: 'Ctrl+L', command: 'clear_screen', description: 'Clear terminal screen', when: 'terminal' },
  { keys: 'Ctrl+K', command: 'clear_input', description: 'Clear input line', when: 'input' },
  { keys: 'Ctrl+U', command: 'clear_to_start', description: 'Clear to beginning of line', when: 'input' },
  { keys: 'Ctrl+W', command: 'delete_word', description: 'Delete word before cursor', when: 'input' },
  { keys: 'Ctrl+A', command: 'move_to_start', description: 'Move to start of line', when: 'input' },
  { keys: 'Ctrl+E', command: 'move_to_end', description: 'Move to end of line', when: 'input' },
  { keys: 'Ctrl+P', command: 'history_prev', description: 'Previous history entry', when: 'input' },
  { keys: 'Ctrl+N', command: 'history_next', description: 'Next history entry', when: 'input' },
  { keys: 'Ctrl+R', command: 'history_search', description: 'Reverse history search', when: 'input' },
  { keys: 'Escape', command: 'exit_vim', description: 'Exit vim mode', when: 'vim-normal' },
  { keys: 'i', command: 'vim_insert', description: 'Enter insert mode', when: 'vim-normal' },
  { keys: 'v', command: 'enter_vim', description: 'Enter vim mode', when: 'terminal' },
  { keys: 'Ctrl+X Ctrl+K', command: 'kill_buffer', description: 'Kill buffer (chord)', when: 'global' },
  { keys: 'Ctrl+X Ctrl+S', command: 'save', description: 'Save (chord)', when: 'global' },
  { keys: 'Ctrl+/', command: 'toggle_comment', description: 'Toggle comment', when: 'input' },
  { keys: 'Ctrl+Shift+K', command: 'delete_line', description: 'Delete current line', when: 'input' },
  { keys: 'Alt+Up', command: 'move_line_up', description: 'Move line up', when: 'input' },
  { keys: 'Alt+Down', command: 'move_line_down', description: 'Move line down', when: 'input' },
  { keys: 'Ctrl+Shift+P', command: 'command_palette', description: 'Open command palette', when: 'global' },
  { keys: 'Ctrl+B', command: 'toggle_buddy', description: 'Toggle buddy display', when: 'global' },
  { keys: 'Ctrl+Shift+V', command: 'toggle_voice', description: 'Toggle voice mode', when: 'global' },
  { keys: 'Ctrl+Shift+T', command: 'toggle_theme', description: 'Toggle theme', when: 'global' },
]

export function getDefaultBindings(): KeyBinding[] { return [...DEFAULT_KEYBINDINGS] }
