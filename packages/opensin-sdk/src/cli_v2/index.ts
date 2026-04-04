// CLI v2 framework (from sin-claude)

// Core
export { cliError, cliOk } from "./exit.js";
export { ndjsonSafeStringify } from "./ndjsonSafeStringify.js";
export { StructuredIO, SANDBOX_NETWORK_ACCESS_TOOL_NAME } from "./structuredIO.js";
export { RemoteIO } from "./remoteIO.js";
export { update } from "./update.js";

// Handlers
export { agentsHandler } from "./handlers/agents.js";
export { installOAuthTokens, authLogin, authStatus, authLogout } from "./handlers/auth.js";
export { autoModeDefaultsHandler, autoModeConfigHandler, autoModeCritiqueHandler } from "./handlers/autoMode.js";
export {
  mcpServeHandler,
  mcpRemoveHandler,
  mcpListHandler,
  mcpGetHandler,
  mcpAddJsonHandler,
  mcpAddFromDesktopHandler,
  mcpResetChoicesHandler,
} from "./handlers/mcp.js";
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
export { setupTokenHandler, doctorHandler, installHandler } from "./handlers/util.js";

// Transports
export type { CCRInitFailReason, InternalEvent, StreamAccumulatorState, WebSocketTransportOptions, StreamClientEvent } from "./transports/ccrClient.js";
export { CCRInitError, CCRClient, createStreamAccumulator, accumulateStreamEvents, clearStreamAccumulatorForMessage } from "./transports/ccrClient.js";
export { HybridTransport } from "./transports/HybridTransport.js";
export { RetryableError, SerialBatchEventUploader } from "./transports/SerialBatchEventUploader.js";
export { parseSSEFrames, SSETransport } from "./transports/SSETransport.js";
export { getTransportForUrl } from "./transports/transportUtils.js";
export { WebSocketTransport } from "./transports/WebSocketTransport.js";
export { WorkerStateUploader } from "./transports/WorkerStateUploader.js";
