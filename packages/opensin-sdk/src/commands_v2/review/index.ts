import type { Command } from '../../commands'

const review = {
  type: 'local-jsx',
  name: 'review',
  description: 'Review code changes',
  load: () => import('./ultrareviewCommand'),
} satisfies Command

export default review
