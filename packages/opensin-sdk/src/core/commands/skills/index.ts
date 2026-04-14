import type { Command } from '../../commands'

const skills = {
  type: 'local-jsx',
  name: 'skills',
  description: 'List available skills',
  load: () => import('./skills'),
} satisfies Command

export default skills
