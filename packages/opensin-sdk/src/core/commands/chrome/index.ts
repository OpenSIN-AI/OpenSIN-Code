import { getIsNonInteractiveSession } from '../../bootstrap/state'
import type { Command } from '../../commands'

const command: Command = {
  name: 'chrome',
  description: 'Claude in Chrome (Beta) settings',
  availability: ['claude-ai'],
  isEnabled: () => !getIsNonInteractiveSession(),
  type: 'local-jsx',
  load: () => import('./chrome'),
}

export default command
