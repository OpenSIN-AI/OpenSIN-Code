import type { Command } from '../../commands.js'

const teleport: Command = {
  name: 'teleport',
  description:
    'Teleport session between repos/directories with stash/resume',
  type: 'local',
  supportsNonInteractive: true,
  argumentHint: '<target-directory> [--stash] [--resume]',
  load: () => import('./teleport.js'),
}

export default teleport
