/**
 * LSP types for OpenSIN SDK.
 */

export interface LSPPosition {
  line: number;
  character: number;
}

export interface LSPRange {
  start: LSPPosition;
  end: LSPPosition;
}

export interface LSPDiagnostic {
  range: LSPRange;
  severity: number;
  code?: string | number;
  source?: string;
  message: string;
}

export interface LSPCompletion {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
  filterText?: string;
  sortText?: string;
}

export interface LSPSymbol {
  name: string;
  kind: number;
  location: {
    uri: string;
    range: LSPRange;
  };
}

export interface LSPDefinition {
  uri: string;
  range: LSPRange;
}

export interface LSPMessage {
  jsonrpc: string;
  method: string;
  params?: Record<string, unknown>;
  id?: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface LSPInitializeParams {
  processId: number | null;
  clientInfo: {
    name: string;
    version: string;
  };
  rootUri: string | null;
  capabilities: LSPCapabilities;
  initializationOptions?: Record<string, unknown>;
}

export interface LSPCapabilities {
  textDocument?: {
    completion?: {
      completionItem?: {
        snippetSupport?: boolean;
        commitCharactersSupport?: boolean;
        documentationFormat?: string[];
      };
      completionItemKind?: {
        valueSet?: number[];
      };
      contextSupport?: boolean;
    };
    definition?: {
      linkSupport?: boolean;
    };
    references?: object;
    documentSymbol?: {
      hierarchicalDocumentSymbolSupport?: boolean;
    };
  };
  workspace?: {
    workspaceFolders?: boolean;
    configuration?: boolean;
  };
}
