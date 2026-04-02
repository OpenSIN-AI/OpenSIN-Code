import * as path from 'path';
import * as vscode from 'vscode';
import { SinCodeBridge } from './cliBridge';
import { AGENT_MODES, AgentMode } from './modes';
import { LspProvider } from './lspProvider';
import { SwarmCoordinator, AVAILABLE_AGENTS } from './swarmCoordinator';
import { BuddySystem } from './buddyGamification';
import { MemoryConsolidation } from './memoryConsolidation';

export function activate(context: vscode.ExtensionContext) {
    console.log('SIN Code VS Code extension is now active!');

    // Initialize providers
    const lspProvider = new LspProvider();
    const swarmCoordinator = new SwarmCoordinator();
    const buddySystem = new BuddySystem();
    
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const memoryConsolidation = workspaceRoot ? new MemoryConsolidation(workspaceRoot) : null;
    if (memoryConsolidation) {
        context.subscriptions.push(memoryConsolidation.startWatching());
    }

    // Register Webview Provider
    const provider = new KairosViewProvider(context.extensionUri, lspProvider, swarmCoordinator, buddySystem, memoryConsolidation);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('sincode.chatView', provider)
    );

    // Mode Selector Status Bar
    const modeStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    modeStatusBar.command = 'sincode.selectMode';
    context.subscriptions.push(modeStatusBar);

    // Model Selector Status Bar
    const modelStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    modelStatusBar.command = 'sincode.selectModel';
    context.subscriptions.push(modelStatusBar);

    // Initialize defaults
    provider.setCurrentMode(AGENT_MODES[1]); // Default: Code mode
    provider.setCurrentModel('opencode/qwen3.6-plus-free');
    modeStatusBar.text = `$(symbol-misc) ${AGENT_MODES[1].name}`;
    modeStatusBar.tooltip = 'SIN Code Mode - Click to change';
    modeStatusBar.show();
    modelStatusBar.text = `$(symbol-constant) qwen3.6-plus`;
    modelStatusBar.tooltip = 'Current Model - Click to change';
    modelStatusBar.show();

    // Mode selection command
    context.subscriptions.push(vscode.commands.registerCommand('sincode.selectMode', async () => {
        const items = AGENT_MODES.map(m => ({
            label: `${m.icon} ${m.name}`,
            description: m.description,
            mode: m
        }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select SIN Code Mode' });
        if (selected) {
            provider.setCurrentMode(selected.mode);
            modeStatusBar.text = `$(symbol-misc) ${selected.mode.name}`;
            provider.notifyModeChange(selected.mode);
        }
    }));

    // Model selection command
    context.subscriptions.push(vscode.commands.registerCommand('sincode.selectModel', async () => {
        const models = await provider.getModels();
        const items = models.map(m => ({ label: m }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select Model' });
        if (selected) {
            provider.setCurrentModel(selected.label);
            modelStatusBar.text = `$(symbol-constant) ${selected.label.split('/').pop() || selected.label}`;
        }
    }));

    // Swarm Coordinator Command
    context.subscriptions.push(vscode.commands.registerCommand('sincode.swarmDispatch', async () => {
        const agentItems = AVAILABLE_AGENTS.map(a => ({
            label: `${a.icon} ${a.name}`,
            description: a.description,
            agent: a.id
        }));
        const selectedAgent = await vscode.window.showQuickPick(agentItems, { placeHolder: 'Select Agent to Dispatch' });
        if (!selectedAgent) return;

        const prompt = await vscode.window.showInputBox({ prompt: `Enter task for ${selectedAgent.agent}` });
        if (!prompt) return;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Dispatching ${selectedAgent.agent}...`,
            cancellable: false
        }, async (progress) => {
            try {
                const result = await swarmCoordinator.dispatchTask(selectedAgent.agent, prompt);
                buddySystem.onActionSuccess(`Swarm task completed (${selectedAgent.agent})`, 20);
                vscode.window.showInformationMessage(`Task completed by ${selectedAgent.agent}`);
            } catch (error: any) {
                buddySystem.onError(`Swarm task failed: ${error.message}`);
                vscode.window.showErrorMessage(`Task failed: ${error.message}`);
            }
        });
    }));

    // Buddy Info Command
    context.subscriptions.push(vscode.commands.registerCommand('sincode.buddyInfo', () => {
        const state = buddySystem.getState();
        vscode.window.showInformationMessage(
            `BUDDY Status:\nMood: ${state.mood}\nLevel: ${state.level}\nXP: ${state.xp}/${state.level * 100}\nLast: ${state.lastAction}`
        );
    }));

    // SIN Code Proactive Mode: On-save background analysis
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (provider.getCurrentMode()?.id === 'proactive') {
            provider.notifyModeChange(provider.getCurrentMode()!, `File saved: ${doc.fileName}. Running background analysis...`);
            try {
                const context = await lspProvider.getSemanticContext();
                await provider.bridge.call(`Analyze the recently saved file ${doc.fileName} for potential improvements, bugs, or security issues.\n\nContext:\n${context}`, 'proactive', () => {});
                buddySystem.onActionSuccess('Background analysis completed', 5);
                provider.notifyModeChange(provider.getCurrentMode()!, `Analysis complete for ${doc.fileName}.`);
            } catch (e: any) {
                buddySystem.onError(`Background analysis failed: ${e.message}`);
                console.error('SIN Code background analysis failed:', e);
            }
        }
    }));

    // Context Provider: Add selected file to context
    context.subscriptions.push(vscode.commands.registerCommand('sincode.addFileToContext', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            provider.addFileToContext(editor.document.uri.fsPath);
            buddySystem.onActionSuccess('File added to context', 5);
            vscode.window.showInformationMessage(`Added ${editor.document.fileName} to SIN Code context`);
        }
    }));

    // Test watcher for Buddy
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (doc.fileName.includes('.test.') || doc.fileName.includes('.spec.')) {
            // Check if tests pass by running them
            const terminal = vscode.window.createTerminal('SIN Code Test Runner');
            terminal.sendText(`cd ${path.dirname(doc.fileName)} && npm test || echo "TESTS_FAILED"`);
            terminal.show();
        }
    }));

    // Git commit watcher for Buddy
    const gitWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceRoot || '', '.git/HEAD')
    );
    gitWatcher.onDidChange(() => {
        buddySystem.onCommit();
    });
    context.subscriptions.push(gitWatcher);

    let disposable = vscode.commands.registerCommand('sincode.start', () => {
        vscode.commands.executeCommand('workbench.view.extension.sincode-sidebar');
    });

    context.subscriptions.push(disposable);
}

class KairosViewProvider implements vscode.WebviewViewProvider {
    public bridge = new SinCodeBridge();
    private currentMode: AgentMode | null = null;
    private currentModel: string = 'opencode/qwen3.6-plus-free';
    private contextFiles: string[] = [];
    private view: vscode.WebviewView | null = null;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private lspProvider: LspProvider,
        private swarmCoordinator: SwarmCoordinator,
        private buddySystem: BuddySystem,
        private memoryConsolidation: MemoryConsolidation | null
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'prompt':
                    webviewView.webview.postMessage({ type: 'status', message: `${this.currentMode?.name || 'SIN Code'} is thinking...` });
                    try {
                        const fullPrompt = await this.buildFullPrompt(data.value);
                        await this.bridge.call(fullPrompt, this.currentMode?.id || 'code', (chunk) => {
                            webviewView.webview.postMessage({ type: 'stream', text: chunk });
                        });
                        webviewView.webview.postMessage({ type: 'status', message: 'Done.' });
                        this.buddySystem.onActionSuccess('Response generated', 10);
                    } catch (error: any) {
                        webviewView.webview.postMessage({ type: 'error', message: error.message });
                        this.buddySystem.onError(error.message);
                    }
                    break;
                case 'cancel':
                    this.bridge.cancel();
                    webviewView.webview.postMessage({ type: 'status', message: 'Cancelled.' });
                    break;
            }
        });
    }

    private async buildFullPrompt(userInput: string): Promise<string> {
        let context = '';
        if (this.contextFiles.length > 0) {
            context = `\n\n[Context Files: ${this.contextFiles.join(', ')}]\n`;
        }

        // Add LSP context
        const lspContext = await this.lspProvider.getSemanticContext();
        if (lspContext) {
            context += `\n\n[LSP Context]\n${lspContext}\n`;
        }

        // Add memory context
        if (this.memoryConsolidation) {
            const memory = await this.memoryConsolidation.getConsolidatedMemory();
            if (memory) {
                context += `\n\n[Memory Context]\n${memory}\n`;
            }
        }

        return `[Mode: ${this.currentMode?.systemPrompt || ''}]${context}\n\nUser: ${userInput}`;
    }

    public setCurrentMode(mode: AgentMode) { this.currentMode = mode; }
    public getCurrentMode() { return this.currentMode; }
    public setCurrentModel(model: string) { this.currentModel = model; }
    public async getModels() { return this.bridge.getAvailableModels(); }
    public addFileToContext(path: string) { this.contextFiles.push(path); }

    public notifyModeChange(mode: AgentMode, message?: string) {
        if (this.view) {
            this.view.webview.postMessage({ type: 'mode-change', mode: mode.name, message });
        }
    }

    private _getHtmlForWebview() {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SIN Code Chat</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); display: flex; flex-direction: column; height: 100vh; margin: 0; box-sizing: border-box; }
                    .header { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
                    .mode-badge { font-size: 0.8em; padding: 2px 8px; border-radius: 10px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
                    .chat-box { flex-grow: 1; border: 1px solid var(--vscode-panel-border); padding: 10px; overflow-y: auto; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
                    .input-area { flex-shrink: 0; display: flex; gap: 5px; }
                    .input-box { flex-grow: 1; box-sizing: border-box; padding: 10px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); }
                    .btn { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; border-radius: 3px; }
                    .btn:hover { background: var(--vscode-button-hoverBackground); }
                    .btn-cancel { background: var(--vscode-errorForeground); }
                    .msg-user { align-self: flex-end; background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 5px 10px; border-radius: 4px; max-width: 80%; word-wrap: break-word; }
                    .msg-ai { align-self: flex-start; background: var(--vscode-editorWidget-background); padding: 5px 10px; border-radius: 4px; max-width: 90%; word-wrap: break-word; border: 1px solid var(--vscode-panel-border); white-space: pre-wrap; }
                    .status { font-size: 0.8em; color: var(--vscode-descriptionForeground); font-style: italic; min-height: 1.2em; }
                    .context-files { font-size: 0.75em; color: var(--vscode-descriptionForeground); margin-bottom: 5px; }
                    .swarm-panel { margin-top: 10px; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; }
                    .swarm-panel h3 { margin: 0 0 10px 0; font-size: 1em; }
                </style>
            </head>
            <body>
                <div class="header">
                    <span>SIN Code</span>
                    <span class="mode-badge" id="mode-badge">Code</span>
                </div>
                <div class="context-files" id="context-files"></div>
                <div class="chat-box" id="chat"></div>
                <div id="status" class="status"></div>
                <div class="input-area">
                    <input type="text" class="input-box" id="input" placeholder="Ask SIN Code..." />
                    <button class="btn" id="send-btn">Send</button>
                    <button class="btn btn-cancel" id="cancel-btn" style="display:none;">Stop</button>
                </div>
                <div class="swarm-panel">
                    <h3>🐝 Swarm Coordinator</h3>
                    <button class="btn" onclick="vscode.postMessage({type:'command',command:'swarmDispatch'})">Dispatch Agent</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const chat = document.getElementById('chat');
                    const input = document.getElementById('input');
                    const status = document.getElementById('status');
                    const sendBtn = document.getElementById('send-btn');
                    const cancelBtn = document.getElementById('cancel-btn');
                    const modeBadge = document.getElementById('mode-badge');
                    const contextFilesDiv = document.getElementById('context-files');
                    
                    let currentAiMessage = null;

                    function sendMessage() {
                        if (input.value.trim()) {
                            const val = input.value.trim();
                            const div = document.createElement('div');
                            div.className = 'msg-user';
                            div.textContent = val;
                            chat.appendChild(div);
                            chat.scrollTop = chat.scrollHeight;

                            vscode.postMessage({ type: 'prompt', value: val });
                            input.value = '';
                            currentAiMessage = null;
                            sendBtn.style.display = 'none';
                            cancelBtn.style.display = 'block';
                        }
                    }

                    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
                    sendBtn.addEventListener('click', sendMessage);
                    cancelBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'cancel' });
                        sendBtn.style.display = 'block';
                        cancelBtn.style.display = 'none';
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'stream':
                                if (!currentAiMessage) {
                                    currentAiMessage = document.createElement('div');
                                    currentAiMessage.className = 'msg-ai';
                                    chat.appendChild(currentAiMessage);
                                }
                                currentAiMessage.textContent += message.text;
                                chat.scrollTop = chat.scrollHeight;
                                break;
                            case 'status':
                                status.textContent = message.message;
                                if (message.message === 'Done.' || message.message === 'Cancelled.') {
                                    setTimeout(() => status.textContent = '', 2000);
                                    currentAiMessage = null;
                                    sendBtn.style.display = 'block';
                                    cancelBtn.style.display = 'none';
                                }
                                break;
                            case 'error':
                                status.textContent = 'Error: ' + message.message;
                                status.style.color = 'var(--vscode-errorForeground)';
                                sendBtn.style.display = 'block';
                                cancelBtn.style.display = 'none';
                                break;
                            case 'mode-change':
                                modeBadge.textContent = message.mode;
                                if (message.message) {
                                    const sysDiv = document.createElement('div');
                                    sysDiv.className = 'msg-ai';
                                    sysDiv.style.fontStyle = 'italic';
                                    sysDiv.style.opacity = '0.7';
                                    sysDiv.textContent = message.message;
                                    chat.appendChild(sysDiv);
                                    chat.scrollTop = chat.scrollHeight;
                                }
                                break;
                        }
                    });
                </script>
            </body>
            </html>`;
    }
}

export function deactivate() {}
