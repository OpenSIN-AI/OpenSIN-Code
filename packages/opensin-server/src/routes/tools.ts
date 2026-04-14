import express from 'express';
import { ErrorResponse } from '../types';

interface ToolRequest {
  name: string;
  args?: Record<string, unknown>;
}

interface ToolResponse {
  result?: unknown;
  error?: string;
}

export function toolsRouter(): express.Router {
  const router = express.Router();

  router.post('/execute', (req: express.Request, res: express.Response) => {
    const toolRequest = req.body as ToolRequest;
    
    if (!toolRequest.name) {
      res.status(400).json({ error: 'Tool name required' } as ErrorResponse);
      return;
    }

    try {
      const result: ToolResponse = {
        result: {
          success: true,
          tool: toolRequest.name,
          output: `Executed ${toolRequest.name}`,
        },
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Tool execution failed',
      } as ErrorResponse);
    }
  });

  router.get('/list', (_req: express.Request, res: express.Response) => {
    res.json({
      tools: [
        { name: 'bash', description: 'Execute shell commands' },
        { name: 'read', description: 'Read files' },
        { name: 'write', description: 'Write files' },
        { name: 'edit', description: 'Edit files' },
        { name: 'glob', description: 'Find files by pattern' },
        { name: 'grep', description: 'Search file contents' },
      ],
    });
  });

  return router;
}
