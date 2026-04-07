import { A2ATaskPayload, A2ATaskResponse, A2AHealthCheck } from './types';

export class A2AClient {
  private fleetToken: string;

  constructor(token?: string) {
    this.fleetToken = token || process.env.A2A_FLEET_TOKEN || '';
    if (!this.fleetToken) {
      console.warn('[A2A Client] Warning: Running without A2A_FLEET_TOKEN. Cross-agent calls may be rejected.');
    }
  }

  /**
   * Dispatches a task to a target agent via the A2A Protocol
   */
  async dispatchTask(targetUrl: string, payload: A2ATaskPayload): Promise<A2ATaskResponse> {
    try {
      const response = await fetch(`${targetUrl.replace(/\/$/, '')}/a2a/v1/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.fleetToken}`,
          'X-OpenSIN-Requester': payload.requesterId
        },
        body: JSON.stringify(payload),
        // Signal fetch timeout (node >= 18)
        signal: payload.timeoutMs ? AbortSignal.timeout(payload.timeoutMs) : undefined
      });

      if (!response.ok) {
        let errorMsg = `${response.status} ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody && typeof errBody === 'object' && 'error' in errBody) {
            errorMsg = (errBody as any).error;
          }
        } catch {}
        throw new Error(errorMsg);
      }

      return (await response.json()) as A2ATaskResponse;
    } catch (error: any) {
      return {
        taskId: payload.taskId,
        status: 'failed',
        error: error.message || 'Unknown network error'
      };
    }
  }

  /**
   * Pings an agent to check if it's alive and ready for tasks
   */
  async pingHealth(targetUrl: string): Promise<A2AHealthCheck | null> {
    try {
      const response = await fetch(`${targetUrl.replace(/\/$/, '')}/a2a/v1/health`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.fleetToken}` }
      });
      
      if (!response.ok) return null;
      return (await response.json()) as A2AHealthCheck;
    } catch {
      return null;
    }
  }
}
