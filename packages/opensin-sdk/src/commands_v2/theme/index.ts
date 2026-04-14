import type { Command } from '../../commands'

const theme = {
  type: 'local-jsx',
  name: 'theme',
  description: 'Change the theme',
  load: () => import('./theme'),
} satisfies Command

export default theme
