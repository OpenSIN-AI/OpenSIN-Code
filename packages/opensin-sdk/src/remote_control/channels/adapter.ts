/**
 * OpenSIN SDK - Channel Remote Control Adapter Contract
 *
 * WHAT: This file defines the shared contract that every chat platform adapter
 * must obey before it can participate in remote agent control.
 *
 * WHY: Issue #1082 needs Telegram, Discord, and WhatsApp to look identical to
 * the command router. Without one shared contract, every platform would invent
 * slightly different message shapes, error handling, and command parsing rules.
 * That would make the router brittle and force feature work to be repeated three
 * times.
 *
 * WHY NOT platform-specific contracts only: platform-specific contracts would be
 * simpler for the very first adapter, but they would immediately create drift.
 * The router would need Telegram-only branches, Discord-only branches, and
 * WhatsApp-only branches for every new command. That is exactly the coupling we
 * want to avoid.
 *
 * CONSEQUENCES: all adapters normalize inbound events into the same command
 * payload, and all outbound notifications flow through the same sendMessage()
 * shape. This keeps the future HTTP Remote Control API integration transport-
 * agnostic and much easier to test.
 *
 * Branded: OpenSIN/sincode
 */

/**
 * The supported channel names are kept explicit instead of using `string`.
 *
 * WHAT: This narrows platform values to the set required by the issue.
 * WHY: explicit unions catch typos such as `telegramm` during compile time.
 * WHY NOT a free-form string: a free-form string would let broken adapter names
 * silently flow into bindings, metrics, and logs.
 * CONSEQUENCES: adding a new platform later becomes an intentional API change.
 */
export type ChannelPlatform = 'telegram' | 'discord' | 'whatsapp'

/**
 * The command names are centralized so parsing, routing, tests, and notifications
 * all refer to the same vocabulary.
 *
 * WHAT: the canonical command list from Issue #1082.
 * WHY: command spelling needs one source of truth.
 * WHY NOT infer commands from strings everywhere: duplicated string literals are
 * easy to mistype and hard to refactor safely.
 * CONSEQUENCES: unsupported commands can be rejected deterministically.
 */
export const CHANNEL_COMMANDS = [
  'spawn',
  'agents',
  'status',
  'kill',
  'result',
  'approve',
  'reject',
] as const

/**
 * Narrow command names to the entries in CHANNEL_COMMANDS.
 */
export type ChannelCommandName = (typeof CHANNEL_COMMANDS)[number]

/**
 * Convert the readonly command tuple into a Set once so membership checks stay
 * cheap and consistent.
 *
 * WHAT: a tiny lookup helper used by command parsing.
 * WHY: parsing runs for every inbound chat message, so a Set keeps the check
 * straightforward and avoids repeated tuple scans.
 * CONSEQUENCES: command validation stays O(1) and readable.
 */
const CHANNEL_COMMAND_SET = new Set<string>(CHANNEL_COMMANDS)

/**
 * Raw inbound chat messages often contain transport metadata that the router does
 * not need, but adapters still need access to it while normalizing commands.
 *
 * WHAT: the lowest-level inbound message shape that platform transports hand to
 * adapters.
 * WHY: we want a consistent adapter surface even though Telegram, Discord, and
 * WhatsApp expose different payload formats.
 * WHY NOT use platform SDK event objects directly in the router: doing so would
 * leak vendor concerns upward and make unit tests unnecessarily heavy.
 * CONSEQUENCES: transports can stash vendor data in `metadata` without forcing
 * the router to understand it.
 */
export interface ChannelInboundMessage {
  platform: ChannelPlatform
  chatId: string
  senderId?: string
  senderName?: string
  text: string
  metadata?: Record<string, unknown>
}

/**
 * Parsed commands are the normalized unit that the command router consumes.
 *
 * WHAT: one object representing a validated slash-style command.
 * WHY: parsing once inside adapters prevents the router from re-implementing the
 * same string slicing logic for every platform.
 * WHY NOT keep only the original string: the router would then need to parse on
 * every code path and duplicate validation logic.
 * CONSEQUENCES: commands and arguments arrive already structured, but the raw
 * original message is preserved for auditing and debugging.
 */
export interface ParsedChannelCommand {
  platform: ChannelPlatform
  chatId: string
  senderId?: string
  senderName?: string
  command: ChannelCommandName
  args: string
  rawText: string
  metadata?: Record<string, unknown>
}

/**
 * Outbound messages stay intentionally text-first.
 *
 * WHAT: a minimal response envelope the router and notification service can send.
 * WHY: the issue only requires text-based remote control today.
 * WHY NOT embed platform-native rich cards already: rich payloads differ wildly
 * across transports and would slow down the initial integration.
 * CONSEQUENCES: richer formatting can be added later without breaking the basic
 * sendMessage() contract because adapters can ignore optional metadata.
 */
export interface ChannelOutboundMessage {
  text: string
  metadata?: Record<string, unknown>
}

/**
 * The command callback signature that adapters expose to the router.
 *
 * WHAT: one async handler invoked whenever a supported command arrives.
 * WHY: async is mandatory because command routing eventually calls remote HTTP
 * endpoints and may need to send follow-up responses.
 * CONSEQUENCES: adapters can await router work before acknowledging platform-
 * specific delivery if needed.
 */
