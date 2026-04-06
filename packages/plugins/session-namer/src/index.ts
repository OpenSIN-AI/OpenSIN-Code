import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';

const ADJECTIVES = ['brave', 'clever', 'swift', 'bold', 'calm', 'keen', 'wise', 'fast', 'grand', 'noble'];
const NOUNS = ['falcon', 'eagle', 'wolf', 'bear', 'lion', 'hawk', 'fox', 'owl', 'tiger', 'dragon'];

function randomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}-${noun}-${num}`;
}

function extractTitle(message: string, maxLength = 40): string {
  const words = message.trim().split(/\s+/).filter(w => w.length > 2);
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'with', 'from', 'they', 'will', 'each', 'about', 'which', 'their', 'would', 'other', 'these', 'there', 'could', 'should']);
  const keyWords = words.filter(w => !stopWords.has(w.toLowerCase()));
  let title = keyWords.slice(0, 4).join(' ');
  if (title.length > maxLength) title = title.slice(0, maxLength - 3) + '...';
  return title || randomName();
}

export default definePlugin({
  name: '@opensin/plugin-session-namer',
  version: '0.1.0',
  type: 'hook',
  description: 'Auto-generate meaningful session names from first message or random',

  async activate(ctx) {
    const maxLength = ctx.getConfig('maxLength', 40);
    const useRandom = ctx.getConfig('useRandom', false);

    ctx.events.on('session:start', async (data: any) => {
      const { firstMessage } = data || {};
      let title: string;

      if (useRandom || !firstMessage) {
        title = randomName();
      } else {
        title = extractTitle(firstMessage, maxLength);
      }

      ctx.session.title = title;
      ctx.logger.info(`[session-namer] Session named: "${title}"`);
    });

    ctx.tools.register(createTool({
      name: 'session_rename',
      description: 'Rename the current session',
      parameters: {
        name: ParamTypes.string({ required: true, description: 'New session name' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const name = params.name as string;
        ctx.session.title = name;
        return { content: `Session renamed to: "${name}"` };
      }
    }));

    ctx.logger.info('Session namer plugin activated');
  },
});
