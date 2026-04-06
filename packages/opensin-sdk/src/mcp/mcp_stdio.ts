import type { JSONValue } from "../types";
import type { McpStdioTransport, McpClientTransport } from "./mcp_client";
import { mcpToolName } from "./mcp";

export type JsonRpcId = number | string | null;

export interface JsonRpcRequest<T = JSONValue> {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: string;
  params?: T;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: JSONValue;
}

export interface JsonRpcResponse<T = JSONValue> {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: T;
  error?: JsonRpcError;
}

export function createJsonRpcRequest<T>(
  id: JsonRpcId,
  method: string,
  params?: T
): JsonRpcRequest<T> {
  return {
    jsonrpc: "2.0",
    id,
    method,
    params,
  };
}

export interface McpInitializeParams {
  protocolVersion: string;
  capabilities: JSONValue;
  clientInfo: McpInitializeClientInfo;
}

export interface McpInitializeClientInfo {
  name: string;
  version: string;
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: JSONValue;
  serverInfo: McpInitializeServerInfo;
}

export interface McpInitializeServerInfo {
  name: string;
  version: string;
}

export interface McpListToolsParams {
  cursor?: string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: JSONValue;
  annotations?: JSONValue;
  _meta?: JSONValue;
}

export interface McpListToolsResult {
  tools: McpTool[];
  nextCursor?: string;
}

export interface McpToolCallParams {
  name: string;
  arguments?: JSONValue;
  _meta?: JSONValue;
}

export interface McpToolCallContent {
  type: string;
  [key: string]: JSONValue;
}

export interface McpToolCallResult {
  content: McpToolCallContent[];
  structuredContent?: JSONValue;
  isError?: boolean;
  _meta?: JSONValue;
}

export interface McpListResourcesParams {
  cursor?: string;
}

export interface McpResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  annotations?: JSONValue;
  _meta?: JSONValue;
}

export interface McpListResourcesResult {
  resources: McpResource[];
  nextCursor?: string;
}

export interface McpReadResourceParams {
  uri: string;
}

export interface McpResourceContents {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
  _meta?: JSONValue;
}

export interface McpReadResourceResult {
  contents: McpResourceContents[];
}

export interface ManagedMcpTool {
  serverName: string;
  qualifiedName: string;
  rawName: string;
  tool: McpTool;
}

export interface UnsupportedMcpServer {
  serverName: string;
  transport: string;
  reason: string;
}

export type McpServerManagerError =
  | { type: "io"; message: string }
  | { type: "jsonRpc"; serverName: string; method: string; error: JsonRpcError }
  | { type: "invalidResponse"; serverName: string; method: string; details: string }
  | { type: "unknownTool"; qualifiedName: string }
  | { type: "unknownServer"; serverName: string };

export function getErrorMessage(error: McpServerManagerError): string {
  switch (error.type) {
    case "io":
      return error.message;
    case "jsonRpc":
      return `MCP server "${error.serverName}" returned JSON-RPC error for ${error.method}: ${error.error.message} (${error.error.code})`;
    case "invalidResponse":
      return `MCP server "${error.serverName}" returned invalid response for ${error.method}: ${error.details}`;
    case "unknownTool":
      return `unknown MCP tool "${error.qualifiedName}"`;
    case "unknownServer":
      return `unknown MCP server "${error.serverName}"`;
  }
}

export interface ToolRoute {
  serverName: string;
  rawName: string;
}

export interface ManagedMcpServer {
  bootstrap: unknown;
  process: McpStdioProcess | null;
  initialized: boolean;
}

export interface McpServerManager {
  servers: Map<string, ManagedMcpServer>;
  unsupportedServers: UnsupportedMcpServer[];
  toolIndex: Map<string, ToolRoute>;
  nextRequestId: number;
}

export class McpStdioProcess {
  private process: ReturnType<typeof spawnStdioProcess> | null = null;
  private requestId = 1;

  constructor(transport: McpStdioTransport) {
    this.process = spawnStdioProcess(transport);
  }

  async initialize(
    params: McpInitializeParams = defaultInitializeParams()
  ): Promise<JsonRpcResponse<McpInitializeResult>> {
    return this.request<McpInitializeParams, McpInitializeResult>("initialize", params);
  }

  async listTools(
    params?: McpListToolsParams
  ): Promise<JsonRpcResponse<McpListToolsResult>> {
    return this.request<McpListToolsParams, McpListToolsResult>("tools/list", params);
  }

