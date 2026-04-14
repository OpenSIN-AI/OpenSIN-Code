import type { Command } from '../../commands'
import { isConsumerSubscriber } from '../../utils/auth'

const privacySettings = {
  type: 'local-jsx',
  name: 'privacy-settings',
  description: 'View and update your privacy settings',
  isEnabled: () => {
    return isConsumerSubscriber()
  },
  load: () => import('./privacy-settings'),
} satisfies Command

export default privacySettings
