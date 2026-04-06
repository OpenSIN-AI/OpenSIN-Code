/**
 * LSP Context Enrichment Types — Sin-branded type definitions.
 */

import { Range, Position, Diagnostic } from "vscode-languageserver-protocol";

export interface LspServerConfig {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
  workspaceRoot: string;
  initializationOptions?: unknown;
  extensionToLanguage: Record<string, string>;
}

export function normalizeExtension(extension: string): string {
  if (extension.startsWith(".")) {
    return extension.toLowerCase();
  }
  return `.${extension.toLowerCase()}`;
}

export function languageIdFor(config: LspServerConfig, filePath: string): string | null {
  const ext = normalizeExtension(filePath.split(".").pop() || "");
  return config.extensionToLanguage[ext] || null;
}

export interface FileDiagnostics {
  path: string;
  uri: string;
  diagnostics: Diagnostic[];
}

export interface WorkspaceDiagnostics {
  files: FileDiagnostics[];
}

export function createWorkspaceDiagnostics(): WorkspaceDiagnostics {
  return { files: [] };
}

export function isEmptyDiagnostics(diagnostics: WorkspaceDiagnostics): boolean {
  return diagnostics.files.length === 0;
}

export function totalDiagnostics(diagnostics: WorkspaceDiagnostics): number {
  return diagnostics.files.reduce((sum, file) => sum + file.diagnostics.length, 0);
}

export interface SymbolLocation {
  path: string;
  range: Range;
}

export function startLine(location: SymbolLocation): number {
  return location.range.start.line + 1;
}

export function startCharacter(location: SymbolLocation): number {
  return location.range.start.character + 1;
}

export function formatSymbolLocation(location: SymbolLocation): string {
  return `${location.path}:${startLine(location)}:${startCharacter(location)}`;
}

export interface LspContextEnrichment {
  filePath: string;
  diagnostics: WorkspaceDiagnostics;
  definitions: SymbolLocation[];
  references: SymbolLocation[];
}

export const MAX_RENDERED_DIAGNOSTICS = 12;
export const MAX_RENDERED_LOCATIONS = 12;

export function renderPromptSection(enrichment: LspContextEnrichment): string {
  const lines: string[] = ["# LSP context"];
  lines.push(` - Focus file: ${enrichment.filePath}`);
  lines.push(
    ` - Workspace diagnostics: ${totalDiagnostics(enrichment.diagnostics)} across ${enrichment.diagnostics.files.length} file(s)`
  );

  if (!isEmptyDiagnostics(enrichment.diagnostics)) {
    lines.push("");
    lines.push("Diagnostics:");
    let rendered = 0;
    for (const file of enrichment.diagnostics.files) {
      for (const diagnostic of file.diagnostics) {
        if (rendered === MAX_RENDERED_DIAGNOSTICS) {
          lines.push(" - Additional diagnostics omitted for brevity.");
          break;
        }
        const severity = diagnosticSeverityLabel(diagnostic.severity);
        lines.push(
          ` - ${file.path}:${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1} [${severity}] ${diagnostic.message.replace(/\n/g, " ")}`
        );
        rendered++;
      }
      if (rendered === MAX_RENDERED_DIAGNOSTICS) break;
    }
  }

  if (enrichment.definitions.length > 0) {
    lines.push("");
    lines.push("Definitions:");
    for (const location of enrichment.definitions.slice(0, MAX_RENDERED_LOCATIONS)) {
      lines.push(` - ${formatSymbolLocation(location)}`);
    }
    if (enrichment.definitions.length > MAX_RENDERED_LOCATIONS) {
      lines.push(" - Additional definitions omitted for brevity.");
    }
  }

  if (enrichment.references.length > 0) {
    lines.push("");
    lines.push("References:");
    for (const location of enrichment.references.slice(0, MAX_RENDERED_LOCATIONS)) {
      lines.push(` - ${formatSymbolLocation(location)}`);
    }
    if (enrichment.references.length > MAX_RENDERED_LOCATIONS) {
      lines.push(" - Additional references omitted for brevity.");
    }
  }

  return lines.join("\n");
}

function diagnosticSeverityLabel(severity?: Diagnostic["severity"]): string {
  switch (severity) {
    case 1: // Error
      return "error";
    case 2: // Warning
      return "warning";
    case 3: // Information
      return "info";
    case 4: // Hint
      return "hint";
    default:
      return "unknown";
  }
}

export interface ServerCapabilities {
  definitionProvider?: boolean;
  referencesProvider?: boolean;
  textDocumentSync?: number;
  publishDiagnostics?: { relatedInformation?: boolean };
}

export interface InitializeResult {
  capabilities: ServerCapabilities;
}