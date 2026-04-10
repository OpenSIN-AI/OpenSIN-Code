/**
 * OpenSIN SDK - Channel Remote Control Router
 *
 * WHAT: This file contains the command router that turns normalized chat commands
 * into Remote Control API requests, plus a small HTTP client and an in-memory
 * chat/session binding store.
 *
 * WHY: Issue #1082 needs Telegram, Discord, and WhatsApp to control the same
 * background-agent runtime. The cleanest seam is: adapters normalize messages,
 * the router decides command behavior, and the API client speaks HTTP.
 *
 * WHY NOT let each adapter call the API directly: that would repeat command
 * validation, argument parsing, message formatting, and binding logic in every
 * platform implementation. The first platform might be easy; the third would be
 * a maintenance trap.
 *
 * CONSEQUENCES: command behavior stays consistent across all channels, bindings
 * are centralized, and the future Remote Control API surface can evolve behind a
 * single client abstraction.
 *
 * Branded: OpenSIN/sincode
 */

import type { BackgroundAgentStatus } from '../../background_agents/types.js'
import type {
  ChannelAdapter,
  ChannelCommandName,
  ParsedChannelCommand,
  ChannelPlatform,
} from './adapter.js'

/**
 * Request metadata recorded alongside a remote-control API call.
 *
 * WHAT: the minimum channel identity we want to pass downstream.
 * WHY: HTTP handlers may need audit context, channel-aware policy decisions, or
 * better logs without knowing the full transport payload schema.
 * CONSEQUENCES: downstream services can tell who asked for an action without
 * coupling themselves to Telegram/Discord/WhatsApp event objects.
 */
export interface RemoteControlRequester {
  platform: ChannelPlatform
  chatId: string
  senderId?: string
  senderName?: string
}

/**
 * A chat can be pinned to one remote-control session and can also remember the
 * most recently touched agent.
 *
 * WHAT: persistent command context for a specific platform+chat pair.
 * WHY: commands like `/status` or `/result` are much nicer when the user can omit
 * the agent id after a previous `/spawn` or explicit selection.
 * WHY NOT bind only the last agent id: the issue explicitly calls for chat ↔
 * agent session mapping, so we keep both the broader session id and the most
 * recent agent id.
 * CONSEQUENCES: users get concise commands, and notifications know where they
 * should be delivered.
 */
export interface ChannelSessionBinding {
  platform: ChannelPlatform
  chatId: string
  sessionId?: string
  activeAgentId?: string
  updatedAt: Date
}

/**
 * Storage abstraction for chat/session bindings.
 *
 * WHAT: a tiny repository-like contract.
 * WHY: the default in-memory implementation is enough for the SDK tests, but a
 * production deployment may want Redis, Postgres, or the Remote Control API
 * itself to own this state.
 * CONSEQUENCES: the router does not care where bindings live.
 */
export interface ChannelSessionBindingStore {
  get(platform: ChannelPlatform, chatId: string): Promise<ChannelSessionBinding | undefined>
  set(binding: ChannelSessionBinding): Promise<void>
  delete(platform: ChannelPlatform, chatId: string): Promise<void>
  listBySession(sessionId: string): Promise<ChannelSessionBinding[]>
  listByAgent(agentId: string): Promise<ChannelSessionBinding[]>
}

/**
 * Default in-memory binding store.
 *
 * WHAT: the simplest working store for tests, local development, and thin SDK
 * embeddings.
 * WHY: we need a no-dependency implementation today.
 * WHY NOT ship a database dependency right now: that would expand scope beyond
 * the channel abstraction requested by the issue.
 * CONSEQUENCES: bindings disappear on process restart, which is acceptable for
 * the SDK layer until a higher-level service wants persistence.
 */
export class InMemoryChannelSessionBindingStore
  implements ChannelSessionBindingStore
{
  /**
   * One key per platform+chat pair keeps lookups deterministic and avoids cross-
   * platform collisions when the same numeric chat id exists in multiple systems.
   */
  private readonly bindings = new Map<string, ChannelSessionBinding>()

  async get(
    platform: ChannelPlatform,
    chatId: string,
  ): Promise<ChannelSessionBinding | undefined> {
    return this.bindings.get(this.buildKey(platform, chatId))
  }

  async set(binding: ChannelSessionBinding): Promise<void> {
    this.bindings.set(this.buildKey(binding.platform, binding.chatId), binding)
  }

  async delete(platform: ChannelPlatform, chatId: string): Promise<void> {
    this.bindings.delete(this.buildKey(platform, chatId))
  }

  async listBySession(sessionId: string): Promise<ChannelSessionBinding[]> {
    return [...this.bindings.values()].filter(
      (binding) => binding.sessionId === sessionId,
    )
  }

  async listByAgent(agentId: string): Promise<ChannelSessionBinding[]> {
    return [...this.bindings.values()].filter(
      (binding) => binding.activeAgentId === agentId,
    )
  }

  private buildKey(platform: ChannelPlatform, chatId: string): string {
    return `${platform}:${chatId}`
  }
}

