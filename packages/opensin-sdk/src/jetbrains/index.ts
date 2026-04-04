/**
 * JetBrains IDE Plugin — Multi-IDE Support like Windsurf JetBrains
 *
 * Provides protocol-based communication with JetBrains IDEs
 * for code editing, project management, and AI-assisted development.
 */

export { JetBrainsPlugin } from "./plugin.js";
export type { JetBrainsPluginOptions } from "./plugin.js";

export { JetBrainsProtocol, METHODS, PROTOCOL_VERSION } from "./protocol.js";

export type {
  JetBrainsPluginInfo,
  JetBrainsConnectionConfig,
  JetBrainsDocumentInfo,
  JetBrainsEditorState,
  JetBrainsProjectInfo,
  JetBrainsModuleInfo,
  JetBrainsActionRequest,
  JetBrainsActionResponse,
  JetBrainsNotification,
  JetBrainsToolWindow,
  JetBrainsProtocolMessage,
  JetBrainsProtocolResponse,
  JetBrainsEventType,
  JetBrainsEvent,
} from "./types.js";
