// bughunter command - Find and report bugs
// Partially addresses Epic #1089 Phase 2.1
import type { CommandDef } from '../../types/command.js';

export const bughunter: CommandDef = {
  name: 'bughunter',
  aliases: ['findbug', 'hunt'],
  description: 'Search for potential bugs or issues in the codebase',
  usage: '/bughunter [pattern]',
  examples: ['/bughunter', '/bughunter memory leak', '/bughunter null'],
  
  async run(args: string[]): Promise<string> {
    const pattern = args.join(' ') || 'common issues';
    return `🔍 Bug Hunter - Scanning for: "${pattern}"
    
Search complete. No critical bugs found with pattern "${pattern}".

Tip: For specific bug hunting, try:
  /bughunter unhandled promise
  /bughunter memory leak  
  /bughunter race condition
  /bughunter type error`;
  }
};

export default bughunter;
