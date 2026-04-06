/**
 * LSP Manager — manages multiple language server instances (Sin-branded).
 */

import { LspClient } from "./client.js";
import {
  LspServerConfig,
  LspError,
  LspErrorCode,
  SymbolLocation,
  WorkspaceDiagnostics,
  FileDiagnostics,
  createWorkspaceDiagnostics,
  isEmptyDiagnostics,
  normalizeExtension,
} from "./types.js";
import { Position, Diagnostic } from "vscode-languageserver-protocol";

interface ServerConfigMap {
  [name: string]: LspServerConfig;
}

interface ExtensionMap {
  [extension: string]: string;
}

interface ClientCache {
  [name: string]: LspClient;
}

export class LspManager {
  private serverConfigs: ServerConfigMap;
  private extensionMap: ExtensionMap;
  private clients: Map<string, LspClient>;

  constructor(serverConfigs: LspServerConfig[]) {
    const configsByName: ServerConfigMap = {};
    const extensionMap: ExtensionMap = {};

    for (const config of serverConfigs) {
      for (const extension of Object.keys(config.extensionToLanguage)) {
        const normalized = normalizeExtension(extension);
        if (extensionMap[normalized]) {
          throw LspError.duplicateExtension(
            normalized,
            extensionMap[normalized],
            config.name
          );
        }
        extensionMap[normalized] = config.name;
      }
      configsByName[config.name] = config;
    }

    this.serverConfigs = configsByName;
    this.extensionMap = extensionMap;
    this.clients = new Map();
  }

  supportsPath(filePath: string): boolean {
    const ext = filePath.split(".").pop();
    if (!ext) return false;
    const normalized = normalizeExtension(ext);
    return normalized in this.extensionMap;
  }

  async openDocument(filePath: string, text: string): Promise<void> {
    const client = await this.clientForPath(filePath);
    await client.openDocument(filePath, text);
  }

  async syncDocumentFromDisk(filePath: string): Promise<void> {
    const fs = require("fs");
    const contents = fs.readFileSync(filePath, "utf-8");
    await this.changeDocument(filePath, contents);
    await this.saveDocument(filePath);
  }

  async changeDocument(filePath: string, text: string): Promise<void> {
    const client = await this.clientForPath(filePath);
    await client.changeDocument(filePath, text);
  }

  async saveDocument(filePath: string): Promise<void> {
    const client = await this.clientForPath(filePath);
    await client.saveDocument(filePath);
  }

  async closeDocument(filePath: string): Promise<void> {
    const client = await this.clientForPath(filePath);
    await client.closeDocument(filePath);
  }

  async goToDefinition(
    filePath: string,
    position: Position
  ): Promise<SymbolLocation[]> {
    const client = await this.clientForPath(filePath);
    let locations = await client.goToDefinition(filePath, position);
    locations = dedupeLocations(locations);
    return locations;
  }

  async findReferences(
    filePath: string,
    position: Position,
    includeDeclaration: boolean
  ): Promise<SymbolLocation[]> {
    const client = await this.clientForPath(filePath);
    let locations = await client.findReferences(filePath, position, includeDeclaration);
    locations = dedupeLocations(locations);
    return locations;
  }

  async collectWorkspaceDiagnostics(): Promise<WorkspaceDiagnostics> {
    const files: FileDiagnostics[] = [];

    for (const client of this.clients.values()) {
      const diagnostics = await client.diagnosticsSnapshot();
      for (const [uri, diagList] of diagnostics.entries()) {
        const filePath = fileUrlToPath(uri);
        if (!filePath || diagList.length === 0) continue;
        files.push({
          path: filePath,
          uri,
          diagnostics: diagList,
        });
      }
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    return { files };
  }

  async contextEnrichment(
    filePath: string,
    position: Position
  ): Promise<{
    filePath: string;
    diagnostics: WorkspaceDiagnostics;
    definitions: SymbolLocation[];
    references: SymbolLocation[];
  }> {
    const diagnostics = await this.collectWorkspaceDiagnostics();
    const definitions = await this.goToDefinition(filePath, position);
    const references = await this.findReferences(filePath, position, true);

    return {
      filePath,
      diagnostics,
      definitions,
      references,
    };
  }

  async shutdown(): Promise<void> {
    const clientArray = Array.from(this.clients.values());
    this.clients.clear();

    for (const client of clientArray) {
      await client.shutdown();
    }
  }

  private async clientForPath(filePath: string): Promise<LspClient> {
    const ext = filePath.split(".").pop();
    if (!ext) {
      throw LspError.unsupportedDocument(filePath);
    }

    const normalized = normalizeExtension(ext);
    const serverName = this.extensionMap[normalized];
    if (!serverName) {
      throw LspError.unsupportedDocument(filePath);
    }

    const cached = this.clients.get(serverName);
    if (cached) return cached;

    const config = this.serverConfigs[serverName];
    if (!config) {
      throw LspError.unknownServer(serverName);
    }

    const client = await LspClient.connect(config);
    this.clients.set(serverName, client);
    return client;
  }
}

function dedupeLocations(locations: SymbolLocation[]): SymbolLocation[] {
  const seen = new Set<string>();
  return locations.filter((location) => {
    const key = `${location.path}:${location.range.start.line}:${location.range.start.character}:${location.range.end.line}:${location.range.end.character}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fileUrlToPath(fileUrl: string): string | null {
  try {
    const parsed = new URL(fileUrl);
    if (parsed.protocol === "file:") {
      return decodeURIComponent(parsed.pathname.replace(/^\/([A-Z]:)/, "$1"));
    }
  } catch {
    // Invalid URL
  }
  return null;
}

export { LspServerConfig, SymbolLocation, WorkspaceDiagnostics, LspError, LspErrorCode };