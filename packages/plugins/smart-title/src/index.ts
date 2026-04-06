import { definePlugin } from '@opensin/plugin-sdk';

function generateTitle(message: string, maxLength = 50): string {
  // Simple heuristic title generation
  const words = message.trim().split(/\s+/);

  // Extract key terms (first meaningful words)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'while', 'although', 'though', 'even', 'unless', 'until', 'whether']);

  const keyWords = words.filter(w => !stopWords.has(w.toLowerCase()) && w.length > 2);
  let title = keyWords.slice(0, 5).join(' ');

  if (title.length > maxLength) {
    title = title.slice(0, maxLength - 3) + '...';
  }

  return title || 'Untitled Session';
}

export default definePlugin({
  name: '@opensin/plugin-smart-title',
  version: '0.1.0',
  type: 'hook',
  description: 'Auto-generate session titles from first message',

  async activate(ctx) {
    const maxLength = ctx.getConfig('maxLength', 50);

    ctx.events.on('session:start', async (data: any) => {
      const { firstMessage } = data || {};
      if (!firstMessage) return;

      const title = generateTitle(firstMessage, maxLength);
      ctx.session.title = title;
      ctx.logger.info(`[smart-title] Auto-generated: "${title}"`);
    });

    ctx.logger.info('Smart title plugin activated');
  },
});
