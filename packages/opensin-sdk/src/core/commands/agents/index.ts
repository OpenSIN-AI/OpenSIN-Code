import type { Command } from '../../commands'

const agents = {
  type: 'local-jsx',
  name: 'agents',
  description: 'Manage agent configurations',
  load: () => import('./agents'),
} satisfies Command

export default agents