/**
 * The router only depends on the operations that the future Remote Control API
 * promises to expose.
 *
 * WHAT: a transport-agnostic client contract.
 * WHY: tests can inject a fake implementation while production code can inject an
 * HTTP-backed implementation.
 * CONSEQUENCES: adapter tests stay fast and deterministic.
 */
export interface RemoteControlApi {
  spawn(request: RemoteControlSpawnRequest): Promise<RemoteControlSpawnResponse>
  listAgents(request: RemoteControlListRequest): Promise<RemoteControlAgentSummary[]>
  getStatus(agentId: string): Promise<RemoteControlAgentStatusResponse>
  kill(agentId: string): Promise<RemoteControlDecisionResponse>
  getResult(agentId: string): Promise<RemoteControlResultResponse>
  approve(agentId: string): Promise<RemoteControlDecisionResponse>
  reject(agentId: string): Promise<RemoteControlDecisionResponse>
}

/**
 * Spawn requests optionally carry a prior session binding so the backend can keep
 * related work grouped inside one chat context when that behavior is supported.
 */
export interface RemoteControlSpawnRequest {
  prompt: string
  sessionId?: string
  agent?: string
  requestedBy: RemoteControlRequester
}

/**
 * The spawn response includes the new agent id and may also return a canonical
 * session id when the API owns session creation.
 */
export interface RemoteControlSpawnResponse {
  agentId: string
  status: BackgroundAgentStatus
  sessionId?: string
  message?: string
}

/**
 * List requests are session-aware because the issue describes session-scoped chat
 * control rather than a global admin console.
 */
export interface RemoteControlListRequest {
  sessionId?: string
  requestedBy: RemoteControlRequester
}

/**
 * Agent summaries back the `/agents` command.
 */
export interface RemoteControlAgentSummary {
  id: string
  status: BackgroundAgentStatus
  title?: string
  description?: string
  agent?: string
  prompt?: string
  unread?: boolean
  createdAt?: string
  completedAt?: string
}

/**
 * Status responses expose both lifecycle state and optional human-readable
 * progress text.
 */
export interface RemoteControlAgentStatusResponse {
  agentId: string
  status: BackgroundAgentStatus
  title?: string
  description?: string
  progressMessage?: string
  updatedAt?: string
  sessionId?: string
}

/**
 * Result responses back the `/result` command.
 */
export interface RemoteControlResultResponse {
  agentId: string
  status: BackgroundAgentStatus
  result: string
  truncated?: boolean
}

/**
 * A shared response shape is enough for kill/approve/reject because those actions
 * mainly need a resulting status plus an optional message.
 */
export interface RemoteControlDecisionResponse {
  agentId: string
  status: BackgroundAgentStatus
  message?: string
}

/**
 * Endpoint resolvers isolate URL construction from the client logic.
 *
 * WHAT: a configurable map of REST path builders.
 * WHY: Issue #1080 defines the API conceptually, but exact route names may still
 * evolve. Centralizing path generation keeps that future change local.
 * CONSEQUENCES: the HTTP client can be reused even if route paths change.
 */
export interface RemoteControlEndpointResolver {
  spawn(): string
  listAgents(): string
  getStatus(agentId: string): string
  kill(agentId: string): string
  getResult(agentId: string): string
  approve(agentId: string): string
  reject(agentId: string): string
}

/**
 * We keep the fetch dependency injectable for tests and non-standard runtimes.
 */
export type RemoteControlFetch = typeof fetch

/**
 * Options for the HTTP-backed API client.
 */
export interface HttpRemoteControlApiClientOptions {
  baseUrl: string
  fetchImpl?: RemoteControlFetch
  headers?: Record<string, string>
  endpoints?: Partial<RemoteControlEndpointResolver>
}

/**
 * Default REST path resolver.
 *
 * WHAT: the best current guess for the Issue #1080 HTTP surface.
 * WHY: giving callers sensible defaults removes boilerplate.
 * WHY NOT hard-code these strings inside every method: endpoint behavior belongs
 * in one easily overridable location.
 * CONSEQUENCES: deployments with different route naming can override individual
 * methods instead of replacing the entire client.
 */
