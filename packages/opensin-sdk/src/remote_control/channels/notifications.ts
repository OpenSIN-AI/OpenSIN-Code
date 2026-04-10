/**
 * OpenSIN SDK - Channel Remote Control Notifications
 *
 * WHAT: This file contains the notification fan-out layer for Issue #1082.
 *
 * WHY: command routing only covers request/response interactions. Long-running
 * agents also need proactive delivery when they complete, fail, or pause for an
 * approval decision. Keeping that behavior in a dedicated service prevents the
 * router from becoming a mixed synchronous/asynchronous transport hub.
 *
 * WHY NOT let the Remote Control API push directly into every channel adapter:
 * the API should stay transport-neutral. The SDK side already knows which chat is
 * bound to which session or agent, so it is the correct place to map events back
 * onto channel adapters.
 *
 * CONSEQUENCES: the system can deliver event-driven chat updates without teaching
 * the API about Telegram/Discord/WhatsApp specifics.
 *
 * Branded: OpenSIN/sincode
 */

import type { BackgroundAgentStatus } from '../../background_agents/types.js'
import type { ChannelAdapter, ChannelPlatform } from './adapter.js'
import type {
  ChannelSessionBinding,
  ChannelSessionBindingStore,
} from './router.js'

/**
 * Notification kinds are kept explicit so callers cannot silently invent event
 * names that the formatter does not understand.
 */
export type ChannelNotificationType =
  | 'agent_complete'
  | 'agent_error'
  | 'approval_required'
  | 'agent_status'

/**
 * Event payload for channel notifications.
 *
 * WHAT: the minimal cross-platform shape needed to tell users something changed.
 * WHY: the issue calls for completion, error, and approval push notifications.
 * CONSEQUENCES: callers can provide optional preview text without forcing richer
 * channel-specific payloads into the SDK contract.
 */
export interface ChannelNotificationEvent {
  type: ChannelNotificationType
  agentId: string
  status: BackgroundAgentStatus
  sessionId?: string
  title?: string
  message?: string
  resultPreview?: string
}

/**
 * A small result object makes it easy to inspect fan-out behavior in tests.
 */
export interface ChannelNotificationDeliveryResult {
  delivered: number
  recipients: Array<Pick<ChannelSessionBinding, 'platform' | 'chatId'>>
}

/**
 * NotificationService fans out agent lifecycle events to every chat that is bound
 * either to the specific agent or to the owning session.
 *
 * WHY agent-first matching: if a chat has narrowed itself to a specific agent, it
 * should still be notified even when multiple agents share one session.
 * WHY session-level fallback: completion notifications would be lost for newly
 * spawned agents if the backend only returns a session id and not a per-chat map.
 */
export class NotificationService {
  /**
   * Adapters are stored by platform so one session-binding lookup is enough to
   * find the correct delivery mechanism.
   */
  private readonly adapters = new Map<ChannelPlatform, ChannelAdapter>()

  constructor(private readonly bindings: ChannelSessionBindingStore) {}

  /**
   * Register or replace an adapter for a platform.
   *
   * WHY replacement is allowed: tests and embeddings may want to swap adapters
   * without constructing a brand-new notification service every time.
   */
  registerAdapter(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.platform, adapter)
  }

  /**
   * Fan out an event to every matching bound chat.
   */
  async notify(
    event: ChannelNotificationEvent,
  ): Promise<ChannelNotificationDeliveryResult> {
    const recipients = await this.resolveRecipients(event)
    const message = this.formatEvent(event)

    for (const recipient of recipients) {
      const adapter = this.adapters.get(recipient.platform)
      if (!adapter) {
        continue
      }

      await adapter.sendMessage(recipient.chatId, message)
    }

    return {
      delivered: recipients.filter((recipient) => this.adapters.has(recipient.platform)).length,
      recipients: recipients.map((recipient) => ({
        platform: recipient.platform,
        chatId: recipient.chatId,
      })),
    }
  }

  /**
   * Convenience helpers keep call sites descriptive and avoid repetitive event
   * object assembly in higher layers.
   */
  async notifyCompletion(
    event: Omit<ChannelNotificationEvent, 'type'>,
  ): Promise<ChannelNotificationDeliveryResult> {
    return this.notify({ ...event, type: 'agent_complete' })
  }

  async notifyError(
    event: Omit<ChannelNotificationEvent, 'type'>,
  ): Promise<ChannelNotificationDeliveryResult> {
    return this.notify({ ...event, type: 'agent_error' })
  }

  async notifyApprovalRequired(
    event: Omit<ChannelNotificationEvent, 'type'>,
  ): Promise<ChannelNotificationDeliveryResult> {
    return this.notify({ ...event, type: 'approval_required' })
  }

  /**
   * Gather recipients from both the exact agent binding and the broader session
   * binding, then deduplicate by platform+chat.
   *
   * WHY dedupe: one chat can legitimately match both rules.
   * CONSEQUENCES: recipients never receive duplicate messages for one event.
   */
  private async resolveRecipients(
    event: ChannelNotificationEvent,
  ): Promise<ChannelSessionBinding[]> {
    const recipients = new Map<string, ChannelSessionBinding>()

    const byAgent = await this.bindings.listByAgent(event.agentId)
    for (const binding of byAgent) {
      recipients.set(this.buildRecipientKey(binding), binding)
    }

    if (event.sessionId) {
      const bySession = await this.bindings.listBySession(event.sessionId)
      for (const binding of bySession) {
        recipients.set(this.buildRecipientKey(binding), binding)
      }
    }

    return [...recipients.values()]
  }

  /**
   * Human-readable formatting stays intentionally plain so all adapters can reuse
   * it without needing platform-specific markdown features.
   */
  private formatEvent(event: ChannelNotificationEvent): string {
    switch (event.type) {
      case 'agent_complete':
        return [
          `OpenSIN agent ${event.agentId} completed with status ${event.status}.`,
          event.title ? `Title: ${event.title}` : undefined,
          event.message,
          event.resultPreview ? `Preview: ${event.resultPreview}` : undefined,
        ]
          .filter(Boolean)
          .join('\n')

      case 'agent_error':
        return [
          `OpenSIN agent ${event.agentId} reported status ${event.status}.`,
          event.title ? `Title: ${event.title}` : undefined,
          event.message,
        ]
          .filter(Boolean)
          .join('\n')

      case 'approval_required':
        return [
          `OpenSIN agent ${event.agentId} is waiting for approval.`,
          'Reply with /approve <id> or /reject <id>.',
          event.message,
        ]
          .filter(Boolean)
          .join('\n')

      case 'agent_status':
        return [
          `OpenSIN agent ${event.agentId} status update: ${event.status}.`,
          event.message,
        ]
          .filter(Boolean)
          .join('\n')
    }
  }

  private buildRecipientKey(binding: ChannelSessionBinding): string {
    return `${binding.platform}:${binding.chatId}`
  }
}
