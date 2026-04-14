import type { Command } from '../../commands'
import { checkStatsigFeatureGate_CACHED_MAY_BE_STALE } from '../../services/analytics/growthbook'

const thinkback = {
  type: 'local-jsx',
  name: 'think-back',
  description: 'Your 2025 OpenSIN Code Year in Review',
  isEnabled: () =>
    checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_thinkback'),
  load: () => import('./thinkback'),
} satisfies Command

export default thinkback
