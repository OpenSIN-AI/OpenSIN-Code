import type { Command } from '../../commands'
import { isEnvTruthy } from '../../utils/envUtils'

export default {
  type: 'local-jsx',
  name: 'logout',
  description: 'Sign out from your Anthropic account',
  isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGOUT_COMMAND),
  load: () => import('./logout'),
} satisfies Command
