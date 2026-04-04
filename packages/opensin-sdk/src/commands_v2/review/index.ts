import type { Command } from '../../commands.js'

const review = {
  type: 'local-jsx',
  name: 'review',
  description: 'Review code changes',
  load: () => import('./ultrareviewCommand.js'),
} satisfies Command

export default review
