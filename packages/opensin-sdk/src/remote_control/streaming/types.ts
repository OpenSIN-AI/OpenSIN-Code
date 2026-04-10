/**
 * OpenSIN SDK - Remote Control Progress Streaming Types
 *
 * WHAT: This file defines the canonical event vocabulary for real-time agent
 * progress streaming.
 *
 * WHY: Issue #1083 requires SSE and WebSocket transports to expose one shared,
 * typed event contract. If each transport invented its own payload shape, every
 * dashboard, bot, and workflow consumer would need transport-specific parsing.
 *
 * WHY NOT place these types inside `sse.ts` or `websocket.ts`: the event model is
 * not transport-specific. Keeping the types in a dedicated file lets the event
 * bus, the background agent manager, SSE, WebSocket, and tests all depend on the
 * exact same source of truth.
 *
 * WHAT DEPENDS ON THIS: the in-process event bus, SSE serializer, WebSocket
 * message codec, background-agent lifecycle integration, and every future remote
 * control consumer that subscribes to live progress.
 *
 * CONSEQUENCES: changing any union member or payload contract here is an API
 * change for the whole streaming subsystem, so the names stay explicit and the
 * comments stay exhaustive on purpose.
 *
 * Branded: OpenSIN/sincode
 */

/**
 * WHAT: the full set of lifecycle and progress event names requested by the
 * issue.
 *
 * WHY: a string-literal union gives compile-time protection against typos while
 * still serializing cleanly over HTTP and WebSocket.
 *
 * WHY NOT use a free-form `string`: a loose string would allow accidental event
 * names like `agent:start` or `agent:toolcall` to pass type-checking and break
 * downstream filters silently.
 *
 * CONSEQUENCES: every emitter and subscriber must intentionally choose one of the
 * approved event names below.
 */
export type AgentEventType =
  | 'agent:spawned'
  | 'agent:started'
  | 'agent:progress'
  | 'agent:heartbeat'
  | 'agent:tool_call'
  | 'agent:tool_result'
  | 'agent:completed'
  | 'agent:error'
  | 'agent:cancelled'
  | 'agent:timeout'

/**
 * WHAT: the canonical event envelope for one emitted background-agent update.
 *
 * WHY: every transport needs the same stable top-level fields: event type, agent
 * identity, event time, and an extensible `data` bag for event-specific details.
 *
 * WHY NOT create a separate interface per event right now: the issue explicitly
 * specifies one generic envelope with `Record<string, unknown>` payloads. That is
 * the smallest change that unlocks streaming without over-designing a full event
 * schema registry in this sprint.
 *
 * CONSEQUENCES: callers get consistent framing, while event-specific payload
 * validation can evolve later without breaking the outer contract.
 */
export interface AgentEvent {
  type: AgentEventType
  agentId: string
  timestamp: Date
  data: Record<string, unknown>
}

/**
 * WHAT: a short alias used by transports and the event bus.
 *
 * WHY: some files read more naturally with `Event` than `AgentEvent`, especially
 * in generic queue, replay, and filtering helpers.
 *
 * WHY NOT invent a different shape for `Event`: doing so would create two nearly
 * identical concepts and invite drift for no gain.
 *
 * CONSEQUENCES: `Event` and `AgentEvent` are intentionally the same contract.
 */
export type Event = AgentEvent
