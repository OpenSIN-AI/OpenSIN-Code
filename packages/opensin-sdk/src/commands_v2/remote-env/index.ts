import type { Command } from '../../commands'
import { isPolicyAllowed } from '../../services/policyLimits/index'
import { isOpenSINAISubscriber } from '../../utils/auth'

export default {
  type: 'local-jsx',
  name: 'remote-env',
  description: 'Configure the default remote environment for teleport sessions',
  isEnabled: () =>
    isOpenSINAISubscriber() && isPolicyAllowed('allow_remote_sessions'),
  get isHidden() {
    return !isOpenSINAISubscriber() || !isPolicyAllowed('allow_remote_sessions')
  },
  load: () => import('./remote-env'),
} satisfies Command
