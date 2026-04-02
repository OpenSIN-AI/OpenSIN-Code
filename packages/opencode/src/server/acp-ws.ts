import { Hono } from "hono"
import { websocket } from "hono/bun"
import { describeRoute, resolver, validator } from "hono-openapi"
import z from "zod"
import { Log } from "../util/log"
import { errors } from "./error"

const log = Log.create({ service: "acp-ws" })

interface AcpSession {
  id: string
  cwd: string
  initialized: boolean
}

const sessions = new Map<string, AcpSession>()

export function AcpWebSocket() {
  const app = new Hono()

  app.get(
    "/",
    describeRoute({
      summary: "ACP WebSocket endpoint",
      description: "WebSocket endpoint for the Agent Communication Protocol (ACP). IDE clients connect here to communicate with OpenSIN.",
      operationId: "acp.websocket",
      responses: {
        101: {
          description: "WebSocket upgrade successful",
        },
        ...errors(400),
      },
    }),
    websocket((ws, c) => {
      let sessionId: string | undefined

      ws.on("message", async (raw) => {
        let msg: { jsonrpc?: string; id?: number | string; method?: string; params?: Record<string, unknown> }
        try {
          msg = JSON.parse(raw.toString())
        } catch {
          ws.send(JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          }))
          return
        }

        if (msg.jsonrpc !== "2.0") {
          ws.send(JSON.stringify({
            jsonrpc: "2.0",
            id: msg.id ?? null,
            error: { code: -32600, message: "Invalid Request" },
          }))
          return
        }

        switch (msg.method) {
          case "initialize": {
            sessionId = crypto.randomUUID()
            const cwd = (msg.params as any)?.cwd ?? "."
            sessions.set(sessionId, { id: sessionId, cwd, initialized: true })

            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              result: {
                protocolVersion: "1.0.0",
                serverInfo: { name: "opensin-server", version: "0.1.0" },
                agentCapabilities: {
                  sessionCapabilities: { resume: true, modes: true },
                  tools: true,
                  diffs: true,
                },
              },
            }))
            log.info("acp initialized", { sessionId, cwd })
            break
          }

          case "shutdown": {
            if (sessionId) {
              sessions.delete(sessionId)
            }
            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              result: { ok: true },
            }))
            ws.close()
            break
          }

          case "session/new": {
            const newId = crypto.randomUUID()
            const dir = (msg.params as any)?.cwd ?? "."
            sessions.set(newId, { id: newId, cwd: dir, initialized: true })
            sessionId = newId

            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              result: { sessionId: newId, modes: [] },
            }))
            log.info("acp session created", { sessionId: newId })
            break
          }

          case "session/load": {
            const loadId = (msg.params as any)?.sessionId
            if (loadId && sessions.has(loadId)) {
              sessionId = loadId
              ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                result: { sessionId: loadId, modes: [] },
              }))
            } else {
              ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                error: { code: -32602, message: "Session not found" },
              }))
            }
            break
          }

          case "session/chat": {
            const chatSession = (msg.params as any)?.sessionId
            if (!chatSession || !sessions.has(chatSession)) {
              ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id: msg.id,
                error: { code: -32602, message: "Invalid session" },
              }))
              break
            }
            // Forward to internal session prompt — stub for now
            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              result: { reply: "", toolCalls: [] },
            }))
            break
          }

          case "session/cancel": {
            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              result: { ok: true },
            }))
            break
          }

          default:
            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id ?? null,
              error: { code: -32601, message: `Method not found: ${msg.method}` },
            }))
        }
      })

      ws.on("close", () => {
        if (sessionId) {
          sessions.delete(sessionId)
          log.info("acp session closed", { sessionId })
        }
      })

      ws.on("error", (err) => {
        log.error("acp websocket error", { error: err })
      })
    }),
  )

  return app
}
