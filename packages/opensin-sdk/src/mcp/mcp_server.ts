import type { JSONValue } from "../types";
import type {
  McpServerConfig,
  ScopedMcpServerConfig,
  McpTransport,
} from "./mcp";
import type {
  McpClientBootstrap,
  McpClientTransport,
} from "./mcp_client";
import type {
  McpTool,
  McpListToolsParams,
  McpToolCallParams,
  McpToolCallResult,
  ManagedMcpTool,
  UnsupportedMcpServer,
  McpServerManagerError,
  ToolRoute,
  McpStdioProcess,
  JsonRpcResponse,
  JsonRpcId,
  McpInitializeParams,
  McpListResourcesParams,
  McpReadResourceParams,
  McpReadResourceResult,
  McpListResourcesResult,
  McpListToolsResult,
} from "./mcp_stdio";
import { fromScopedConfig } from "./mcp_client";
import { mcpToolName } from "./mcp";
import { McpStdioProcess, spawnMcpStdioProcess } from "./mcp_stdio";

export interface ServerRuntime {
  bootstrap: McpClientBootstrap;
  process: McpStdioProcess | null;
  initialized: boolean;
}

export interface McpServerManager {
  servers: Map<string, ServerRuntime>;
  unsupportedServers: UnsupportedMcpServer[];
  toolIndex: Map<string, ToolRoute>;
  nextRequestId: number;
}

export function createServerManager(
  scopedServers: Map<string, ScopedMcpServerConfig>
): McpServerManager {
  const servers = new Map<string, ServerRuntime>();
  const unsupportedServers: UnsupportedMcpServer[] = [];

  for (const [serverName, serverConfig] of scopedServers) {
    if (serverConfig.config.type === "stdio") {
      const bootstrap = fromScopedConfig(serverName, serverConfig);
      servers.set(serverName, {
        bootstrap,
        process: null,
        initialized: false,
      });
    } else {
      unsupportedServers.push({
        serverName,
        transport: serverConfig.config.type,
        reason: `transport ${serverConfig.config.type} is not supported by McpServerManager`,
      });
    }
  }

  return {
    servers,
    unsupportedServers,
    toolIndex: new Map(),
    nextRequestId: 1,
  };
}

export function getUnsupportedServers(manager: McpServerManager): UnsupportedMcpServer[] {
  return manager.unsupportedServers;
}

export async function discoverTools(
  manager: McpServerManager
): Promise<ManagedMcpTool[]> {
  const discoveredTools: ManagedMcpTool[] = [];
  const serverNames = Array.from(manager.servers.keys());

  for (const serverName of serverNames) {
    await ensureServerReady(manager, serverName);
    clearRoutesForServer(manager, serverName);

    let cursor: string | undefined;
    while (true) {
      const requestId = takeRequestId(manager);
      const server = manager.servers.get(serverName);
      if (!server || !server.process) {
        throw createError("invalidResponse", serverName, "tools/list", 
          "server process missing after initialization");
      }

      const response = await server.process.listTools({ cursor });

      if (response.error) {
        throw createError("jsonRpc", serverName, "tools/list", {
          code: response.error.code,
          message: response.error.message,
          data: response.error.data,
        } as any);
      }

      if (!response.result) {
        throw createError("invalidResponse", serverName, "tools/list", 
          "missing result payload");
      }

      const result = response.result;
      for (const tool of result.tools) {
        const qualifiedName = mcpToolName(serverName, tool.name);
        manager.toolIndex.set(qualifiedName, {
          serverName,
          rawName: tool.name,
        });
        discoveredTools.push({
          serverName,
          qualifiedName,
          rawName: tool.name,
          tool,
        });
      }

      if (result.nextCursor) {
        cursor = result.nextCursor;
      } else {
        break;
      }
    }
  }

  return discoveredTools;
}

