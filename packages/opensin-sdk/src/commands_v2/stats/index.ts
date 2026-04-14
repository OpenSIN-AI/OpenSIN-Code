import type { Command } from '../../commands'

const stats = {
  type: 'local-jsx',
  name: 'stats',
  description: 'Show your OpenSIN Code usage statistics and activity',
  load: () => import('./stats'),
} satisfies Command

export default stats