  async callTool(
    params: McpToolCallParams
  ): Promise<JsonRpcResponse<McpToolCallResult>> {
    return this.request<McpToolCallParams, McpToolCallResult>("tools/call", params);
  }

  async listResources(
    params?: McpListResourcesParams
  ): Promise<JsonRpcResponse<McpListResourcesResult>> {
    return this.request<McpListResourcesParams, McpListResourcesResult>(
      "resources/list",
      params
    );
  }

  async readResource(
    params: McpReadResourceParams
  ): Promise<JsonRpcResponse<McpReadResourceResult>> {
    return this.request<McpReadResourceParams, McpReadResourceResult>(
      "resources/read",
      params
    );
  }

  async terminate(): Promise<void> {
    if (this.process) {
      try {
        this.process.kill();
      } catch {
        // Process may have already exited
      }
    }
  }

  async wait(): Promise<number> {
    if (this.process) {
      const status = await this.process.status;
      return status;
    }
    return 0;
  }

  private async request<TParams, TResult>(
    method: string,
    params?: TParams
  ): Promise<JsonRpcResponse<TResult>> {
    if (!this.process) {
      throw new Error("Process not initialized");
    }

    const id = this.requestId++;
    const request = createJsonRpcRequest(id, method, params);

    await this.sendMessage(request);
    return this.readMessage<TResult>();
  }

  private async sendMessage<T>(message: T): Promise<void> {
    if (!this.process) {
      throw new Error("Process not initialized");
    }

    const body = JSON.stringify(message);
    const encoded = encodeFrame(body);
    await this.process.stdin.write(encoded);
    await this.process.stdin.flush();
  }

  private async readMessage<T>(): Promise<JsonRpcResponse<T>> {
    if (!this.process) {
      throw new Error("Process not initialized");
    }

    const contentLength = await this.readHeader();
    const payload = await this.process.stdout.read(contentLength);
    return JSON.parse(payload.toString()) as JsonRpcResponse<T>;
  }

  private async readHeader(): Promise<number> {
    if (!this.process) {
      throw new Error("Process not initialized");
    }

    let contentLength: number | null = null;
    let line = "";

    while (true) {
      const char = await this.process.stdout.read(1);
      if (char.length === 0) {
        throw new Error("MCP stdio stream closed while reading headers");
      }
      
      line += char.toString();
      if (line.endsWith("\r\n\r\n")) {
        break;
      }
    }

    for (const headerLine of line.split("\r\n")) {
      if (headerLine.toLowerCase().startsWith("content-length:")) {
        const value = headerLine.split(":")[1].trim();
        contentLength = parseInt(value, 10);
        if (isNaN(contentLength)) {
          throw new Error("Invalid Content-Length header");
        }
      }
    }

    if (contentLength === null) {
      throw new Error("Missing Content-Length header");
    }

    return contentLength;
  }
}

interface StdioProcessHandle {
  stdin: {
    write(data: Uint8Array): Promise<void>;
    flush(): Promise<void>;
  };
  stdout: {
    read(size: number): Promise<Buffer>;
  };
  kill(): void;
  status: Promise<number>;
}

function spawnStdioProcess(transport: McpStdioTransport): StdioProcessHandle {
  const command = transport.command;
  const args = transport.args;
  
  const proc = {
    stdin: {
      write: async (data: Uint8Array): Promise<void> => {
        process.stdout.write(data.toString());
      },
      flush: async (): Promise<void> => {
        // No-op for now
      },
    },
    stdout: {
      read: async (_size: number): Promise<Buffer> => {
        return Buffer.from("");
      },
    },
    kill: (): void => {
      // Placeholder
    },
    status: Promise.resolve(0),
  };

  return proc;
}

function encodeFrame(payload: string): Uint8Array {
  const header = `Content-Length: ${payload.length}\r\n\r\n`;
  const encoded = header + payload;
  return new TextEncoder().encode(encoded);
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

export function createMcpServerManager(
  servers: Map<string, unknown>
): McpServerManager {
  return {
    servers: new Map(),
    unsupportedServers: [],
    toolIndex: new Map(),
    nextRequestId: 1,
  };
}

export function spawnMcpStdioProcess(
  transport: McpClientTransport
): McpStdioProcess | null {
  if (transport.type === "stdio") {
    return new McpStdioProcess(transport);
  }
  return null;
}
