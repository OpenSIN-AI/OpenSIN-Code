import * as vscode from 'vscode';
import { SinCodeBridge } from './cliBridge';
import { AGENT_MODES, AgentMode } from './modes';

export function activate(context: vscode.ExtensionContext) {
    console.log('OpenSIN-Code VS Code extension is now active!');

    const provider = new KairosViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('opensin-code.chatView', provider)
    );

    // Mode Selector Status Bar
    const modeStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    modeStatusBar.command = 'opensin-code.selectMode';
    context.subscriptions.push(modeStatusBar);

    // Model Selector Status Bar
    const modelStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    modelStatusBar.command = 'opensin-code.selectModel';
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
    context.subscriptions.push(vscode.commands.registerCommand('opensin-code.selectMode', async () => {
        const items = AGENT_MODES.map(m => ({
            label: `${m.icon} ${m.name}`,
            description: m.description,
            mode: m
        }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select OpenSIN-Code Mode' });
        if (selected) {
            provider.setCurrentMode(selected.mode);
            modeStatusBar.text = `$(symbol-misc) ${selected.mode.name}`;
            provider.notifyModeChange(selected.mode);
        }
    }));

    // Model selection command
    context.subscriptions.push(vscode.commands.registerCommand('opensin-code.selectModel', async () => {
        const models = await provider.getModels();
        const items = models.map(m => ({ label: m }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select Model' });
        if (selected) {
            provider.setCurrentModel(selected.label);
            modelStatusBar.text = `$(symbol-constant) ${selected.label.split('/').pop() || selected.label}`;
        }
    }));

    // OpenSIN-Code Proactive Mode: On-save background analysis
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (provider.getCurrentMode()?.id === 'opensin-code') {
            provider.notifyModeChange(provider.getCurrentMode()!, `File saved: ${doc.fileName}. Running background analysis...`);
            // Trigger background analysis
            try {
                await provider.bridge.call(`Analyze the recently saved file ${doc.fileName} for potential improvements, bugs, or security issues.`, 'opensin-code', () => {});
                provider.notifyModeChange(provider.getCurrentMode()!, `Analysis complete for ${doc.fileName}.`);
            } catch (e: any) {
                console.error('OpenSIN-Code background analysis failed:', e);
            }
        }
    }));

    // Context Provider: Add selected file to context
    context.subscriptions.push(vscode.commands.registerCommand('opensin-code.addFileToContext', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            provider.addFileToContext(editor.document.uri.fsPath);
            vscode.window.showInformationMessage(`Added ${editor.document.fileName} to OpenSIN-Code context`);
        }
    }));

    let disposable = vscode.commands.registerCommand('opensin-code.start', () => {
        vscode.commands.executeCommand('workbench.view.extension.opensin-code-sidebar');
    });

    context.subscriptions.push(disposable);
}

class KairosViewProvider implements vscode.WebviewViewProvider {
    public bridge = new SinCodeBridge();
    private currentMode: AgentMode | null = null;
    private currentModel: string = 'opencode/qwen3.6-plus-free';
    private contextFiles: string[] = [];
    private view: vscode.WebviewView | null = null;

    constructor(private readonly _extensionUri: vscode.Uri) {}

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
                    webviewView.webview.postMessage({ type: 'status', message: `${this.currentMode?.name || 'OpenSIN-Code'} is thinking...` });
                    try {
                        const fullPrompt = this.buildFullPrompt(data.value);
                        await this.bridge.call(fullPrompt, this.currentMode?.id || 'code', (chunk) => {
                            webviewView.webview.postMessage({ type: 'stream', text: chunk });
                        });
                        webviewView.webview.postMessage({ type: 'status', message: 'Done.' });
                    } catch (error: any) {
                        webviewView.webview.postMessage({ type: 'error', message: error.message });
                    }
                    break;
                case 'cancel':
                    this.bridge.cancel();
                    webviewView.webview.postMessage({ type: 'status', message: 'Cancelled.' });
                    break;
            }
        });
    }

    private buildFullPrompt(userInput: string): string {
        let context = '';
        if (this.contextFiles.length > 0) {
            context = `\n\n[Context Files: ${this.contextFiles.join(', ')}]\n`;
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
                <title>OpenSIN-Code Chat</title>
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
                </style>
            </head>
            <body>
                <div class="header">
                    <span>SIN Code (OpenSIN-Code)</span>
                    <span class="mode-badge" id="mode-badge">Code</span>
                </div>
                <div class="context-files" id="context-files"></div>
                <div class="chat-box" id="chat"></div>
                <div id="status" class="status"></div>
                <div class="input-area">
                    <input type="text" class="input-box" id="input" placeholder="Ask OpenSIN-Code..." />
                    <button class="btn" id="send-btn">Send</button>
                    <button class="btn btn-cancel" id="cancel-btn" style="display:none;">Stop</button>
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
