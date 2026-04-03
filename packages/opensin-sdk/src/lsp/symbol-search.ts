/**
 * Symbol search via LSP.
 */

import { LSPClient } from './client.js';
import { LSPPosition, LSPSymbol } from './types.js';

export class SymbolSearch {
  private client: LSPClient;

  constructor(client: LSPClient) {
    this.client = client;
  }

  async searchSymbols(
    query: string,
    uri?: string,
  ): Promise<LSPSymbol[]> {
    if (!this.client.isInitialized()) {
      return [];
    }

    const params: Record<string, unknown> = {
      query,
      ...(uri && { textDocument: { uri } }),
    };

    const result = await this.client.sendRequest('workspace/symbol', params);

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result as LSPSymbol[];
  }

  async getDocumentSymbols(uri: string): Promise<LSPSymbol[]> {
    if (!this.client.isInitialized()) {
      return [];
    }

    const params = {
      textDocument: { uri },
    };

    const result = await this.client.sendRequest('textDocument/documentSymbol', params);

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result as LSPSymbol[];
  }

  async findSymbolAtPosition(
    uri: string,
    position: LSPPosition,
  ): Promise<LSPSymbol | null> {
    const symbols = await this.getDocumentSymbols(uri);

    for (const symbol of symbols) {
      const range = symbol.location.range;
      if (
        position.line >= range.start.line &&
        position.line <= range.end.line &&
        position.character >= range.start.character &&
        position.character <= range.end.character
      ) {
        return symbol;
      }
    }

    return null;
  }

  async getWorkspaceSymbols(query: string): Promise<LSPSymbol[]> {
    return this.searchSymbols(query);
  }
}
