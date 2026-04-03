"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const cliBridge_1 = require("./out/cliBridge");
const modes_1 = require("./out/modes");
const lspProvider_1 = require("./out/lspProvider");
const swarmCoordinator_1 = require("./out/swarmCoordinator");
const buddyGamification_1 = require("./out/buddyGamification");
const memoryConsolidation_1 = require("./out/memoryConsolidation");
const inlineChat_1 = require("./out/inlineChat");
const codeActions_1 = require("./out/codeActions");
const agentMarketplace_1 = require("./out/agentMarketplace");
const a2aClient_1 = require("./out/a2aClient");
function activate(context) {
    console.log('OpenSIN VS Code extension is now active!');
    const lspProvider = new lspProvider_1.LspProvider();
    const swarmCoordinator = new swarmCoordinator_1.SwarmCoordinator();
    const buddySystem = new buddyGamification_1.BuddySystem();
    const a2aClient = new a2aClient_1.A2AClient();
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const memoryConsolidation = workspaceRoot ? new memoryConsolidation_1.MemoryConsolidation(workspaceRoot) : null;
    if (memoryConsolidation) {
        context.subscriptions.push(memoryConsolidation.startWatching());
    }
    const provider = new SINCodeViewProvider(context.extensionUri, lspProvider, swarmCoordinator, buddySystem, memoryConsolidation, a2aClient);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('opensin.chatView', provider));
    // Status Bars: Mode, Model, A2A Status
    const modeStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    modeStatusBar.command = 'opensin.selectMode';
    context.subscriptions.push(modeStatusBar);
    const modelStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    modelStatusBar.command = 'opensin.selectModel';
    context.subscriptions.push(modelStatusBar);
    // Phase 4: A2A Status Bar
    const a2aStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    a2aStatusBar.command = 'opensin.showSINZeusDashboard';
    context.subscriptions.push(a2aStatusBar);
    provider.setCurrentMode(modes_1.AGENT_MODES[1]);
    provider.setCurrentModel('opencode/qwen3.6-plus-free');
    modeStatusBar.text = `$(symbol-misc) OpenSIN`;
    modeStatusBar.tooltip = 'OpenSIN Mode - Click to change';
    modeStatusBar.show();
    modelStatusBar.text = `$(symbol-constant) qwen3.6-plus`;
    modelStatusBar.show();
    // Update A2A status every 30s
    const a2aInterval = setInterval(() => {
        const info = a2aClient.getSessionInfo();
        a2aStatusBar.text = info.onlineVMs > 0
            ? `$(cloud) ${info.onlineVMs}/${info.totalVMs} Cloud VMs | ${info.activeTasks} tasks`
            : `$(cloud-download) A2A: Connecting...`;
        a2aStatusBar.tooltip = `Session: ${info.sessionId}\nOnline VMs: ${info.onlineVMs}/${info.totalVMs}\nActive Tasks: ${info.activeTasks}`;
        a2aStatusBar.show();
    }, 30000);
    context.subscriptions.push({ dispose: () => clearInterval(a2aInterval) });
    // Mode selection
    context.subscriptions.push(vscode.commands.registerCommand('opensin.selectMode', async () => {
        const items = modes_1.AGENT_MODES.map(m => ({ label: `${m.icon} ${m.name}`, description: m.description, mode: m }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select Mode' });
        if (selected) {
            provider.setCurrentMode(selected.mode);
            modeStatusBar.text = `$(symbol-misc) ${selected.mode.name}`;
            provider.notifyModeChange(selected.mode);
        }
    }));
    // Model selection
    context.subscriptions.push(vscode.commands.registerCommand('opensin.selectModel', async () => {
        const models = await provider.getModels();
        const items = models.map(m => ({ label: m }));
        const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Select Model' });
        if (selected) {
            provider.setCurrentModel(selected.label);
            modelStatusBar.text = `$(symbol-constant) ${selected.label.split('/').pop() || selected.label}`;
        }
    }));
    // Phase 4: SIN-Zeus Dashboard Command
    context.subscriptions.push(vscode.commands.registerCommand('opensin.showSINZeusDashboard', () => {
        const dashboard = new SINZeusDashboardPanel(a2aClient, buddySystem);
        dashboard.show();
    }));
    // Phase 4: Swarm dispatch to REAL cloud VMs
    context.subscriptions.push(vscode.commands.registerCommand('opensin.swarmDispatch', async () => {
        const agentItems = a2aClient_1.A2A_CLOUD_VMS
            .filter(vm => vm.status === 'online' || vm.status === 'unknown')
            .map(vm => ({
            label: `${vm.status === 'online' ? '🟢' : '🟡'} ${vm.name}`,
            description: vm.capabilities?.join(', ') || '',
            detail: `Model: ${vm.model} (${vm.type.toUpperCase()})`,
            agentId: vm.id,
        }));
        if (agentItems.length === 0) {
            vscode.window.showWarningMessage('No cloud VMs available. Using local fallback.');
            return await vscode.commands.executeCommand('opensin.start');
        }
        const selectedAgent = await vscode.window.showQuickPick(agentItems, { placeHolder: 'Dispatch to Cloud Agent' });
        if (!selectedAgent)
            return;
        const prompt = await vscode.window.showInputBox({ prompt: `Enter task for ${selectedAgent.agentId}` });
        if (!prompt)
            return;
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Dispatching to ${selectedAgent.agentId} via A2A...`,
            cancellable: true
        }, async (_progress, token) => {
            try {
                const result = await a2aClient.dispatchTask(selectedAgent.agentId, prompt);
                if (result.status === 'running') {
                    buddySystem.onActionSuccess(`Cloud task dispatched: ${selectedAgent.agentId}`, 30);
                    vscode.window.showInformationMessage(`Task dispatched! Monitor at: ${result.url}`);
                }
                else if (result.status === 'local_fallback') {
                    // Fallback to local opencode
                    let output = '';
                    await provider.bridge.call(prompt, provider.getCurrentMode()?.id || 'code', (chunk) => { output += chunk; });
                    vscode.window.showInformationMessage(`Cloud unavailable, ran locally: ${output.slice(0, 100)}...`);
                }
                else {
                    buddySystem.onActionSuccess(`Cloud task completed: ${selectedAgent.agentId}`, 30);
                    vscode.window.showInformationMessage(`Task completed: ${result.result?.slice(0, 200)}`);
                }
            }
            catch (error) {
                buddySystem.onError(`A2A dispatch failed: ${error.message}`);
                vscode.window.showErrorMessage(`Task failed: ${error.message}`);
            }
        });
    }));
    // Buddy info
    context.subscriptions.push(vscode.commands.registerCommand('opensin.buddyInfo', () => {
        const state = buddySystem.getState();
        const vmInfo = a2aClient.getCloudVMs().map(v => `${v.name}: ${v.status}`).join('\n');
        vscode.window.showInformationMessage(`BUDDY: Lv.${state.level} (${state.mood})\n\nCloud VMs:\n${vmInfo}`);
    }));
    // Proactive mode: A2A background analysis on save
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(async (doc) => {
        if (provider.getCurrentMode()?.id === 'proactive') {
            const ctx = await lspProvider.getSemanticContext();
            const prompt = `Analyze ${doc.fileName} for improvements, bugs, security issues.\nContext:\n${ctx}`;
            // Try cloud first, fallback to local
            try {
                const onlineVM = a2aClient_1.A2A_CLOUD_VMS.find(v => v.status === 'online' && v.capabilities?.includes('code'));
                if (onlineVM) {
                    await a2aClient.dispatchTask(onlineVM.id, prompt);
                    buddySystem.onActionSuccess('Cloud background analysis dispatched', 10);
                }
                else {
                    await provider.bridge.call(prompt, 'proactive', () => { });
                    buddySystem.onActionSuccess('Local background analysis done', 5);
                }
            }
            catch { /* silent */ }
        }
    }));
    // Git commit watcher → Buddy + A2A
    const gitWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceRoot || '', '.git/HEAD'));
    gitWatcher.onDidChange(() => {
        buddySystem.onCommit();
        // Auto-dispatch to A2A-SIN-GitHub-Issues for PR/issue tracking
        if (a2aClient.getCloudVMs().some(v => v.id === 'sin-github-issues' && v.status === 'online')) {
            a2aClient.dispatchTask('sin-github-issues', `Commit detected in workspace. Check for any issues to create/update.`).catch(() => { });
        }
    });
    context.subscriptions.push(gitWatcher);
    // Main command
    context.subscriptions.push(vscode.commands.registerCommand('opensin.start', () => {
        vscode.commands.executeCommand('workbench.view.extension.opensin-sidebar');
    }));
    // Phase 3: Inline Chat
    const inlineController = new inlineChat_1.InlineChatProvider();
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineController));
    context.subscriptions.push(inlineController);
    // Phase 3: Code Actions
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider({ pattern: '**/*' }, new codeActions_1.SINCodeActionProvider(), { providedCodeActionKinds: codeActions_1.SINCodeActionProvider.providedCodeActionKinds }));
    context.subscriptions.push(vscode.commands.registerCommand('opensin.fixError', codeActions_1.fixError));
    context.subscriptions.push(vscode.commands.registerCommand('opensin.refactorSelection', codeActions_1.refactorSelection));
    context.subscriptions.push(vscode.commands.registerCommand('opensin.explainCode', codeActions_1.explainCode));
    context.subscriptions.push(vscode.commands.registerCommand('opensin.generateTests', codeActions_1.generateTests));
    // Phase 3: Agent Marketplace
    const marketplace = new agentMarketplace_1.MarketplacePanel();
    context.subscriptions.push(vscode.commands.registerCommand('opensin.openMarketplace', () => { marketplace.show(); }));
    // Cleanup
    context.subscriptions.push({ dispose: () => { a2aClient.dispose(); } });
}
class SINZeusDashboardPanel {
    a2aClient;
    buddySystem;
    panel;
    constructor(a2aClient, buddySystem) {
        this.a2aClient = a2aClient;
        this.buddySystem = buddySystem;
    }
    show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('opensin.zeus', '🏛️ SIN-Zeus Command Center', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
        this.updateContent();
        // Auto-refresh every 5s
        const interval = setInterval(() => { if (this.panel)
            this.updateContent();
        else
            clearInterval(interval); }, 5000);
        this.panel.onDidDispose(() => { clearInterval(interval); this.panel = undefined; });
    }
    updateContent() {
        const vms = this.a2aClient.getCloudVMs();
        const tasks = this.a2aClient.getActiveTasks();
        const session = this.a2aClient.getSessionInfo();
        const buddy = this.buddySystem.getState();
        this.panel.webview.html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>SIN-Zeus Command Center</title>
<style>
*{box-sizing:border-box} body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;margin:0;background:#0d1117;color:#c9d1d9}
h1{margin:0 0 5px;font-size:1.5em} .subtitle{color:#8b949e;margin-bottom:20px;font-size:0.9em}
.stats{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.stat{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px 18px;min-width:120px}
.stat-label{font-size:0.75em;color:#8b949e;margin-bottom:4px}
.stat-value{font-size:1.5em;font-weight:700}
.vm-card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.vm-name{font-weight:600} .vm-detail{font-size:0.85em;color:#8b949e}
.status-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px}
.online{background:#238636} .offline{background:#da3633} .degraded{background:#d29922} .unknown{background:#6e7681}
.task-card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:8px}
.task-id{font-family:monospace;font-size:0.85em;color:#58a6ff} .task-status{font-weight:600;margin-left:8px}
section{margin-bottom:24px} section h2{color:#58a6ff;font-size:1.1em;border-bottom:1px solid #30363d;padding-bottom:8px;margin-bottom:12px}
</style></head><body>
<h1>🏛️ SIN-Zeus Command Center</h1>
<div class="subtitle">Session: ${session.sessionId} | Buddy Lv.${buddy.level} (${buddy.mood} ${buddy.emoji})</div>
<div class="stats">
<div class="stat"><div class="stat-label">Cloud VMs Online</div><div class="stat-value" style="color:#238636">${session.onlineVMs}</div></div>
<div class="stat"><div class="stat-label">Total VMs</div><div class="stat-value">${session.totalVMs}</div></div>
<div class="stat"><div class="stat-label">Active Tasks</div><div class="stat-value" style="color:#58a6ff">${session.activeTasks}</div></div>
<div class="stat"><div class="stat-label">Buddy Level</div><div class="stat-value" style="color:#d29922">${buddy.level}</div></div>
</div>
<section><h2>☁️ Cloud VM Fleet</h2>${vms.map(vm => `
<div class="vm-card"><div><span class="status-dot ${vm.status}"></span><span class="vm-name">${vm.name}</span><div class="vm-detail">${vm.model || 'N/A'} | Capabilities: ${(vm.capabilities || []).join(', ')}</div></div>
<div><span style="text-transform:uppercase;font-size:0.8em;padding:4px 10px;border-radius:12px;background:${vm.status === 'online' ? '#23863633' : vm.status === 'offline' ? '#da363333' : '#d2992233'}">${vm.status || 'unknown'}</span>
<div class="vm-detail">Type: ${vm.type.toUpperCase()} | Last: ${vm.lastSeen ? new Date(vm.lastSeen).toLocaleTimeString() : 'never'}</div></div></div>`).join('')}</section>
<section><h2>📋 Active Tasks</h2>${tasks.length === 0 ? '<div class="vm-detail">No active tasks</div>' : tasks.slice(-10).reverse().map(t => `
<div class="task-card"><span class="task-id">${t.id}</span><span class="task-status" style="color:${t.status === 'running' ? '#58a6ff' : t.status === 'completed' ? '#238636' : t.status === 'failed' ? '#da3633' : '#8b949e'}">${t.status}</span>
<div class="vm-detail">Agent: ${t.agentId} | Agent: ${t.agentId} | VM: ${t.vm || 'local'} | ${t.taskUrl ? `<a href="${t.taskUrl}" style="color:#58a6ff">View</a>` : ''}</div></div>`).join('')}
</section>
</body></html>`;
    }
}
class SINCodeViewProvider {
    _extensionUri;
    lspProvider;
    swarmCoordinator;
    buddySystem;
    memoryConsolidation;
    a2aClient;
    bridge = new cliBridge_1.SinCodeBridge();
    currentMode = null;
    currentModel = 'opencode/qwen3.6-plus-free';
    contextFiles = [];
    view = null;
    constructor(_extensionUri, lspProvider, swarmCoordinator, buddySystem, memoryConsolidation, a2aClient) {
        this._extensionUri = _extensionUri;
        this.lspProvider = lspProvider;
        this.swarmCoordinator = swarmCoordinator;
        this.buddySystem = buddySystem;
        this.memoryConsolidation = memoryConsolidation;
        this.a2aClient = a2aClient;
    }
    resolveWebviewView(webviewView, context, _token) {
        this.view = webviewView;
        webviewView.webview.options = { enableScripts: true, localResourceRoots: [this._extensionUri] };
        webviewView.webview.html = this._getHtmlForWebview();
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'prompt':
                    webviewView.webview.postMessage({ type: 'status', message: `${this.currentMode?.name || 'OpenSIN'} is thinking...` });
                    try {
                        const fullPrompt = await this.buildFullPrompt(data.value);
                        // A2A first: try cloud dispatch
                        const onlineVM = this.a2aClient.getCloudVMs().find(v => v.status === 'online' && v.capabilities?.includes('code'));
                        if (onlineVM && data.useCloud) {
                            const result = await this.a2aClient.dispatchTask(onlineVM.id, fullPrompt);
                            if (result.status === 'running') {
                                webviewView.webview.postMessage({ type: 'stream', text: `\n🔄 Task dispatched to ${onlineVM.name}! Monitor at: ${result.url}` });
                            }
                            else if (result.result) {
                                webviewView.webview.postMessage({ type: 'stream', text: result.result });
                            }
                        }
                        else {
                            // Local fallback
                            await this.bridge.call(fullPrompt, this.currentMode?.id || 'code', (chunk) => { webviewView.webview.postMessage({ type: 'stream', text: chunk }); });
                        }
                        webviewView.webview.postMessage({ type: 'status', message: 'Done.' });
                        this.buddySystem.onActionSuccess('Response generated', 10);
                    }
                    catch (error) {
                        webviewView.webview.postMessage({ type: 'error', message: error.message });
                        this.buddySystem.onError(error.message);
                    }
                    break;
                case 'cancel':
                    this.bridge.cancel();
                    webviewView.webview.postMessage({ type: 'status', message: 'Cancelled.' });
                    break;
                case 'openMarketplace':
                    vscode.commands.executeCommand('opensin.openMarketplace');
                    break;
                case 'openZeus':
                    vscode.commands.executeCommand('opensin.showSINZeusDashboard');
                    break;
            }
        });
    }
    async buildFullPrompt(userInput) {
        let ctx = '';
        if (this.contextFiles.length > 0) {
            ctx = `\n[Context Files: ${this.contextFiles.join(', ')}]\n`;
        }
        const lsp = await this.lspProvider.getSemanticContext();
        if (lsp) {
            ctx += `\n[LSP]\n${lsp}\n`;
        }
        if (this.memoryConsolidation) {
            const mem = await this.memoryConsolidation.getConsolidatedMemory();
            if (mem) {
                ctx += `\n[Memory]\n${mem}\n`;
            }
        }
        return `[Mode: ${this.currentMode?.systemPrompt || ''}]${ctx}\nUser: ${userInput}`;
    }
    setCurrentMode(mode) { this.currentMode = mode; }
    getCurrentMode() { return this.currentMode; }
    setCurrentModel(model) { this.currentModel = model; }
    async getModels() { return this.bridge.getAvailableModels(); }
    addFileToContext(p) { this.contextFiles.push(p); }
    notifyModeChange(mode, message) {
        if (this.view) {
            this.view.webview.postMessage({ type: 'mode-change', mode: mode.name, message });
        }
    }
    _getHtmlForWebview() {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OpenSIN Chat</title>
<style>
body{font-family:var(--vscode-font-family);padding:10px;color:var(--vscode-editor-foreground);background:var(--vscode-editor-background);display:flex;flex-direction:column;height:100vh;margin:0;box-sizing:border-box}
.header{font-size:1.2em;font-weight:bold;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer}
.chat-box{flex-grow:1;border:1px solid var(--vscode-panel-border);padding:10px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:8px}
.input-area{display:flex;gap:5px}.input-box{flex-grow:1;box-sizing:border-box;padding:10px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border)}
.btn{padding:8px 14px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;cursor:pointer;border-radius:3px}.btn:hover{background:var(--vscode-button-hoverBackground)}
.msg-user{align-self:flex-end;background:var(--vscode-button-background);color:var(--vscode-button-foreground);padding:5px 10px;border-radius:4px;max-width:80%;word-wrap:break-word}
.msg-ai{align-self:flex-start;background:var(--vscode-editorWidget-background);padding:5px 10px;border-radius:4px;max-width:90%;word-wrap:break-word;border:1px solid var(--vscode-panel-border);white-space:pre-wrap}
.status{font-size:0.8em;color:var(--vscode-descriptionForeground);font-style:italic;min-height:1.2em}
.cloud-btn{font-size:0.85em;padding:2px 10px;border-radius:12px;cursor:pointer;background:#23863622;color:#238636;border:1px solid #23863644}
</style></head><body>
<div class="header" onclick="vscode.postMessage({type:'openZeus'})"><span>🏛️ OpenSIN</span><span class="cloud-btn" onclick="event.stopPropagation();toggleCloud()">☁️ Cloud: OFF</span></div>
<div class="chat-box" id="chat"></div><div id="status" class="status"></div>
<div class="input-area"><input type="text" class="input-box" id="input" placeholder="Ask OpenSIN..." /><button class="btn" id="send-btn">Send</button><button class="btn" id="cancel-btn" style="display:none">Stop</button></div>
<div style="margin-top:8px;display:flex;gap:6px"><button class="btn" style="flex:1;font-size:0.85em" onclick="vscode.postMessage({type:'openMarketplace'})">🤖 Agent Marketplace</button><button class="btn" style="flex:1;font-size:0.85em" onclick="vscode.postMessage({type:'openZeus'})">🏛️ SIN-Zeus</button></div>
<script>
const vscode=acquireVsCodeApi();const chat=document.getElementById('chat');const input=document.getElementById('input');const status=document.getElementById('status');const sendBtn=document.getElementById('send-btn');const cancelBtn=document.getElementById('cancel-btn');let useCloud=false;let curMsg=null;
function toggleCloud(){useCloud=!useCloud;document.querySelector('.cloud-btn').textContent=useCloud?'☁️ Cloud: ON':'☁️ Cloud: OFF';document.querySelector('.cloud-btn').style.background=useCloud?'#23863644':'#23863622';}
function send(){if(!input.value.trim())return;const v=input.value.trim();const d=document.createElement('div');d.className='msg-user';d.textContent=v;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;vscode.postMessage({type:'prompt',value:v,useCloud});input.value='';curMsg=null;sendBtn.style.display='none';cancelBtn.style.display='block';}
input.addEventListener('keypress',e=>{if(e.key==='Enter')send();});sendBtn.addEventListener('click',send);cancelBtn.addEventListener('click',()=>{vscode.postMessage({type:'cancel'});sendBtn.style.display='block';cancelBtn.style.display='none';});
window.addEventListener('message',ev=>{const m=ev.data;switch(m.type){case'stream':if(!curMsg){curMsg=document.createElement('div');curMsg.className='msg-ai';chat.appendChild(curMsg);}curMsg.textContent+=m.text;chat.scrollTop=chat.scrollHeight;break;case'status':status.textContent=m.message;if(m.message==='Done.'||m.message==='Cancelled.'){setTimeout(()=>status.textContent='',2000);curMsg=null;sendBtn.style.display='block';cancelBtn.style.display='none';}break;}});
</script></body></html>`;
    }
}
function deactivate() { }
//# sourceMappingURL=extensionPhase4.js.map