export type ChannelCommandHandler = (
  command: ParsedChannelCommand,
) => Promise<void>

/**
 * The ChannelAdapter interface is the stable seam between chat transports and the
 * remote-control business logic.
 *
 * WHAT: the smallest contract required by the issue.
 * WHY: the router only needs to send messages and subscribe to parsed commands.
 * WHY NOT add lifecycle methods here now: some adapters may not need explicit
 * start/stop hooks, so forcing them into the base contract would create empty
 * implementations without immediate value.
 * CONSEQUENCES: adapters stay lightweight, and optional lifecycle behavior can be
 * added in adapter-specific constructor dependencies when needed.
 */
export interface ChannelAdapter {
  platform: ChannelPlatform
  sendMessage(chatId: string, message: string): Promise<void>
  onCommand(handler: ChannelCommandHandler): void
}

/**
 * A tiny transport interface lets platform adapters delegate actual delivery to
 * whichever integration layer is available in the runtime.
 *
 * WHAT: a generic abstraction for the final hop into Telegram, Discord, or
 * WhatsApp tooling.
 * WHY: the repository should not hard-code one MCP, CLI, SDK, or HTTP library
 * per platform inside the adapter itself.
 * WHY NOT call shell commands directly from here: that would make tests slow,
 * create hidden environment coupling, and block future non-shell integrations.
 * CONSEQUENCES: runtime code can plug in MCP-backed, webhook-backed, or SDK-
 * backed transports without changing router logic.
 */
export interface ChannelTransport {
  send(chatId: string, message: ChannelOutboundMessage): Promise<void>
}

/**
 * Helper used by adapters to answer one narrow question: does the text start
 * with a valid slash command?
 *
 * WHAT: deterministic parser for `/command args` messages.
 * WHY: every platform in the issue uses the same slash-based UX.
 * WHY NOT permit free-form natural language here: natural language routing would
 * require a classifier or prompt-based parser, which is outside this sprint.
 * CONSEQUENCES: unsupported or malformed input returns null so adapters can ignore
 * ordinary chat noise without producing false command triggers.
 */
export function parseChannelCommand(
  message: ChannelInboundMessage,
): ParsedChannelCommand | null {
  const normalizedText = message.text.trim()
  if (!normalizedText.startsWith('/')) {
    return null
  }

  const firstWhitespace = normalizedText.search(/\s/)
  const rawCommand =
    firstWhitespace === -1
      ? normalizedText.slice(1)
      : normalizedText.slice(1, firstWhitespace)
  const command = rawCommand.toLowerCase()

  if (!CHANNEL_COMMAND_SET.has(command)) {
    return null
  }

  const args =
    firstWhitespace === -1 ? '' : normalizedText.slice(firstWhitespace + 1).trim()

  return {
    platform: message.platform,
    chatId: message.chatId,
    senderId: message.senderId,
    senderName: message.senderName,
    command: command as ChannelCommandName,
    args,
    rawText: message.text,
    metadata: message.metadata,
  }
}

/**
 * BaseChannelAdapter centralizes the boring but critical logic shared by every
 * platform implementation.
 *
 * WHAT: a reusable abstract class for transport delegation and command fan-out.
 * WHY: Telegram, Discord, and WhatsApp differ mostly at the transport edge. The
 * command parsing and handler registration logic should not be copy-pasted three
 * times.
 * WHY NOT use a mixin or utility functions only: a base class keeps the stateful
 * pieces (`handler`, `transport`, `platform`) together and easier to reason about.
 * CONSEQUENCES: concrete adapters stay tiny, while shared behavior remains tested
 * in one place.
 */
export abstract class BaseChannelAdapter implements ChannelAdapter {
  /**
   * The router registers exactly one command handler per adapter instance.
   *
   * WHY a single handler: one adapter should feed one command router pipeline.
   * Allowing multiple handlers would complicate ordering and duplicate responses.
   */
  private handler?: ChannelCommandHandler

  constructor(
    public readonly platform: ChannelPlatform,
    protected readonly transport: ChannelTransport,
  ) {}

  /**
   * Send a plain text message through the injected transport.
   *
   * WHAT: adapter-facing message send used by the router and notifications.
   * WHY: centralizing the text-to-envelope conversion keeps concrete adapters free
   * from duplicate wrapper code.
   */
  async sendMessage(chatId: string, message: string): Promise<void> {
    await this.transport.send(chatId, { text: message })
  }

  /**
   * Register the single router callback.
   */
  onCommand(handler: ChannelCommandHandler): void {
    this.handler = handler
  }

  /**
   * Concrete adapters call this when their platform-specific receive hook fires.
   *
   * WHAT: normalize inbound text and invoke the registered router callback only
   * for supported slash commands.
   * WHY: platform code should not need to understand command parsing details.
   * CONSEQUENCES: ordinary chat traffic is ignored by default, which prevents the
   * remote-control layer from hijacking every message in a shared chat.
   */
  protected async dispatchInboundMessage(
    message: ChannelInboundMessage,
  ): Promise<boolean> {
    const parsed = parseChannelCommand(message)
    if (!parsed || !this.handler) {
      return false
    }

    await this.handler(parsed)
    return true
  }
}
