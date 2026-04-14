import type { Command } from '../../commands'
import { isPolicyAllowed } from '../../services/policyLimits/index'
import { isClaudeAISubscriber } from '../../utils/auth'

export default {
  type: 'local-jsx',
  name: 'remote-env',
  description: 'Configure the default remote environment for teleport sessions',
  isEnabled: () =>
    isClaudeAISubscriber() && isPolicyAllowed('allow_remote_sessions'),
  get isHidden() {
    return !isClaudeAISubscriber() || !isPolicyAllowed('allow_remote_sessions')
  },
  load: () => import('./remote-env'),
} satisfies Command
