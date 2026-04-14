import type { Command } from '../../commands'
import { hasOpenSINApiKeyAuth } from '../../utils/auth'
import { isEnvTruthy } from '../../utils/envUtils'

export default () =>
  ({
    type: 'local-jsx',
    name: 'login',
    description: hasOpenSINApiKeyAuth()
      ? 'Switch OpenSIN accounts'
      : 'Sign in with your OpenSIN account',
    isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
    load: () => import('./login'),
  }) satisfies Command
