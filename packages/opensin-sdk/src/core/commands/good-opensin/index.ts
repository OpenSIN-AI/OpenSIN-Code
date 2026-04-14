import type { Command } from '../../commands'

const goodOpensin: Command = {
  name: 'good-opensin',
  aliases: ['good-opensin-code'],
  description: 'Give positive feedback for good work done by OpenSIN',
  type: 'local',
  supportsNonInteractive: true,
  argumentHint: '[feedback message]',
  load: () => import('./good-opensin'),
}

export default goodOpensin
