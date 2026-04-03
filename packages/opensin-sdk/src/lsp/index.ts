/**
 * LSP Integration — language server support like OpenCode.
 * Provides automatic language server configuration, type-aware completions,
 * go-to-definition support, and symbol search.
 */

export { LSPClient } from './client.js';
export { LSPConfig } from './config.js';
export { CompletionProvider } from './completions.js';
export { DefinitionProvider } from './definition.js';
export { SymbolSearch } from './symbol-search.js';
export type {
  LSPMessage,
  LSPPosition,
  LSPRange,
  LSPDiagnostic,
  LSPCompletion,
  LSPSymbol,
  LSPDefinition,
  LSPInitializeParams,
  LSPCapabilities,
} from './types.js';
