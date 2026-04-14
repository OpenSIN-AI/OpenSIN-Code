import type { Command } from '../../commands'

const memory: Command = {
  type: 'local-jsx',
  name: 'memory',
  description: 'Edit OpenSIN memory files',
  load: () => import('./memory'),
}

export default memory
