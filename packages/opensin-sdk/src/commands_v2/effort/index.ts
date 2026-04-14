import type { Command } from '../../commands'
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand'

export default {
  type: 'local-jsx',
  name: 'effort',
  description: 'Set effort level for model usage',
  argumentHint: '[low|medium|high|max|auto]',
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate()
  },
  load: () => import('./effort'),
} satisfies Command
