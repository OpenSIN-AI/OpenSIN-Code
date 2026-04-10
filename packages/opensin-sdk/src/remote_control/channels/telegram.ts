/**
 * OpenSIN SDK - Telegram Channel Adapter
 *
 * WHAT: This file adapts Telegram chat traffic into the shared channel contract
 * defined in `adapter.ts`.
 *
 * WHY: Issue #1082 explicitly calls out A2A-SIN-TelegramBot as the Telegram
 * integration surface. The SDK should therefore expose a clean adapter that can
 * plug into that MCP/CLI layer without leaking Telegram-specific payload details
 * into the router.
 *
 * WHY NOT call Telegram MCP commands directly here: the SDK layer should remain a
 * library surface, not a process-spawning shell wrapper. A higher layer can own
 * the actual TelegramBot transport and feed normalized updates into this adapter.
 *
 * CONSEQUENCES: the adapter is testable, transport-agnostic, and still aligned
 * with the Telegram-specific integration path described by the issue.
 *
 * Branded: OpenSIN/sincode
 */

import {
  BaseChannelAdapter,
  type ChannelTransport,
  type ChannelInboundMessage,
} from './adapter.js'

/**
 * Telegram inbound updates are intentionally flattened to the fields required by
 * the shared adapter contract.
 *
 * WHY: a higher-level Telegram integration may receive Bot API updates, webhook
 * payloads, or CLI callbacks. Flattening here keeps the SDK independent from the
 * exact upstream delivery mechanism.
 */
export interface TelegramInboundUpdate {
  chatId: string
  text: string
  senderId?: string
  senderName?: string
  messageId?: string
  metadata?: Record<string, unknown>
}

/**
 * Telegram command sources are responsible for calling the provided callback when
 * a new text message is ready for remote-control parsing.
 */
export interface TelegramCommandSource {
  onMessage(handler: (update: TelegramInboundUpdate) => Promise<void> | void): void
}

/**
 * Telegram transport stays identical to the generic ChannelTransport shape, but a
 * dedicated alias makes constructor signatures self-describing.
 */
export interface TelegramTransport extends ChannelTransport {}

/**
 * Constructor options keep send and receive dependencies injectable.
 */
export interface TelegramAdapterOptions {
  transport: TelegramTransport
  commandSource?: TelegramCommandSource
}

/**
 * TelegramAdapter wires Telegram text updates into the shared command pipeline.
 *
 * WHAT: one concrete ChannelAdapter implementation for Telegram.
 * WHY: Telegram should only need a tiny platform shim because the router already
 * owns command behavior.
 * CONSEQUENCES: inbound messages are normalized once and then handled exactly the
 * same as Discord and WhatsApp commands.
 */
export class TelegramAdapter extends BaseChannelAdapter {
  constructor(options: TelegramAdapterOptions) {
    super('telegram', options.transport)

    /**
     * If a command source is supplied, bind it immediately so the adapter becomes
     * operational without extra setup calls.
     *
     * WHY immediate binding: it keeps the adapter ergonomic for simple runtime
     * composition and avoids a separate lifecycle method in the base interface.
     */
    options.commandSource?.onMessage(async (update) => {
      await this.handleUpdate(update)
    })
  }

  /**
   * Normalize one Telegram update and feed it into the shared parser.
   */
  async handleUpdate(update: TelegramInboundUpdate): Promise<boolean> {
    const message: ChannelInboundMessage = {
      platform: 'telegram',
      chatId: update.chatId,
      senderId: update.senderId,
      senderName: update.senderName,
      text: update.text,
      metadata: {
        messageId: update.messageId,
        ...(update.metadata ?? {}),
      },
    }

    return this.dispatchInboundMessage(message)
  }
}

/**
 * Small factory helper for callers that prefer functions over `new`.
 */
export function createTelegramAdapter(
  options: TelegramAdapterOptions,
): TelegramAdapter {
  return new TelegramAdapter(options)
}
