import type { Command } from '../../commands.js'
import { hasOpenSINApiKeyAuth } from '../../utils/auth.js'
import { isEnvTruthy } from '../../utils/envUtils.js'

export default () =>
  ({
    type: 'local-jsx',
    name: 'login',
    description: hasOpenSINApiKeyAuth()
      ? 'Switch OpenSIN accounts'
      : 'Sign in with your OpenSIN account',
    isEnabled: () => !isEnvTruthy(process.env.DISABLE_LOGIN_COMMAND),
    load: () => import('./login.js'),
  }) satisfies Command