export function createDefaultRemoteControlEndpoints(): RemoteControlEndpointResolver {
  return {
    spawn: () => '/agents',
    listAgents: () => '/agents',
    getStatus: (agentId) => `/agents/${encodeURIComponent(agentId)}`,
    kill: (agentId) => `/agents/${encodeURIComponent(agentId)}`,
    getResult: (agentId) => `/agents/${encodeURIComponent(agentId)}/result`,
    approve: (agentId) => `/agents/${encodeURIComponent(agentId)}/approve`,
    reject: (agentId) => `/agents/${encodeURIComponent(agentId)}/reject`,
  }
}

/**
 * HTTP implementation of the RemoteControlApi contract.
 *
 * WHAT: a small JSON client that the command router can use today.
 * WHY: the issue explicitly says the channel layer should call the Remote Control
 * API, so we provide the missing client seam here instead of leaving only an
 * abstract interface.
 * WHY NOT embed fetch calls directly in the router: routing and transport are two
 * separate responsibilities and should be testable independently.
 * CONSEQUENCES: command tests can mock the API contract, while integration code
 * can use this client against the real HTTP service.
 */
export class HttpRemoteControlApiClient implements RemoteControlApi {
  private readonly baseUrl: URL
  private readonly fetchImpl: RemoteControlFetch
  private readonly headers: Record<string, string>
  private readonly endpoints: RemoteControlEndpointResolver

  constructor(options: HttpRemoteControlApiClientOptions) {
    this.baseUrl = new URL(options.baseUrl)
    this.fetchImpl = options.fetchImpl ?? getDefaultFetch()
    this.headers = {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    }
    this.endpoints = {
      ...createDefaultRemoteControlEndpoints(),
      ...(options.endpoints ?? {}),
    }
  }

  async spawn(
    request: RemoteControlSpawnRequest,
  ): Promise<RemoteControlSpawnResponse> {
    return this.request<RemoteControlSpawnResponse>(
      'POST',
      this.endpoints.spawn(),
      request,
    )
  }

  async listAgents(
    request: RemoteControlListRequest,
  ): Promise<RemoteControlAgentSummary[]> {
    const url = new URL(this.endpoints.listAgents(), this.baseUrl)
    if (request.sessionId) {
      url.searchParams.set('sessionId', request.sessionId)
    }
    url.searchParams.set('platform', request.requestedBy.platform)
    url.searchParams.set('chatId', request.requestedBy.chatId)

    return this.requestWithUrl<RemoteControlAgentSummary[]>('GET', url)
  }

  async getStatus(
    agentId: string,
  ): Promise<RemoteControlAgentStatusResponse> {
    return this.request<RemoteControlAgentStatusResponse>(
      'GET',
      this.endpoints.getStatus(agentId),
    )
  }

  async kill(agentId: string): Promise<RemoteControlDecisionResponse> {
    return this.request<RemoteControlDecisionResponse>(
      'DELETE',
      this.endpoints.kill(agentId),
    )
  }

  async getResult(agentId: string): Promise<RemoteControlResultResponse> {
    return this.request<RemoteControlResultResponse>(
      'GET',
      this.endpoints.getResult(agentId),
    )
  }

  async approve(agentId: string): Promise<RemoteControlDecisionResponse> {
    return this.request<RemoteControlDecisionResponse>(
      'POST',
      this.endpoints.approve(agentId),
    )
  }

  async reject(agentId: string): Promise<RemoteControlDecisionResponse> {
    return this.request<RemoteControlDecisionResponse>(
      'POST',
      this.endpoints.reject(agentId),
    )
  }

  /**
   * Shared JSON request helper.
   *
   * WHAT: all HTTP requests funnel through one code path.
   * WHY: error handling and JSON decoding must behave the same for every command.
   * CONSEQUENCES: API failures are surfaced with useful status information instead
   * of platform-specific silent failures.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)
    return this.requestWithUrl<T>(method, url, body)
  }

  private async requestWithUrl<T>(
    method: string,
    url: URL,
    body?: unknown,
  ): Promise<T> {
    const response = await this.fetchImpl(url, {
      method,
      headers: this.headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Remote Control API request failed (${response.status} ${response.statusText}): ${errorText}`,
      )
    }

    return (await response.json()) as T
  }
}

/**
 * Router options expose exactly the customization points that matter today.
 */
export interface ChannelCommandRouterOptions {
  bindings?: ChannelSessionBindingStore
  defaultAgent?: string
}

/**
 * ChannelCommandRouter owns the command UX for all platforms.
 *
 * WHAT: the central dispatcher from parsed slash commands to Remote Control API
 * actions and formatted chat responses.
 * WHY: the same command should produce the same behavior everywhere.
 * WHY NOT let the backend return channel-ready prose: the SDK layer still needs
 * to inject binding context and fallback errors before/after transport calls.
 * CONSEQUENCES: wording can stay coherent across transports while the backend
 * remains focused on machine-oriented API responses.
 */
export class ChannelCommandRouter {
  private readonly bindings: ChannelSessionBindingStore
  private readonly defaultAgent?: string

