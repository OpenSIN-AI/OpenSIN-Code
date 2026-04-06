/**
 * LSP Server Integration — manages LSP server lifecycle (Sin-branded).
 */

import { spawn, ChildProcess } from "child_process";
import * as url from "url";
import * as path from "path";
import { LspClient, LspError, LspServerConfig, SymbolLocation } from "./types.js";
import { Position, Diagnostic } from "vscode-languageserver-protocol";

interface ServerCapabilities {
  definitionProvider?: boolean;
  referencesProvider?: boolean;
  textDocumentSync?: number;
  publishDiagnostics?: { relatedInformation?: boolean };
}

interface InitializeResult {
  capabilities: ServerCapabilities;
}

interface InitializeParams {
  processId: number;
  rootUri: string;
  rootPath: string;
  workspaceFolders: Array<{ uri: string; name: string }>;
  initializationOptions: unknown;
  capabilities: {
    textDocument?: {
      publishDiagnostics?: { relatedInformation?: boolean };
      definition?: { linkSupport?: boolean };
      references?: Record<string, unknown>;
    };
    workspace?: {
      configuration?: boolean;
      workspaceFolders?: boolean;
    };
    general?: {
      positionEncodings?: string[];
    };
  };
}

export interface TextDocumentItem {
  uri: string;
  languageId: string;
  version: number;
  text: string;
}

interface DidOpenTextDocumentParams {
  textDocument: TextDocumentItem;
}

interface DidChangeTextDocumentParams {
  textDocument: { uri: string; version: number };
  contentChanges: Array<{ text: string }>;
}

interface DidSaveTextDocumentParams {
  textDocument: { uri: string };
}

interface DidCloseTextDocumentParams {
  textDocument: { uri: string };
}

interface DefinitionParams {
  textDocument: { uri: string };
  position: Position;
}

interface ReferencesParams {
  textDocument: { uri: string };
  position: Position;
  context: { includeDeclaration: boolean };
}

export class LspServer {
  private config: LspServerConfig;
  private process: ChildProcess | null = null;
  private pendingRequests: Map<number, (result: unknown) => void> = new Map();
  private diagnostics: Map<string, Diagnostic[]> = new Map();
  private openDocuments: Map<string, number> = new Map();
  private nextRequestId = 1;
  private messageBuffer = "";
  private initialized = false;
  private initializedResolve: (() => void) | null = null;
  private initializedReject: ((err: Error) => void) | null = null;

  static async start(config: LspServerConfig): Promise<LspServer> {
    const server = new LspServer(config);
    await server.initialize();
    return server;
  }

  private constructor(config: LspServerConfig) {
    this.config = config;
  }

  private async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.initializedResolve = resolve;
      this.initializedReject = reject;

