import { getIsNonInteractiveSession } from '../../bootstrap/state'
import type { Command } from '../../commands'

const command: Command = {
  name: 'chrome',
  description: 'OpenSIN in Chrome (Beta) settings',
  availability: ['opensin-ai'],
  isEnabled: () => !getIsNonInteractiveSession(),
  type: 'local-jsx',
  load: () => import('./chrome'),
}

export default command