  constructor(
    private readonly api: RemoteControlApi,
    options: ChannelCommandRouterOptions = {},
  ) {
    this.bindings = options.bindings ?? new InMemoryChannelSessionBindingStore()
    this.defaultAgent = options.defaultAgent
  }

  /**
   * Bind an adapter to this router.
   *
   * WHAT: register the adapter callback once.
   * WHY: adapters should not need to know router internals.
   */
  bindAdapter(adapter: ChannelAdapter): void {
    adapter.onCommand(async (command) => {
      await this.handleCommand(adapter, command)
    })
  }

  /**
   * Public entry point used by adapters and tests.
   */
  async handleCommand(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    switch (command.command) {
      case 'spawn':
        await this.handleSpawn(adapter, command)
        return
      case 'agents':
        await this.handleAgents(adapter, command)
        return
      case 'status':
        await this.handleStatus(adapter, command)
        return
      case 'kill':
        await this.handleKill(adapter, command)
        return
      case 'result':
        await this.handleResult(adapter, command)
        return
      case 'approve':
        await this.handleApprove(adapter, command)
        return
      case 'reject':
        await this.handleReject(adapter, command)
        return
      default:
        await adapter.sendMessage(
          command.chatId,
          `Unsupported command: /${this.getCommandName(command.command)}`,
        )
    }
  }

  /**
   * Expose bindings to the notification service without making it reach into
   * private router state.
   */
  getBindingStore(): ChannelSessionBindingStore {
    return this.bindings
  }

  /**
   * Explicit binding helper for tests, notifications, or future admin flows.
   */
  async bindChat(binding: ChannelSessionBinding): Promise<void> {
    await this.bindings.set(binding)
  }

