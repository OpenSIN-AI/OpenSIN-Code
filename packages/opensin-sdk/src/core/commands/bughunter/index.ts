import type { Command } from '../../commands'

const bughunter: Command = {
  name: 'bughunter',
  description:
    'Systematically scan the codebase for bugs, anti-patterns, and potential issues',
  type: 'local',
  supportsNonInteractive: true,
  argumentHint: '[--scope <dir|file|project>] [--depth <shallow|deep>]',
  load: () => import('./bughunter'),
}

export default bughunter
