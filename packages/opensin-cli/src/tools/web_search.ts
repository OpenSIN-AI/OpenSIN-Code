import { ToolDefinition } from '../core/types.js';
import https from 'node:https';
import http from 'node:http';

export class WebSearchTool implements ToolDefinition {
  name = 'web_search';
  description = 'Search the web using a search engine. Returns search results as text.';
  parameters = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
      num_results: { type: 'number', description: 'Number of results to return' },
    },
    required: ['query'],
  };

  async execute(input: Record<string, unknown>): Promise<{ output: string; isError?: boolean }> {
    const { query, num_results = 5 } = input as Record<string, any>;
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://html.duckduckgo.com/html/?q=${encoded}`;
      const client = url.startsWith('https') ? https : http;

      return new Promise((resolve) => {
        const req = client.request(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            const results: string[] = [];
            const titleRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
            const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;
            let match;
            while ((match = titleRegex.exec(data)) !== null && results.length < num_results) {
              const title = match[2].replace(/<[^>]*>/g, '').trim();
              const url = match[1].replace(/\/\/www\.google\.com\/url\?q=([^&]+).*/, '$1');
              results.push(`${results.length + 1}. ${title}\n   URL: ${decodeURIComponent(url)}`);
            }
            if (results.length === 0) {
              resolve({ output: `No results found for: ${query}` });
            } else {
              resolve({ output: `Search results for "${query}":\n\n${results.join('\n\n')}` });
            }
          });
        });
        req.on('error', (e) => resolve({ output: `Error: ${e.message}`, isError: true }));
        req.on('timeout', () => { req.destroy(); resolve({ output: 'Error: Search timed out', isError: true }); });
        req.end();
      });
    } catch (e: any) {
      return { output: `Error: ${e.message}`, isError: true };
    }
  }
}
