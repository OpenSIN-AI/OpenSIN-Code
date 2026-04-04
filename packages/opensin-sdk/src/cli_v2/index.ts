// CLI v2 Framework (from sin-claude)

// Core
export { cliError, cliOk } from "./exit.js";
export { ndjsonSafeStringify } from "./ndjsonSafeStringify.js";
export { print } from "./print.js";
export { RemoteIO } from "./remoteIO.js";
export {
  StructuredIO,
  joinPromptValues,
  canBatchWith,
  runHeadless,
  createCanUseToolWithPermissionPrompt,
  getCanUseToolFn,
  removeInterruptedMessage,
  handleOrphanedPermissionResponse,
} from "./structuredIO.js";
export { update } from "./update.js";

// Handlers
export { agentsHandler } from "./handlers/agents.js";
export {
  installOAuthTokens,
  authLogin,
  authStatus,
  authLogout,
} from "./handlers/auth.js";
export {
  autoModeDefaultsHandler,
  autoModeConfigHandler,
  autoModeCritiqueHandler,
} from "./handlers/autoMode.js";
export {
  VALID_INSTALLABLE_SCOPES,
  VALID_UPDATE_SCOPES,
  handleMarketplaceError,
  pluginValidateHandler,
  pluginListHandler,
  marketplaceAddHandler,
  marketplaceListHandler,
  marketplaceRemoveHandler,
  marketplaceUpdateHandler,
  pluginInstallHandler,
  pluginUninstallHandler,
  pluginEnableHandler,
  pluginDisableHandler,
  pluginUpdateHandler,
} from "./handlers/plugins.js";
export {
  mcpServeHandler,
  mcpRemoveHandler,
  mcpListHandler,
  mcpGetHandler,
  mcpAddJsonHandler,
  mcpAddFromDesktopHandler,
  mcpResetChoicesHandler,
  handleMcpSetServers,
  reconcileMcpServers,
} from "./handlers/mcp.js";
export {
  setupTokenHandler,
  doctorHandler,
  installHandler,
} from "./handlers/util.js";

// Transports
export {
  CCRInitError,
  createStreamAccumulator,
  accumulateStreamEvents,
  clearStreamAccumulatorForMessage,
} from "./transports/ccrClient.js";
export { CCRClient } from "./transports/ccrClient.js";
export { HybridTransport } from "./transports/HybridTransport.js";
export {
  RetryableError,
  SerialBatchEventUploader,
} from "./transports/SerialBatchEventUploader.js";
export { SSETransport, parseSSEFrames } from "./transports/SSETransport.js";
export {
  getTransportForUrl,
  WebSocketTransport,
} from "./transports/WebSocketTransport.js";
export { WorkerStateUploader } from "./transports/WorkerStateUploader.js";
export type { WebSocketTransportOptions } from "./transports/WebSocketTransport.js";
export type { DynamicMcpState, SdkMcpState, McpSetServersResult } from "./handlers/mcp.js";
export type { InternalEvent, StreamClientEvent, CCRInitFailReason, StreamAccumulatorState } from "./transports/ccrClient.js";
