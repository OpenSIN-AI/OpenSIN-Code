import type { Command } from '../../commands'

const hooks = {
  type: 'local-jsx',
  name: 'hooks',
  description: 'View hook configurations for tool events',
  immediate: true,
  load: () => import('./hooks'),
} satisfies Command

export default hooks
