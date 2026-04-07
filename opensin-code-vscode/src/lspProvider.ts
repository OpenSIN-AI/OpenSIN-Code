import * as vscode from 'vscode';

export class LSPProvider {
  private outputChannel: vscode.OutputChannel;
  private client: vscode.LanguageClient | null = null;
  private isRunningState: boolean = false;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  isRunning(): boolean {
    return this.isRunningState;
  }

  async start(): Promise<void> {
    if (this.isRunningState) {
      this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Already running`);
      return;
    }

    try {
      const serverModule = vscode.extensions.getExtension('opensin-ai.opensin-code-vscode')
        ? vscode.extensions.getExtension('opensin-ai.opensin-code-vscode')!.extensionPath + '/out/lspServer.js'
        : null;

      if (!serverModule) {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Server module not found, using stdio transport`);
        return;
      }

      const serverOptions: vscode.ServerOptions = {
        run: { module: serverModule, transport: vscode.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode.TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6009'] } }
      };

      const clientOptions: vscode.LanguageClientOptions = {
        documentSelector: [
          { scheme: 'file', language: 'typescript' },
          { scheme: 'file', language: 'javascript' },
          { scheme: 'file', language: 'python' },
          { scheme: 'file', language: 'go' },
          { scheme: 'file', language: 'rust' }
        ],
        synchronize: {
          fileEvents: vscode.workspace.createFileSystemWatcher('**/*.{ts,js,py,go,rs}')
        },
        outputChannel: this.outputChannel
      };

      this.client = new vscode.LanguageClient('opensin-lsp', 'OpenSIN Language Server', serverOptions, clientOptions);
      await this.client.start();
      this.isRunningState = true;
      this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Server started`);
    } catch (err) {
      this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Start failed — ${err}`);
      this.isRunningState = false;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunningState || !this.client) {
      return;
    }

    try {
      await this.client.stop();
      this.isRunningState = false;
      this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Server stopped`);
    } catch (err) {
      this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Stop failed — ${err}`);
    }
  }

  async restart(): Promise<void> {
    this.outputChannel.appendLine(`[${new Date().toISOString()}] LSP: Restarting...`);
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 500));
    await this.start();
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isRunningState || !this.client) {
      return false;
    }

    try {
      const response = await this.client.sendRequest('$/opensin/health');
      return response?.status === 'ok';
    } catch {
      return this.isRunningState;
    }
  }

  getDiagnostics(uri: vscode.Uri): vscode.Diagnostic[] {
    if (!this.client) return [];
    return vscode.languages.getDiagnostics(uri);
  }

  async executeCommand(command: string, args?: unknown[]): Promise<unknown> {
    if (!this.client || !this.isRunningState) {
      throw new Error('OpenSIN LSP is not running');
    }
    return this.client.sendRequest('workspace/executeCommand', { command, arguments: args });
  }

  dispose(): void {
    if (this.client) {
      this.client.stop();
      this.client = null;
    }
    this.isRunningState = false;
  }
}
