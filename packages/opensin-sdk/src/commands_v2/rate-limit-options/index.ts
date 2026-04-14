import type { Command } from '../../commands'
import { isOpenSINAISubscriber } from '../../utils/auth'

const rateLimitOptions = {
  type: 'local-jsx',
  name: 'rate-limit-options',
  description: 'Show options when rate limit is reached',
  isEnabled: () => {
    if (!isOpenSINAISubscriber()) {
      return false
    }

    return true
  },
  isHidden: true, // Hidden from help - only used internally
  load: () => import('./rate-limit-options'),
} satisfies Command

export default rateLimitOptions
