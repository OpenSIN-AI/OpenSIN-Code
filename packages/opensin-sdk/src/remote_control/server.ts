/**
 * OpenSIN SDK - Remote Control Server
 *
 * This server is the thin HTTP/WebSocket façade requested by Issue #1080.
 * It is intentionally small: transport concerns live here, while agent lifecycle
 * stays inside BackgroundAgentManager so we reuse the existing execution model.
 *
 * NOTE FOR FOLLOW-UP WORK:
 * - REST routes will be registered from ./routes/agents and ./routes/health.
 * - Auth will be applied via ./middleware/auth using the existing SinApiClient patterns.
 * - Error shaping will be centralized via ./middleware/error so every failure returns
 *   the same structured JSON contract.
 * - SSE and WebSocket fan-out will be added here because they are transport-specific.
 */

import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import type { WebSocketServer } from 'ws'

import { BackgroundAgentManager } from '../background_agents/manager.js'

/**
 * Remote control server options stay deliberately narrow so callers can either
 * pass a ready manager instance or let the server own one for simple setups.
 */
export interface RemoteControlServerOptions {
  manager?: BackgroundAgentManager
  fastify?: FastifyServerOptions
}

/**
 * The runtime state groups the transport pieces that need to be shared across
 * route registration, SSE broadcasting, and WebSocket lifecycle management.
 */
export interface RemoteControlServer {
  app: FastifyInstance
  manager: BackgroundAgentManager
  websocket?: WebSocketServer
  dispose: () => Promise<void>
}

/**
 * Create the Fastify wrapper around BackgroundAgentManager.
 *
 * This is intentionally only the first implementation slice for the issue: it
 * establishes the server shell so route, auth, SSE, and WebSocket work can land
 * incrementally without having to redesign construction later.
 */
export async function createRemoteControlServer(
  options: RemoteControlServerOptions = {},
): Promise<RemoteControlServer> {
  const app = Fastify({
    logger: false,
    ...(options.fastify ?? {}),
  })

  const manager = options.manager ?? new BackgroundAgentManager()

  /**
   * The dispose path must always tear down both the HTTP façade and the manager,
   * because the manager owns timeouts/background bookkeeping that should never
   * leak after the transport shuts down.
   */
  const dispose = async (): Promise<void> => {
    await app.close()
    manager.dispose()
  }

  return {
    app,
    manager,
    websocket: undefined,
    dispose,
  }
}