export async function callTool(
  manager: McpServerManager,
  qualifiedToolName: string,
  arguments_: JSONValue | undefined
): Promise<JsonRpcResponse<McpToolCallResult>> {
  const route = manager.toolIndex.get(qualifiedToolName);
  if (!route) {
    throw createError("unknownTool", "", "", qualifiedToolName as any);
  }

  await ensureServerReady(manager, route.serverName);
  const requestId = takeRequestId(manager);
  
  const server = manager.servers.get(route.serverName);
  if (!server || !server.process) {
    throw createError("invalidResponse", route.serverName, "tools/call",
      "server process missing after initialization");
  }

  const response = await server.process.callTool({
    name: route.rawName,
    arguments: arguments_,
  });

  return response;
}

export async function shutdown(manager: McpServerManager): Promise<void> {
  const serverNames = Array.from(manager.servers.keys());
  
  for (const serverName of serverNames) {
    const server = manager.servers.get(serverName);
    if (server && server.process) {
      await server.process.terminate();
      server.process = null;
      server.initialized = false;
    }
  }
}

function clearRoutesForServer(manager: McpServerManager, serverName: string): void {
  for (const [key, route] of manager.toolIndex) {
    if (route.serverName !== serverName) {
      continue;
    }
    manager.toolIndex.delete(key);
  }
}

function takeRequestId(manager: McpServerManager): JsonRpcId {
  const id = manager.nextRequestId;
  manager.nextRequestId = id + 1;
  return id;
}

async function ensureServerReady(
  manager: McpServerManager,
  serverName: string
): Promise<void> {
  const server = manager.servers.get(serverName);
  if (!server) {
    throw createError("unknownServer", "", "", serverName as any);
  }

  if (!server.process) {
    const process = spawnMcpStdioProcess(server.bootstrap.transport);
    if (!process) {
      throw createError("invalidResponse", serverName, "initialize",
        "failed to spawn stdio process");
    }
    server.process = process;
    server.initialized = false;
  }

  if (!server.initialized) {
    const server = manager.servers.get(serverName);
    if (!server || !server.process) {
      throw createError("invalidResponse", serverName, "initialize",
        "server process missing before initialize");
    }

    const requestId = takeRequestId(manager);
    const response = await server.process.initialize(defaultInitializeParams());

    if (response.error) {
      throw createError("jsonRpc", serverName, "initialize", {
        code: response.error.code,
        message: response.error.message,
        data: response.error.data,
      } as any);
    }

    if (!response.result) {
      throw createError("invalidResponse", serverName, "initialize",
        "missing result payload");
    }

    server.initialized = true;
  }
}

function createError(
  type: McpServerManagerError["type"],
  serverName: string,
  method: string,
  details: string | { code: number; message: string; data?: JSONValue }
): McpServerManagerError {
  switch (type) {
    case "io":
      return { type: "io", message: details as string };
    case "jsonRpc":
      return { 
        type: "jsonRpc", 
        serverName, 
        method, 
        error: details as { code: number; message: string; data?: JSONValue } 
      };
    case "invalidResponse":
      return { type: "invalidResponse", serverName, method, details: details as string };
    case "unknownTool":
      return { type: "unknownTool", qualifiedName: details as string };
    case "unknownServer":
      return { type: "unknownServer", serverName: details as string };
  }
}

function defaultInitializeParams(): McpInitializeParams {
  return {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "opensin-sdk",
      version: "1.0.0",
    },
  };
}

export async function listResources(
  manager: McpServerManager,
  serverName: string,
  params?: McpListResourcesParams
): Promise<JsonRpcResponse<McpListResourcesResult>> {
  await ensureServerReady(manager, serverName);
  const requestId = takeRequestId(manager);
  
  const server = manager.servers.get(serverName);
  if (!server || !server.process) {
    throw createError("invalidResponse", serverName, "resources/list",
      "server process missing");
  }

  return server.process.listResources(params);
}

export async function readResource(
  manager: McpServerManager,
  serverName: string,
  params: McpReadResourceParams
): Promise<JsonRpcResponse<McpReadResourceResult>> {
  await ensureServerReady(manager, serverName);
  const requestId = takeRequestId(manager);
  
  const server = manager.servers.get(serverName);
  if (!server || !server.process) {
    throw createError("invalidResponse", serverName, "resources/read",
      "server process missing");
  }

  return server.process.readResource(params);
}
