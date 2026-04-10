/**
 * OpenSIN SDK - Discord Channel Adapter
 *
 * WHAT: This file adapts Discord chat or interaction traffic into the shared
 * remote-control channel contract.
 *
 * WHY: Issue #1082 requires Discord to expose the same command set as Telegram
 * and WhatsApp. The router should not need to care whether a command came from a
 * Discord slash interaction, a bot mention, or another Discord-facing wrapper.
 *
 * WHY NOT add `discord.js` directly here: the issue allows either Discord.js or
 * A2A-SIN-Discord, but the SDK itself should not grow a new dependency unless the
 * runtime integration truly requires it. Dependency injection keeps this layer
 * simple and avoids hard-coding one Discord stack.
 *
 * CONSEQUENCES: the adapter can work with a Discord.js wrapper today and a future
 * A2A-SIN-Discord transport tomorrow without changing router logic.
 *
 * Branded: OpenSIN/sincode
 */

import {
  BaseChannelAdapter,
  type ChannelInboundMessage,
  type ChannelTransport,
} from './adapter.js'

/**
 * Discord messages are flattened before they enter the shared adapter layer.
 *
 * WHY: slash commands and plain text messages can be normalized to the same shape
 * once the upstream Discord integration has extracted the final command text.
 */
export interface DiscordInboundEvent {
  channelId: string
  text: string
  senderId?: string
  senderName?: string
  interactionId?: string
  metadata?: Record<string, unknown>
}

/**
 * The command source abstraction keeps the SDK independent from Discord.js event
 * objects or any custom bot framework.
 */
export interface DiscordCommandSource {
  onCommand(handler: (event: DiscordInboundEvent) => Promise<void> | void): void
}

/**
 * Dedicated transport alias for readability.
 */
export interface DiscordTransport extends ChannelTransport {}

/**
 * Constructor options for the Discord adapter.
 */
export interface DiscordAdapterOptions {
  transport: DiscordTransport
  commandSource?: DiscordCommandSource
}

/**
 * DiscordAdapter is the minimal platform shim between Discord-facing integrations
 * and the shared command router.
 */
export class DiscordAdapter extends BaseChannelAdapter {
  constructor(options: DiscordAdapterOptions) {
    super('discord', options.transport)

    options.commandSource?.onCommand(async (event) => {
      await this.handleEvent(event)
    })
  }

  /**
   * Normalize a Discord event into the generic inbound shape.
   */
  async handleEvent(event: DiscordInboundEvent): Promise<boolean> {
    const message: ChannelInboundMessage = {
      platform: 'discord',
      chatId: event.channelId,
      senderId: event.senderId,
      senderName: event.senderName,
      text: event.text,
      metadata: {
        interactionId: event.interactionId,
        ...(event.metadata ?? {}),
      },
    }

    return this.dispatchInboundMessage(message)
  }
}

/**
 * Factory helper matching the Telegram and WhatsApp adapter ergonomics.
 */
export function createDiscordAdapter(
  options: DiscordAdapterOptions,
): DiscordAdapter {
  return new DiscordAdapter(options)
}
