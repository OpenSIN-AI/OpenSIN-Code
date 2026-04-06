import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { A2ATaskPayload, A2ATaskResponse, A2AHealthCheck } from './types';

type TaskHandler = (payload: A2ATaskPayload) => Promise<A2ATaskResponse>;

export class A2AServer {
  private port: number;
  private agentId: string;
  private expectedToken: string;
  private activeTasks: number = 0;
  private startTime: number;
  private taskHandler?: TaskHandler;

  constructor(config: { port?: number; agentId: string; expectedToken?: string }) {
    this.port = config.port || parseInt(process.env.PORT || '3000', 10);
    this.agentId = config.agentId;
    this.expectedToken = config.expectedToken || process.env.A2A_FLEET_TOKEN || '';
    this.startTime = Date.now();
  }

  public onTask(handler: TaskHandler) {
    this.taskHandler = handler;
  }

  public start(): void {
    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS & Preflight
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-OpenSIN-Requester');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Security Gate: Token Verification
      if (this.expectedToken) {
        const authHeader = req.headers['authorization'];
        if (!authHeader || authHeader !== `Bearer ${this.expectedToken}`) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized: Invalid A2A Token' }));
          return;
        }
      }

      // Route: /a2a/v1/health
      if (req.method === 'GET' && req.url === '/a2a/v1/health') {
        const health: A2AHealthCheck = {
          status: 'alive',
          agentId: this.agentId,
          version: '1.0.0',
          activeTasks: this.activeTasks,
          uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health));
        return;
      }

      // Route: /a2a/v1/task
      if (req.method === 'POST' && req.url === '/a2a/v1/task') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body) as A2ATaskPayload;
            
            if (!this.taskHandler) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'rejected', error: 'No task handler configured' }));
              return;
            }

            this.activeTasks++;
            
            // Send 202 Accepted immediately if it's a long-running task protocol
            // For simplicity here, we await the handler (Synchronous RPC)
            const result = await this.taskHandler(payload);
            
            this.activeTasks--;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
            
          } catch (error: any) {
            this.activeTasks--;
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'failed', error: error.message }));
          }
        });
        return;
      }

      // Not Found
      res.writeHead(404);
      res.end();
    });

    server.listen(this.port, () => {
      console.log(`[A2A Server] Agent ${this.agentId} listening on port ${this.port}`);
    });
  }
}
