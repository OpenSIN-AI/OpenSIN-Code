import type { Command } from '../../commands'
import { isKeybindingCustomizationEnabled } from '../../keybindings/loadUserBindings'

const keybindings = {
  name: 'keybindings',
  description: 'Open or create your keybindings configuration file',
  isEnabled: () => isKeybindingCustomizationEnabled(),
  supportsNonInteractive: false,
  type: 'local',
  load: () => import('./keybindings'),
} satisfies Command

export default keybindings
