/**
 * Type-aware completions via LSP.
 */

import { LSPClient } from './client.js';
import { LSPCompletion, LSPPosition } from './types.js';

export class CompletionProvider {
  private client: LSPClient;

  constructor(client: LSPClient) {
    this.client = client;
  }

  async getCompletions(
    uri: string,
    position: LSPPosition,
    triggerCharacter?: string,
  ): Promise<LSPCompletion[]> {
    if (!this.client.isInitialized()) {
      return [];
    }

    const params: Record<string, unknown> = {
      textDocument: { uri },
      position,
      context: triggerCharacter ? { triggerCharacter, triggerKind: 2 } : undefined,
    };

    const result = await this.client.sendRequest('textDocument/completion', params);

    if (!result) return [];

    if (Array.isArray(result)) {
      return result as LSPCompletion[];
    }

    if (typeof result === 'object' && 'items' in result) {
      return (result as { items: LSPCompletion[] }).items;
    }

    return [];
  }

  async resolveCompletion(completion: LSPCompletion): Promise<LSPCompletion> {
    if (!this.client.isInitialized()) {
      return completion;
    }

    const result = await this.client.sendRequest('completionItem/resolve', completion as unknown as Record<string, unknown>);
    return (result as LSPCompletion) || completion;
  }

  async getCompletionSignatureHelp(
    uri: string,
    position: LSPPosition,
  ): Promise<unknown> {
    if (!this.client.isInitialized()) {
      return null;
    }

    const params = {
      textDocument: { uri },
      position,
    };

    return this.client.sendRequest('textDocument/signatureHelp', params);
  }
}
