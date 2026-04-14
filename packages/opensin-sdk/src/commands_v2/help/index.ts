import type { Command } from '../../commands'

const help = {
  type: 'local-jsx',
  name: 'help',
  description: 'Show help and available commands',
  load: () => import('./help'),
} satisfies Command

export default help
