import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Background Memory Consolidation - Stolen from Claude Code leak
 * Implements the CLAUDE.md pattern but adapted for SIN Code (AGENTS.md)
 */
export class MemoryConsolidation {
    private memoryFiles: string[] = [];

    constructor(private workspaceRoot: string) {
        this.scanForMemoryFiles();
    }

    /**
     * Scan workspace for memory files (AGENTS.md, SIN-MEMORY.md, etc.)
     */
    private scanForMemoryFiles(): void {
        const patterns = ['AGENTS.md', 'SIN-MEMORY.md', 'CLAUDE.md', '.kairos-memory.md'];
        for (const pattern of patterns) {
            const filePath = path.join(this.workspaceRoot, pattern);
            if (fs.existsSync(filePath)) {
                this.memoryFiles.push(filePath);
            }
        }
    }

    /**
     * Read all memory files and consolidate context
     */
    public async getConsolidatedMemory(): Promise<string> {
        let memory = '';
        
        for (const file of this.memoryFiles) {
            try {
                const content = await fs.promises.readFile(file, 'utf-8');
                memory += `\n--- ${path.basename(file)} ---\n${content}\n`;
            } catch (err) {
                console.warn(`Failed to read memory file ${file}:`, err);
            }
        }

        return memory;
    }

    /**
     * Append new memory to the primary memory file
     */
    public async appendMemory(entry: string): Promise<void> {
        const primaryFile = path.join(this.workspaceRoot, 'SIN-MEMORY.md');
        
        const timestamp = new Date().toISOString();
        const memoryEntry = `\n## ${timestamp}\n${entry}\n`;

        try {
            if (!fs.existsSync(primaryFile)) {
                await fs.promises.writeFile(primaryFile, `# SIN Code Memory\n\n${memoryEntry}`);
                this.memoryFiles.push(primaryFile);
            } else {
                await fs.promises.appendFile(primaryFile, memoryEntry);
            }
        } catch (err) {
            console.error('Failed to append memory:', err);
        }
    }

    /**
     * Watch for changes to memory files
     */
    public startWatching(): vscode.Disposable {
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.workspaceRoot, '**/{AGENTS.md,SIN-MEMORY.md,CLAUDE.md}')
        );

        watcher.onDidChange(() => {
            this.scanForMemoryFiles();
            vscode.window.showInformationMessage('Memory files updated, context refreshed.');
        });

        return watcher;
    }
}