  private async handleSpawn(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    if (!command.args.trim()) {
      await adapter.sendMessage(
        command.chatId,
        'Usage: /spawn <prompt>',
      )
      return
    }

    const binding = await this.bindings.get(command.platform, command.chatId)
    const response = await this.api.spawn({
      prompt: command.args,
      sessionId: binding?.sessionId,
      agent: this.defaultAgent,
      requestedBy: this.buildRequester(command),
    })

    await this.bindings.set({
      platform: command.platform,
      chatId: command.chatId,
      sessionId: response.sessionId ?? binding?.sessionId,
      activeAgentId: response.agentId,
      updatedAt: new Date(),
    })

    await adapter.sendMessage(
      command.chatId,
      [
        `Spawned OpenSIN agent ${response.agentId}.`,
        `Status: ${response.status}.`,
        response.sessionId ? `Session: ${response.sessionId}.` : undefined,
        response.message,
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  private async handleAgents(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    const binding = await this.bindings.get(command.platform, command.chatId)
    const agents = await this.api.listAgents({
      sessionId: binding?.sessionId,
      requestedBy: this.buildRequester(command),
    })

    if (agents.length === 0) {
      await adapter.sendMessage(
        command.chatId,
        binding?.sessionId
          ? `No agents found for session ${binding.sessionId}.`
          : 'No agents found for this chat yet. Use /spawn <prompt> to start one.',
      )
      return
    }

    const lines = agents.map((agent) => {
      const unreadSuffix = agent.unread ? ' [unread]' : ''
      const titleSuffix = agent.title ? ` — ${agent.title}` : ''
      return `- ${agent.id}: ${agent.status}${unreadSuffix}${titleSuffix}`
    })

    await adapter.sendMessage(
      command.chatId,
      ['OpenSIN agents:', ...lines].join('\n'),
    )
  }

  private async handleStatus(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    const agentId = await this.resolveAgentId(command)
    if (!agentId) {
      await adapter.sendMessage(
        command.chatId,
        'Usage: /status <id> (or run /spawn first to bind this chat).',
      )
      return
    }

    const response = await this.api.getStatus(agentId)
    await this.touchActiveAgent(command, response.agentId, response.sessionId)

    await adapter.sendMessage(
      command.chatId,
      [
        `Agent ${response.agentId}`,
        `Status: ${response.status}`,
        response.title ? `Title: ${response.title}` : undefined,
        response.description ? `Description: ${response.description}` : undefined,
        response.progressMessage
          ? `Progress: ${response.progressMessage}`
          : undefined,
        response.updatedAt ? `Updated: ${response.updatedAt}` : undefined,
      ]
        .filter(Boolean)
        .join('\n'),
    )
  }

  private async handleKill(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    const agentId = await this.resolveAgentId(command)
    if (!agentId) {
      await adapter.sendMessage(
        command.chatId,
        'Usage: /kill <id> (or bind the chat to an agent first).',
      )
      return
    }

    const response = await this.api.kill(agentId)
    await this.touchActiveAgent(command, response.agentId)

    await adapter.sendMessage(
      command.chatId,
      [
        `Kill request processed for ${response.agentId}.`,
        `Status: ${response.status}.`,
        response.message,
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  private async handleResult(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    const agentId = await this.resolveAgentId(command)
    if (!agentId) {
      await adapter.sendMessage(
        command.chatId,
        'Usage: /result <id> (or run /spawn first to bind this chat).',
      )
      return
    }

    const response = await this.api.getResult(agentId)
    await this.touchActiveAgent(command, response.agentId)

    await adapter.sendMessage(
      command.chatId,
      [
        `Result for ${response.agentId} (${response.status})`,
        response.result,
        response.truncated
          ? '[Result was truncated by the Remote Control API.]'
          : undefined,
      ]
        .filter(Boolean)
        .join('\n\n'),
    )
  }

  private async handleApprove(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    await this.handleDecision(adapter, command, 'approve')
  }

  private async handleReject(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
  ): Promise<void> {
    await this.handleDecision(adapter, command, 'reject')
  }

  private async handleDecision(
    adapter: ChannelAdapter,
    command: ParsedChannelCommand,
    decision: 'approve' | 'reject',
  ): Promise<void> {
    const agentId = await this.resolveAgentId(command)
    if (!agentId) {
      await adapter.sendMessage(
        command.chatId,
        `Usage: /${decision} <id> (or bind the chat to an agent first).`,
      )
      return
    }

    const response =
      decision === 'approve'
        ? await this.api.approve(agentId)
        : await this.api.reject(agentId)

    await this.touchActiveAgent(command, response.agentId)

    const actionLabel = decision === 'approve' ? 'Approval' : 'Rejection'
    await adapter.sendMessage(
      command.chatId,
      [
        `${actionLabel} recorded for ${response.agentId}.`,
        `Status: ${response.status}.`,
        response.message,
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  /**
   * Resolve the target agent id from the explicit command argument first and only
   * then fall back to the active chat binding.
   *
   * WHY: explicit user intent should always beat remembered context.
   */
  private async resolveAgentId(
    command: ParsedChannelCommand,
  ): Promise<string | undefined> {
    const explicitId = this.extractFirstToken(command.args)
    if (explicitId) {
      return explicitId
    }

    const binding = await this.bindings.get(command.platform, command.chatId)
    return binding?.activeAgentId
  }

  /**
   * Update the remembered chat binding after a command touches an agent.
   */
  private async touchActiveAgent(
    command: ParsedChannelCommand,
    agentId: string,
    sessionId?: string,
  ): Promise<void> {
    const previous = await this.bindings.get(command.platform, command.chatId)
    await this.bindings.set({
      platform: command.platform,
      chatId: command.chatId,
      sessionId: sessionId ?? previous?.sessionId,
      activeAgentId: agentId,
      updatedAt: new Date(),
    })
  }

  private extractFirstToken(value: string): string | undefined {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }

    const [firstToken] = trimmed.split(/\s+/, 1)
    return firstToken || undefined
  }

  private buildRequester(command: ParsedChannelCommand): RemoteControlRequester {
    return {
      platform: command.platform,
      chatId: command.chatId,
      senderId: command.senderId,
      senderName: command.senderName,
    }
  }

  /**
   * This helper exists solely to keep the default switch branch exhaustively tied
   * to the command union while still returning a string.
   */
  private getCommandName(command: ChannelCommandName): string {
    return command
  }
}

/**
 * Resolve the runtime fetch implementation safely.
 *
 * WHY: some test environments may not expose fetch globally unless Vitest is
 * configured to do so, so we fail loudly with a precise error.
 */
function getDefaultFetch(): RemoteControlFetch {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      'A fetch implementation is required for HttpRemoteControlApiClient.',
    )
  }

  return globalThis.fetch.bind(globalThis)
}