      const spawnOptions: Parameters<typeof spawn>[2] = {
        cwd: this.config.workspaceRoot,
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env, ...this.config.env },
      };

      this.process = spawn(this.config.command, this.config.args, spawnOptions);

      if (!this.process.stdin || !this.process.stdout || !this.process.stderr) {
        reject(new LspError("PROTOCOL", "Missing LSP stdin/stdout/stderr pipes"));
        return;
      }

      this.process.stdout.on("data", (data: Buffer) => this.handleData(data));
      this.process.stderr.on("data", (data: Buffer) => {
        console.error("[LSP stderr]", data.toString());
      });

      this.process.on("error", (err) => {
        reject(new LspError("PROTOCOL", `Process error: ${err.message}`));
      });

      this.process.on("exit", (code) => {
        console.log(`[LSP process exited with code ${code}]`);
      });

      this.sendInitialize();
    });
  }

  private handleData(data: Buffer): void {
    this.messageBuffer += data.toString();
    this.processMessages();
  }

  private processMessages(): void {
    const headerEnd = this.messageBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const headerPart = this.messageBuffer.substring(0, headerEnd);
    const contentLengthMatch = headerPart.match(/Content-Length:\s*(\d+)/i);

    if (!contentLengthMatch) {
      this.messageBuffer = this.messageBuffer.substring(headerEnd + 4);
      return;
    }

    const contentLength = parseInt(contentLengthMatch[1], 10);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;

    if (this.messageBuffer.length < bodyEnd) return;

    const body = this.messageBuffer.substring(bodyStart, bodyEnd);
    this.messageBuffer = this.messageBuffer.substring(bodyEnd);

    try {
      const message = JSON.parse(body);
      this.handleMessage(message);
    } catch (err) {
      console.error("[LSP] Failed to parse message:", err);
    }

    if (this.messageBuffer.length > 0) {
      this.processMessages();
    }
  }

  private handleMessage(message: Record<string, unknown>): void {
    if ("id" in message) {
      const id = message.id as number;
      const pending = this.pendingRequests.get(id);
      if (pending) {
        this.pendingRequests.delete(id);
        if ("error" in message) {
          pending(new LspError("PROTOCOL", JSON.stringify(message.error)));
        } else {
          pending(message.result);
        }
      }
      return;
    }

    if ("method" in message) {
      const method = message.method as string;

      if (method === "textDocument/publishDiagnostics") {
        const params = message.params as {
          uri: string;
          diagnostics: Diagnostic[];
        };
        if (params.diagnostics.length === 0) {
          this.diagnostics.delete(params.uri);
        } else {
          this.diagnostics.set(params.uri, params.diagnostics);
        }
        return;
      }

      if (method === "initialized") {
        this.initialized = true;
        if (this.initializedResolve) {
          this.initializedResolve();
        }
        return;
      }
    }
  }

  private async sendRequest<T>(method: string, params: unknown): Promise<T> {
    if (!this.initialized) {
      await new Promise<void>((resolve, reject) => {
        this.initializedResolve = resolve;
        this.initializedReject = reject;
        setTimeout(() => reject(new LspError("PROTOCOL", "Initialization timeout")), 10000);
      });
    }

    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result as T);
        }
      });

      const payload = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      });

      this.process?.stdin?.write(
        `Content-Length: ${payload.length}\r\n\r\n${payload}`
      );

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new LspError("PROTOCOL", `Request ${method} timed out`));
        }
      }, 30000);
    });
  }

  private sendNotify(method: string, params: unknown): void {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
    });

    this.process?.stdin?.write(
      `Content-Length: ${payload.length}\r\n\r\n${payload}`
    );
  }

  private sendInitialize(): void {
    const workspaceUri = pathToFileUrl(this.config.workspaceRoot);

    const params: InitializeParams = {
      processId: process.pid,
      rootUri: workspaceUri,
      rootPath: this.config.workspaceRoot,
      workspaceFolders: [
        {
          uri: workspaceUri,
          name: this.config.name,
        },
      ],
      initializationOptions: this.config.initializationOptions ?? null,
      capabilities: {
        textDocument: {
          publishDiagnostics: {
            relatedInformation: true,
          },
          definition: {
            linkSupport: true,
          },
          references: {},
        },
        workspace: {
          configuration: false,
          workspaceFolders: true,
        },
        general: {
          positionEncodings: ["utf-16"],
        },
      },
    };

    this.sendRequest<InitializeResult>("initialize", params)
      .then(() => {
        this.sendNotify("initialized", {});
      })
      .catch((err) => {
        if (this.initializedReject) {
          this.initializedReject(err);
        }
      });
  }

  async ensureDocumentOpen(filePath: string): Promise<void> {
    if (this.isDocumentOpen(filePath)) return;

    const contents = require("fs").readFileSync(filePath, "utf-8");
    await this.openDocument(filePath, contents);
  }

  async openDocument(filePath: string, text: string): Promise<void> {
    const uri = pathToFileUrl(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const languageId = this.config.extensionToLanguage[ext];

    if (!languageId) {
      throw LspError.unsupportedDocument(filePath);
    }

    this.sendNotify("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId,
        version: 1,
        text,
      },
    } as DidOpenTextDocumentParams);

    this.openDocuments.set(filePath, 1);
  }

  async changeDocument(filePath: string, text: string): Promise<void> {
    if (!this.isDocumentOpen(filePath)) {
      return this.openDocument(filePath, text);
    }

    const uri = pathToFileUrl(filePath);
    const nextVersion = (this.openDocuments.get(filePath) || 0) + 1;
    this.openDocuments.set(filePath, nextVersion);

    this.sendNotify("textDocument/didChange", {
      textDocument: {
        uri,
        version: nextVersion,
      },
      contentChanges: [{ text }],
    } as DidChangeTextDocumentParams);
  }

  async saveDocument(filePath: string): Promise<void> {
    if (!this.isDocumentOpen(filePath)) return;

    this.sendNotify("textDocument/didSave", {
      textDocument: {
        uri: pathToFileUrl(filePath),
      },
    } as DidSaveTextDocumentParams);
  }

  async closeDocument(filePath: string): Promise<void> {
    if (!this.isDocumentOpen(filePath)) return;

    this.sendNotify("textDocument/didClose", {
      textDocument: {
        uri: pathToFileUrl(filePath),
      },
    } as DidCloseTextDocumentParams);

    this.openDocuments.delete(filePath);
  }

  isDocumentOpen(filePath: string): boolean {
    return this.openDocuments.has(filePath);
  }

  async goToDefinition(
    filePath: string,
    position: Position
  ): Promise<SymbolLocation[]> {
    await this.ensureDocumentOpen(filePath);

    const response = await this.sendRequest<SymbolLocation[] | { uri: string; range: { start: Position; end: Position } }[] | null>(
      "textDocument/definition",
      {
        textDocument: { uri: pathToFileUrl(filePath) },
        position,
      } as DefinitionParams
    );

    if (!response) return [];

    if (Array.isArray(response)) {
      return response
        .map((loc) => {
          if ("uri" in loc) {
            const filePath = fileUrlToPath(loc.uri);
            if (!filePath) return null;
            return { path: filePath, range: loc.range };
          }
          return null;
        })
        .filter((loc): loc is SymbolLocation => loc !== null);
    }

    return [];
  }

  async findReferences(
    filePath: string,
    position: Position,
    includeDeclaration: boolean
  ): Promise<SymbolLocation[]> {
    await this.ensureDocumentOpen(filePath);

    const response = await this.sendRequest<Array<{ uri: string; range: { start: Position; end: Position } }> | null>(
      "textDocument/references",
      {
        textDocument: { uri: pathToFileUrl(filePath) },
        position,
        context: { includeDeclaration },
      } as ReferencesParams
    );

    if (!response) return [];

    return response
      .map((loc) => {
        const filePath = fileUrlToPath(loc.uri);
        if (!filePath) return null;
        return { path: filePath, range: loc.range };
      })
      .filter((loc): loc is SymbolLocation => loc !== null);
  }

  async diagnosticsSnapshot(): Promise<Map<string, Diagnostic[]>> {
    return new Map(this.diagnostics);
  }

  async shutdown(): Promise<void> {
    try {
      await this.sendRequest<null>("shutdown", {});
    } catch {
      // Ignore shutdown errors
    }

    this.sendNotify("exit", null);

    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): LspServerConfig {
    return this.config;
  }
}

function pathToFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("/")) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}

function fileUrlToPath(fileUrl: string): string | null {
  try {
    const parsed = url.parse(fileUrl);
    if (parsed.protocol === "file:") {
      return decodeURIComponent(parsed.pathname || "");
    }
  } catch {
    // Invalid URL
  }
  return null;
}

export { LspError, LspServerConfig, SymbolLocation };