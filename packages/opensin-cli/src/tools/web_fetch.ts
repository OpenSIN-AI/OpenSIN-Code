import { ToolDefinition } from '../core/types.js';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

export class WebFetchTool implements ToolDefinition {
  name = 'web_fetch';
  description = 'Fetch content from a URL. Returns the response body as text.';
  parameters = {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'The URL to fetch' },
      method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], description: 'HTTP method' },
      headers: { type: 'object', description: 'Additional HTTP headers' },
      body: { type: 'string', description: 'Request body for POST/PUT' },
      max_length: { type: 'number', description: 'Maximum response length in characters' },
    },
    required: ['url'],
  };

  async execute(input: Record<string, unknown>): Promise<{ output: string; isError?: boolean }> {
    const { url, method = 'GET', headers = {}, body, max_length = 50000 } = input as Record<string, any>;
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const reqHeaders = { ...headers, 'User-Agent': 'OpenSIN-Agent/1.0' };
      const options: any = { method, headers: reqHeaders, timeout: 30000 };

      return new Promise((resolve) => {
        const req = client.request(url, options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            const truncated = data.length > max_length ? data.slice(0, max_length) + '\n... (truncated)' : data;
            resolve({ output: `Status: ${res.statusCode}\n${truncated}` });
          });
        });
        req.on('error', (e) => resolve({ output: `Error: ${e.message}`, isError: true }));
        req.on('timeout', () => { req.destroy(); resolve({ output: 'Error: Request timed out', isError: true }); });
        if (body) req.write(body);
        req.end();
      });
    } catch (e: any) {
      return { output: `Error: ${e.message}`, isError: true };
    }
  }
}
