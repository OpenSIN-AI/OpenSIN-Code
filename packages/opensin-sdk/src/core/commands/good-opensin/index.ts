import type { Command } from '../../commands.js'

const goodOpensin: Command = {
  name: 'good-opensin',
  aliases: ['good-opensin-code'],
  description: 'Give positive feedback for good work done by OpenSIN',
  type: 'local',
  supportsNonInteractive: true,
  argumentHint: '[feedback message]',
  load: () => import('./good-opensin.js'),
}

export default goodOpensin
