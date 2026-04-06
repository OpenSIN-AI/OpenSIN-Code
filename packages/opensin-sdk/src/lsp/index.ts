/**
 * LSP Module — Sin-branded Language Server Protocol integration.
 * 
 * Provides LSP client, manager, server, types, and error handling.
 */

export { LspServer } from "./lsp.js";
export { LspManager } from "./manager.js";
export { LspClient } from "./client.js";
export {
  LspServerConfig,
  LspContextEnrichment,
  SymbolLocation,
  FileDiagnostics,
  WorkspaceDiagnostics,
  renderPromptSection,
  normalizeExtension,
  languageIdFor,
  MAX_RENDERED_DIAGNOSTICS,
  MAX_RENDERED_LOCATIONS,
} from "./types.js";
export {
  LspError,
  LspErrorCode,
  isLspError,
} from "./error.js";
export type {
  ServerCapabilities,
  InitializeResult,
  TextDocumentItem,
} from "./types.js";