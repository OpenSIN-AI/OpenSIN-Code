import type { Command } from '../../commands'
import { hasAnthropicApiKeyAuth } from '../../utils/auth'
import { isEnvTruthy } from '../../utils/envUtils'

export default () =>
  ({
    type: 'local-jsx',
    name: 'login',
    description: hasAnthropicApiKeyAuth()
      ? 'Switch Anthropic accounts'
      : 'Sign in with your Anthropic account',
    isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
    load: () => import('./login'),
  }) satisfies Command
