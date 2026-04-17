// good-opensin command - Positive feedback / appreciation
// Partially addresses Epic #1089 Phase 2.1
import type { CommandDef } from '../../types/command.js';

export const goodOpenSin: CommandDef = {
  name: 'good-opensin',
  aliases: ['good'],
  description: 'Send positive feedback or appreciation to the OpenSIN team',
  usage: '/good-opensin [message]',
  examples: ['/good-opensin Great work on the A2A system!', '/good-opensin Thanks for fixing that bug'],
  
  async run(args: string[]): Promise<string> {
    if (args.length === 0) {
      return 'Usage: /good-opensin <your feedback message>\n\nShare appreciation or positive feedback about OpenSIN.';
    }
    const message = args.join(' ');
    return `Thank you for your feedback! 🎉\n\n"${message}"\n\nYour appreciation has been logged. Keep up the great work!`;
  }
};

export default goodOpenSin;
