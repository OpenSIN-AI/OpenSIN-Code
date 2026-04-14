import { getIsRemoteMode } from '../../bootstrap/state'
import type { Command } from '../../commands'

const session = {
  type: 'local-jsx',
  name: 'session',
  aliases: ['remote'],
  description: 'Show remote session URL and QR code',
  isEnabled: () => getIsRemoteMode(),
  get isHidden() {
    return !getIsRemoteMode()
  },
  load: () => import('./session'),
} satisfies Command

export default session
