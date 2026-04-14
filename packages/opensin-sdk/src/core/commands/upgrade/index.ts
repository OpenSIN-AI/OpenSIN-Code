import type { Command } from '../../commands'
import { getSubscriptionType } from '../../utils/auth'
import { isEnvTruthy } from '../../utils/envUtils'

const upgrade = {
  type: 'local-jsx',
  name: 'upgrade',
  description: 'Upgrade to Max for higher rate limits and more Opus',
  availability: ['claude-ai'],
  isEnabled: () =>
    !isEnvTruthy(process.env.DISABLE_UPGRADE_COMMAND) &&
    getSubscriptionType() !== 'enterprise',
  load: () => import('./upgrade'),
} satisfies Command

export default upgrade
