import readline from 'readline';
import { PermissionCheck, PermissionResult } from './types.js';

export class ApprovalGate {
  private timeout: number;

  constructor(timeoutMs: number = 30000) {
    this.timeout = timeoutMs;
  }

  async requestApproval(check: PermissionCheck, reason?: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const toolName = check.toolName;
    const args = check.args ? JSON.stringify(check.args, null, 2) : '(no args)';

    console.log(`\n⚠️  Permission Required: ${toolName}`);
    if (reason) console.log(`   Reason: ${reason}`);
    console.log(`   Args: ${args}`);
    console.log(`   Allow this? [y/N] `);

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        rl.close();
        console.log('\n⏱️  Permission request timed out. Denying.');
        resolve(false);
      }, this.timeout);

      rl.question('', (answer) => {
        clearTimeout(timer);
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}
