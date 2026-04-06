import { definePlugin } from '@opensin/plugin-sdk';
import { execSync } from 'node:child_process';
import * as os from 'node:os';

function sendNotification(title: string, message: string): void {
  const platform = os.platform();

  try {
    if (platform === 'darwin') {
      execSync(`osascript -e 'display notification "${message}" with title "${title}"'`);
    } else if (platform === 'linux') {
      execSync(`notify-send "${title}" "${message}"`);
    } else if (platform === 'win32') {
      execSync(`powershell -Command "[System.Windows.Forms.MessageBox]::Show('${message}', '${title}')"`, { stdio: 'ignore' });
    }
  } catch {
    // Notification failed silently
  }
}

export default definePlugin({
  name: '@opensin/plugin-notify',
  version: '0.1.0',
  type: 'hook',
  description: 'Native OS notifications — know when tasks complete',

  async activate(ctx) {
    const enabled = ctx.getConfig('enabled', true);
    const sound = ctx.getConfig('sound', false);
    const longTaskThreshold = ctx.getConfig('longTaskThreshold', 30000); // 30s
    const taskStartTime = new Map<string, number>();

    if (!enabled) {
      ctx.logger.info('Notify plugin disabled by config');
      return;
    }

    ctx.events.on('session:start', async () => {
      sendNotification('SIN Code CLI', 'Session started');
    });

    ctx.events.on('session:end', async () => {
      sendNotification('SIN Code CLI', 'Session completed');
    });

    ctx.events.on('tool:execute:before', async (data: any) => {
      const { tool, args } = data || {};
      if (tool === 'bash' && args?.command) {
        taskStartTime.set(args.command, Date.now());
      }
    });

    ctx.events.on('tool:execute:after', async (data: any) => {
      const { tool, args, duration } = data || {};
      if (tool === 'bash' && args?.command) {
        const elapsed = duration || (Date.now() - (taskStartTime.get(args.command) || Date.now()));
        if (elapsed > longTaskThreshold) {
          const cmd = args.command.slice(0, 50);
          sendNotification('SIN Code CLI', `Command completed (${(elapsed / 1000).toFixed(1)}s): ${cmd}`);
        }
        taskStartTime.delete(args.command);
      }
    });

    ctx.logger.info('Notify plugin activated');
  },
});
