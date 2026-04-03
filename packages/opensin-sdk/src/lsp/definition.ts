/**
 * Go-to-definition support via LSP.
 */

import { LSPClient } from './client.js';
import { LSPDefinition, LSPPosition } from './types.js';

export class DefinitionProvider {
  private client: LSPClient;

  constructor(client: LSPClient) {
    this.client = client;
  }

  async goToDefinition(
    uri: string,
    position: LSPPosition,
  ): Promise<LSPDefinition | LSPDefinition[] | null> {
    if (!this.client.isInitialized()) {
      return null;
    }

    const params = {
      textDocument: { uri },
      position,
    };

    const result = await this.client.sendRequest('textDocument/definition', params);

    if (!result) return null;

    if (Array.isArray(result)) {
      return result as LSPDefinition[];
    }

    return result as LSPDefinition;
  }

  async getTypeDefinition(
    uri: string,
    position: LSPPosition,
  ): Promise<LSPDefinition | LSPDefinition[] | null> {
    if (!this.client.isInitialized()) {
      return null;
    }

    const params = {
      textDocument: { uri },
      position,
    };

    const result = await this.client.sendRequest('textDocument/typeDefinition', params);

    if (!result) return null;

    if (Array.isArray(result)) {
      return result as LSPDefinition[];
    }

    return result as LSPDefinition;
  }

  async getReferences(
    uri: string,
    position: LSPPosition,
    includeDeclaration = true,
  ): Promise<LSPDefinition[] | null> {
    if (!this.client.isInitialized()) {
      return null;
    }

    const params = {
      textDocument: { uri },
      position,
      context: { includeDeclaration },
    };

    const result = await this.client.sendRequest('textDocument/references', params);

    if (!result) return null;

    return result as LSPDefinition[];
  }

  async getImplementation(
    uri: string,
    position: LSPPosition,
  ): Promise<LSPDefinition | LSPDefinition[] | null> {
    if (!this.client.isInitialized()) {
      return null;
    }

    const params = {
      textDocument: { uri },
      position,
    };

    const result = await this.client.sendRequest('textDocument/implementation', params);

    if (!result) return null;

    if (Array.isArray(result)) {
      return result as LSPDefinition[];
    }

    return result as LSPDefinition;
  }
}
