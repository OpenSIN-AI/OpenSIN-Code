import type { LocalCommandCall } from '../../types/command'
import { clearConversation } from './conversation'

export const call: LocalCommandCall = async (_, context) => {
  await clearConversation(context)
  return { type: 'text', value: '' }
}
