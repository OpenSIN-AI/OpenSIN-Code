type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];
import type { JSONValue } from "../types";
import type { 
  McpServerConfig, 
  McpStdioServerConfig, 
  McpSseServerConfig, 
  McpHttpServerConfig, 
  McpWsServerConfig, 
  McpSdkServerConfig,
  McpManagedProxyServerConfig,
  McpOAuthConfig,
  ScopedMcpServerConfig
} from "./mcp";
import { 
  normalizeNameForMcp, 
  mcpToolPrefix, 
  mcpServerSignature 
} from "./mcp";

export type McpClientTransport = 
  | McpStdioTransport
  | McpSseTransport
  | McpHttpTransport
  | McpWebSocketTransport
  | McpSdkTransport
  | McpManagedProxyTransport;

export interface McpStdioTransport {
  type: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface McpSseTransport {
  type: "sse";
  url: string;
  headers: Record<string, string>;
  headersHelper?: string;
  auth: McpClientAuth;
}

export interface McpHttpTransport {
  type: "http";
  url: string;
  headers: Record<string, string>;
  headersHelper?: string;
  auth: McpClientAuth;
}

export interface McpWebSocketTransport {
  type: "ws";
  url: string;
  headers: Record<string, string>;
  headersHelper?: string;
  auth: McpClientAuth;
}

export interface McpSdkTransport {
  type: "sdk";
  name: string;
}

export interface McpManagedProxyTransport {
  type: "managed-proxy";
  url: string;
  id: string;
}

export type McpClientAuth = 
  | { type: "none" }
  | { type: "oauth"; config: McpOAuthConfig };

export interface McpClientBootstrap {
  serverName: string;
  normalizedName: string;
  toolPrefix: string;
  signature: string | null;
  transport: McpClientTransport;
}

export function fromScopedConfig(serverName: string, config: ScopedMcpServerConfig): McpClientBootstrap {
  return {
    serverName,
    normalizedName: normalizeNameForMcp(serverName),
    toolPrefix: mcpToolPrefix(serverName),
    signature: mcpServerSignature(config.config),
    transport: fromConfig(config.config),
  };
}

export function fromConfig(config: McpServerConfig): McpClientTransport {
  switch (config.type) {
    case "stdio":
      return {
        type: "stdio",
        command: config.command,
        args: config.args,
        env: config.env,
      };
    case "sse":
      return {
        type: "sse",
        url: config.url,
        headers: config.headers,
        headersHelper: config.headersHelper,
        auth: fromOauth(config.oauth),
      };
    case "http":
      return {
        type: "http",
        url: config.url,
        headers: config.headers,
        headersHelper: config.headersHelper,
        auth: fromOauth(config.oauth),
      };
    case "ws":
      return {
        type: "ws",
        url: config.url,
        headers: config.headers,
        headersHelper: config.headersHelper,
        auth: { type: "none" },
      };
    case "sdk":
      return {
        type: "sdk",
        name: config.name,
      };
    case "managed-proxy":
      return {
        type: "managed-proxy",
        url: config.url,
        id: config.id,
      };
  }
}

function fromOauth(oauth: McpOAuthConfig | undefined): McpClientAuth {
  if (!oauth) return { type: "none" };
  return { type: "oauth", config: oauth };
}

export function requiresUserAuth(auth: McpClientAuth): boolean {
  return auth.type === "oauth";
}
