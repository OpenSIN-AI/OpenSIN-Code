import * as vscode from 'vscode';
import { spawn } from 'child_process';

export interface DiagnosticInfo {
    file: string;
    severity: string;
    message: string;
    line: number;
    character: number;
}

export interface SymbolInfo {
    name: string;
    kind: string;
    file: string;
    line: number;
}

/**
 * LSP Provider that bridges to Simone MCP for semantic context.
 * Uses the local simone mcp server for LSP operations.
 */
export class LspProvider {
    /**
     * Get current file diagnostics from VS Code's diagnostic API
     */
    public getCurrentDiagnostics(): DiagnosticInfo[] {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return [];

        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        return diagnostics.map(d => ({
            file: editor.document.fileName,
            severity: d.severity === vscode.DiagnosticSeverity.Error ? 'error' : 
                     d.severity === vscode.DiagnosticSeverity.Warning ? 'warning' : 'info',
            message: d.message,
            line: d.range.start.line,
            character: d.range.start.character
        }));
    }

    /**
     * Get symbols from current file using LSP
     */
    public async getSymbolsInFile(): Promise<SymbolInfo[]> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return [];

        return new Promise((resolve) => {
            const process = spawn('simone-mcp', ['symbols', '--file', editor.document.fileName, '--format', 'json']);
            let output = '';
            process.stdout.on('data', (data) => output += data.toString());
            process.on('close', () => {
                try {
                    const symbols = JSON.parse(output);
                    resolve(Array.isArray(symbols) ? symbols.map((s: any) => ({
                        name: s.name,
                        kind: s.kind,
                        file: editor.document.fileName,
                        line: s.line || 0
                    })) : []);
                } catch {
                    resolve([]);
                }
            });
            process.on('error', () => resolve([]));
        });
    }

    /**
     * Get semantic context for current cursor position
     */
    public async getSemanticContext(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return '';

        const selection = editor.selection;
        const word = editor.document.getText(editor.document.getWordRangeAtPosition(selection.active));
        const diagnostics = this.getCurrentDiagnostics();
        const symbols = await this.getSymbolsInFile();

        let context = `**Current File:** ${editor.document.fileName}\n`;
        if (word) context += `**Cursor Word:** ${word}\n`;
        
        if (diagnostics.length > 0) {
            context += `\n**Diagnostics (${diagnostics.length}):**\n`;
            diagnostics.slice(0, 5).forEach(d => {
                context += `- [${d.severity.toUpperCase()}] Line ${d.line + 1}: ${d.message}\n`;
            });
        }

        if (symbols.length > 0) {
            context += `\n**Symbols in File:** ${symbols.map(s => s.name).join(', ')}\n`;
        }

        return context;
    }
}
