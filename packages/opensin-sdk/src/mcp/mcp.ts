import type { JSONValue } from "../types";

const SIN_SERVER_PREFIX = "sin.ai";
const CCR_PROXY_PATH_MARKERS = ["/v2/session_ingress/shttp/mcp/", "/v2/ccr-sessions/"];

export function normalizeNameForMcp(name: string): string {
  let normalized = name
    .split("")
    .map((ch) => {
      if (/[a-zA-Z0-9_-]/.test(ch)) {
        return ch;
      }
      return "_";
    })
    .join("");

  if (name.startsWith(SIN_SERVER_PREFIX)) {
    normalized = collapseUnderscores(normalized).replace(/^_+|_+$/g, "");
  }

  return normalized;
}

export function mcpToolPrefix(serverName: string): string {
  return `mcp__${normalizeNameForMcp(serverName)}__`;
}

export function mcpToolName(serverName: string, toolName: string): string {
  return `${mcpToolPrefix(serverName)}${normalizeNameForMcp(toolName)}`;
}

export function unwrapCcrProxyUrl(url: string): string {
  if (!CCR_PROXY_PATH_MARKERS.some((marker) => url.includes(marker))) {
    return url;
  }

  const queryStart = url.indexOf("?");
  if (queryStart === -1) {
    return url;
  }

  const query = url.slice(queryStart + 1);
  for (const pair of query.split("&")) {
    const [key, value] = pair.split("=");
    if (key === "mcp_url" && value) {
      return percentDecode(value);
    }
  }

  return url;
}

export type McpServerConfig = 
  | McpStdioServerConfig
  | McpSseServerConfig
  | McpHttpServerConfig
  | McpWsServerConfig
  | McpSdkServerConfig
  | McpManagedProxyServerConfig;

export interface McpStdioServerConfig {
  type: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface McpSseServerConfig {
  type: "sse";
  url: string;
  headers: Record<string, string>;
  headersHelper?: string;
  oauth?: McpOAuthConfig;
}

export interface McpHttpServerConfig {
  type: "http";
  url: string;
  headers: Record<string, string>;
  headersHelper?: string;
  oauth?: McpOAuthConfig;
}

export interface McpWsServerConfig {
  type: "ws";
  url: string;
  headers: Record<string, string>;
  headersHelper?: string;
}

export interface McpSdkServerConfig {
  type: "sdk";
  name: string;
}

export interface McpManagedProxyServerConfig {
  type: "managed-proxy";
  url: string;
  id: string;
}

export interface McpOAuthConfig {
  clientId?: string;
  callbackPort?: number;
  authServerMetadataUrl?: string;
  xaa?: boolean;
}

export type McpTransport = "stdio" | "sse" | "http" | "ws" | "sdk" | "managed-proxy";

export interface ScopedMcpServerConfig {
  scope: "user" | "project" | "local";
  config: McpServerConfig;
}

export function mcpServerSignature(config: McpServerConfig): string | null {
  switch (config.type) {
    case "stdio": {
      const command = [config.command, ...config.args];
      return `stdio:${renderCommandSignature(command)}`;
    }
    case "sse":
    case "http": {
      return `url:${unwrapCcrProxyUrl(config.url)}`;
    }
    case "ws": {
      return `url:${unwrapCcrProxyUrl(config.url)}`;
    }
    case "managed-proxy": {
      return `url:${unwrapCcrProxyUrl(config.url)}`;
    }
    case "sdk": {
      return null;
    }
  }
}

export function scopedMcpConfigHash(config: ScopedMcpServerConfig): string {
  let rendered: string;
  
  switch (config.config.type) {
    case "stdio": {
      const stdio = config.config;
      rendered = `stdio|${stdio.command}|${renderCommandSignature(stdio.args)}|${renderEnvSignature(stdio.env)}`;
      break;
    }
    case "sse": {
      const sse = config.config;
      rendered = `sse|${sse.url}|${renderEnvSignature(sse.headers)}|${sse.headersHelper ?? ""}|${renderOauthSignature(sse.oauth)}`;
      break;
    }
    case "http": {
      const http = config.config;
      rendered = `http|${http.url}|${renderEnvSignature(http.headers)}|${http.headersHelper ?? ""}|${renderOauthSignature(http.oauth)}`;
      break;
    }
    case "ws": {
      const ws = config.config;
      rendered = `ws|${ws.url}|${renderEnvSignature(ws.headers)}|${ws.headersHelper ?? ""}`;
      break;
    }
    case "sdk": {
      rendered = `sdk|${config.config.name}`;
      break;
    }
    case "managed-proxy": {
      const proxy = config.config;
      rendered = `sin-ai-proxy|${proxy.url}|${proxy.id}`;
      break;
    }
  }
  
  return stableHexHash(rendered);
}

function renderCommandSignature(command: string[]): string {
  const escaped = command.map((part) => part.replace(/\\/g, "\\\\").replace(/\|/g, "\\|"));
  return `[${escaped.join("|")}]`;
}

function renderEnvSignature(env: Record<string, string>): string {
  return Object.entries(env).map(([key, value]) => `${key}=${value}`).join(";");
}

function renderOauthSignature(oauth: McpOAuthConfig | undefined): string {
  if (!oauth) return "";
  return [
    oauth.clientId ?? "",
    oauth.callbackPort?.toString() ?? "",
    oauth.authServerMetadataUrl ?? "",
    oauth.xaa?.toString() ?? "",
  ].join("|");
}

function stableHexHash(value: string): string {
  let hash = 0xcbf2_9ce4_8422_2325n;
  for (const byte of value.split("").map((c) => BigInt(c.charCodeAt(0)))) {
    hash ^= byte;
    hash = hash * 0x0100_0000_01b3n;
  }
  return hash.toString(16).padStart(16, "0");
}

function collapseUnderscores(value: string): string {
  let collapsed = "";
  let lastWasUnderscore = false;
  for (const ch of value.split("")) {
    if (ch === "_") {
      if (!lastWasUnderscore) {
        collapsed += ch;
      }
      lastWasUnderscore = true;
    } else {
      collapsed += ch;
      lastWasUnderscore = false;
    }
  }
  return collapsed;
}

function percentDecode(value: string): string {
  const bytes = value.split("").map((c) => c.charCodeAt(0));
  let decoded: number[] = [];
  let index = 0;
  
  while (index < bytes.length) {
    const byte = bytes[index];
    if (byte === 37 && index + 2 < bytes.length) {
      const hex = value.slice(index + 1, index + 3);
      const parsed = parseInt(hex, 16);
      if (!isNaN(parsed)) {
        decoded.push(parsed);
        index += 3;
        continue;
      }
      decoded.push(byte);
      index += 1;
    } else if (byte === 43) {
      decoded.push(32);
      index += 1;
    } else {
      decoded.push(byte);
      index += 1;
    }
  }
  
  return String.fromCharCode(...decoded);
}

export function getTransportType(config: McpServerConfig): McpTransport {
  return config.type;
}
