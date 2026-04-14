import type { Command } from '../../commands'
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand'
import { getMainLoopModel, renderModelName } from '../../utils/model/model'

export default {
  type: 'local-jsx',
  name: 'model',
  get description() {
    return `Set the AI model for Claude Code (currently ${renderModelName(getMainLoopModel())})`
  },
  argumentHint: '[model]',
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate()
  },
  load: () => import('./model'),
} satisfies Command
