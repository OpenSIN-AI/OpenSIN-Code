"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) { return new (P || (P = Promise))(function(resolve, reject) { function fulfilled(v) { try { step(generator.next(v)); } catch (e) { reject(e); } } function rejected(v) { try { step(generator.throw(v)); } catch (e) { reject(e); } } function step(r) { r.done ? resolve(r.value) : (r.value instanceof P ? r.value : new P(function(resolve) { resolve(r.value); }).then(fulfilled, rejected)); } step((generator = generator.apply(thisArg, _arguments || [])).next()); }); };
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const { SwarmOrchestrator } = require('./omocSwarm');

// ============ MODE DEFINITIONS ============
const MODES = [
    { id: 'solo', label: '🎯 Solo', desc: 'Single Agent arbeitet alleine', detail: 'Schnell und fokussiert', icon: '🎯', color: '#34d399', keybinding: 'Cmd+Shift+S' },
    { id: 'swarm', label: '🐝 Swarm', desc: 'OMOC-Swarm + eigene Weiterarbeit parallel', detail: '4 Agenten parallel: Planner, Researcher, Coder, Reviewer', icon: '🐝', color: '#fbbf24', keybinding: 'Cmd+Shift+W' },
    { id: 'trio', label: '🔱 Trio', desc: 'Agent + 3 OMOC Subagenten parallel', detail: 'Main Agent + Explore, Librarian, Oracle', icon: '🔱', color: '#a78bfa', keybinding: 'Cmd+Shift+T' },
    { id: 'cloud', label: '☁️ Cloud', desc: 'SIN-Zeus orchestriert gesamte A2A Flotte', detail: 'Alle 109 Agenten parallel auf Cloud VMs', icon: '☁️', color: '#60a5fa', keybinding: 'Cmd+Shift+C' }
];

function activate(context) {
    console.log('OpenSIN VS Code Extension v0.1.0 — Phase 6 (OMOC-Swarm + 4 Modes) Active!');

    const swarm = new SwarmOrchestrator();
    let currentMode = 'solo';
    const outputChannel = vscode.window.createOutputChannel('OpenSIN');
    context.subscriptions.push(outputChannel);
    context.subscriptions.push({ dispose: () => swarm?.dispose?.() });

    // Mode Status Bar
    const modeBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    modeBar.command = 'opensin.mode.select';
    updateModeBar(modeBar, currentMode);
    modeBar.show();
    context.subscriptions.push(modeBar);

    // Task Count Status Bar
    const taskBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    taskBar.command = 'opensin.mode.tasks';
    taskBar.text = '$(tasklist) 0 tasks';
    taskBar.tooltip = 'Active Tasks - Click to view';
    taskBar.show();
    context.subscriptions.push(taskBar);

    // Chat Provider with Mode Support
    const provider = new ChatProvider(context, swarm, outputChannel, () => currentMode, updateTaskBar);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('opensin.chatView', provider));

    function updateModeBar(bar, mode) {
        const m = MODES.find(x => x.id === mode);
        if (m) {
            bar.text = m.label;
            bar.tooltip = m.desc + '\nKey: ' + m.keybinding + '\nClick to change mode';
        }
    }

    function updateTaskBar(bar) {
        const tasks = swarm.getActiveTasks();
        const active = tasks.filter(t => t.status === 'running').length;
        bar.text = active > 0 ? `$(sync~spin) ${active} task${active > 1 ? 's' : ''}` : `$(tasklist) ${tasks.length} tasks`;
    }

    // Mode Selection Command
    context.subscriptions.push(vscode.commands.registerCommand('opensin.mode.select', () => __awaiter(void 0, void 0, void 0, function* () {
        const items = MODES.map(m => ({
            label: m.label,
            description: m.detail,
            detail: m.desc,
            modeId: m.id
        }));
        const sel = yield vscode.window.showQuickPick(items, { placeHolder: 'Select Execution Mode' });
        if (sel) {
            currentMode = sel.modeId;
            updateModeBar(modeBar, currentMode);
            vscode.window.showInformationMessage(`Mode switched to ${sel.label}`);
            if (provider.webview) provider.webview.postMessage({ type: 'mode-change', mode: currentMode });
        }
    })));

    // Mode Execution Commands
    MODES.forEach(modeDef => {
        context.subscriptions.push(vscode.commands.registerCommand(`opensin.mode.${modeDef.id}`, () => __awaiter(void 0, void 0, void 0, function* () {
            currentMode = modeDef.id;
            updateModeBar(modeBar, currentMode);
            const prompt = yield vscode.window.showInputBox({ prompt: `Enter prompt for ${modeDef.label} mode` });
            if (!prompt) return;
            vscode.commands.executeCommand('workbench.view.extension.opensin-sidebar');
        })));
    });

    // Swarm Status Command
    context.subscriptions.push(vscode.commands.registerCommand('opensin.mode.tasks', () => {
        const tasks = swarm.getActiveTasks();
        if (tasks.length === 0) {
            vscode.window.showInformationMessage('No active tasks');
            return;
        }
        const items = tasks.map(t => ({
            label: t.mode ? t.mode.toUpperCase() : 'task',
            description: t.status,
            detail: t.id
        }));
        vscode.window.showQuickPick(items, { placeHolder: 'Active Tasks' });
    }));

    // Zeus Dashboard
    context.subscriptions.push(vscode.commands.registerCommand('opensin.zeusDashboard', createZeusPanel.bind(null, swarm)));
    context.subscriptions.push(vscode.commands.registerCommand('opensin.dispatch', createDispatchPicker.bind(null, swarm, outputChannel)));
    context.subscriptions.push(vscode.commands.registerCommand('opensin.start', () => {
        vscode.commands.executeCommand('workbench.view.extension.opensin-sidebar');
    }));

    // Update task bar periodically
    setInterval(() => updateTaskBar(taskBar), 5000);

    return { swarm, outputChannel };
}

function createZeusPanel(swarm) {
    const panel = vscode.window.createWebviewPanel('opensin.zeus', 'SIN-Zeus Command Center', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
    const tasks = swarm.getActiveTasks();
    const swarms = swarm.getActiveSwarms();
    const subagents = swarm.getAvailableSubagents();

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>SIN-Zeus</title>
<style>
*{box-sizing:border-box} body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;margin:0;background:#0d1117;color:#c9d1d9}
h1{margin:0 0 5px;font-size:1.5em} .sub{color:#8b949e;margin-bottom:20px;font-size:0.9em}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}
.stat{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px 18px;min-width:140px}
.stat-label{font-size:0.75em;color:#8b949e;margin-bottom:4px} .stat-value{font-size:1.5em;font-weight:700;color:#58a6ff}
h2{color:#58a6ff;font-size:1.1em;border-bottom:1px solid #30363d;padding-bottom:8px;margin-bottom:12px}
.mode-card{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:24px}
.mode-btn{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:14px;min-width:200px;cursor:pointer}
.mode-btn:hover{border-color:#58a6ff} .mode-btn .name{font-weight:700;font-size:1.1em} .mode-btn .detail{color:#8b949e;font-size:0.85em;margin-top:4px}
.agent{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px;margin-bottom:6px}
section{margin-bottom:24px}
</style></head><body>
<h1>SIN-Zeus Command Center</h1>
<div class="sub">OpenSIN VS Code Extension v0.1.0 — OMOC-Swarm Integrated</div>
<div class="stats">
<div class="stat"><div class="stat-label">Active Tasks</div><div class="stat-value">${tasks.length}</div></div>
<div class="stat"><div class="stat-label">Active Swarms</div><div class="stat-value">${swarms.length}</div></div>
<div class="stat"><div class="stat-label">OMOC Subagents</div><div class="stat-value">${subagents.length}</div></div>
<div class="stat"><div class="stat-label">Execution Modes</div><div class="stat-value">4</div></div>
</div>
<h2>Execution Modes</h2>
<div class="mode-card">
${MODES.map(m => `<div class="mode-btn"><div class="name">${m.label}</div><div class="detail">${m.desc}</div><div style="margin-top:6px;font-size:0.75em;color:#58a6ff">${m.keybinding}</div></div>`).join('')}
</div>
<h2>OMOC Subagents Available</h2>
${subagents.map(a => `<div class="agent"><strong>${a.icon} ${a.name}</strong> <span style="color:#8b949e;font-size:0.85em">${a.desc}</span></div>`).join('')}
<h2>Active Tasks</h2>
${tasks.length === 0 ? '<div style="color:#8b949e">No active tasks</div>' : tasks.map(t => `<div class="agent"><strong>${t.id}</strong> <span style="color:${t.status === 'running' ? '#238636' : t.status === 'completed' ? '#58a6ff' : '#da3633'}">${t.status}</span><br><span style="color:#8b949e;font-size:0.85em">Mode: ${t.mode}</span></div>`).join('')}
</body></html>`;
    panel.webview.html = html;
}

function createDispatchPicker(swarm, outputChannel) {
    return __awaiter(void 0, void 0, void 0, function* () {
        const modes = MODES.map(m => ({
            label: m.label,
            description: m.detail,
            detail: m.desc,
            modeId: m.id
        }));
        const sel = yield vscode.window.showQuickPick(modes, { placeHolder: 'Select Execution Mode' });
        if (!sel) return;
        const prompt = yield vscode.window.showInputBox({ prompt: `Enter prompt for ${sel.label}` });
        if (!prompt) return;

        const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const editor = vscode.window.activeTextEditor;
        const ctx = { workspace: wsRoot, activeFile: editor?.document.fileName || '', selectedCode: editor ? editor.document.getText(editor.selection) : '' };

        outputChannel.show();
        outputChannel.appendLine(`\n=== ${sel.label.toUpperCase()} MODE ===`);
        outputChannel.appendLine(`Prompt: ${prompt}\n`);

        yield swarm.executeMode(sel.modeId, prompt, ctx, {}, (chunk) => {
            outputChannel.append(chunk);
        });
    });
}

class ChatProvider {
    constructor(ctx, swarm, oc, getMode, updateTaskBar) {
        this.context = ctx; this.swarm = swarm; this.outputChannel = oc; this.getMode = getMode; this.updateTaskBar = updateTaskBar;
        this.webview = null;
    }

    resolveWebviewView(webviewView, _ctx, _token) {
        this.webview = webviewView.webview;
        webviewView.webview.options = { enableScripts: true, localResourceRoots: [this.context.extensionUri] };
        const mode = this.getMode();
        const currentModeInfo = MODES.find(m => m.id === mode);

        webviewView.webview.html = this.getHtml(mode, currentModeInfo);
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'prompt': this.handlePrompt(data.value, data.mode); break;
                case 'mode-select': vscode.commands.executeCommand('opensin.mode.select'); break;
                case 'dispatch': vscode.commands.executeCommand('opensin.dispatch'); break;
                case 'zeus': vscode.commands.executeCommand('opensin.zeusDashboard'); break;
            }
        });
    }

    handlePrompt(prompt, requestedMode) {
        return __awaiter(this, void 0, void 0, function* () {
            const mode = requestedMode || this.getMode();
            const modeInfo = MODES.find(m => m.id === mode);
            this.webview.postMessage({ type: 'status', message: `${modeInfo.label} thinking...` });
            this.webview.postMessage({ type: 'stream', text: '' });
            const wsRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            const editor = vscode.window.activeTextEditor;
            const ctx = { workspace: wsRoot, activeFile: editor?.document.fileName || '' };

            try {
                yield this.swarm.executeMode(mode, prompt, ctx, {}, (chunk) => {
                    this.webview.postMessage({ type: 'stream', text: chunk });
                });
                this.webview.postMessage({ type: 'status', message: 'Done.' });
                this.updateTaskBar();
            } catch (e) {
                this.webview.postMessage({ type: 'error', message: e.message });
                this.webview.postMessage({ type: 'status', message: 'Failed.' });
            }
        });
    }

    getHtml(mode, modeInfo) {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
body{font-family:var(--vscode-font-family);padding:10px;color:var(--vscode-editor-foreground);background:var(--vscode-editor-background);display:flex;flex-direction:column;height:100vh;margin:0;box-sizing:border-box}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.hdr h3{margin:0;font-size:1.1em;cursor:pointer}
.mode-pill{font-size:0.75em;padding:4px 10px;border-radius:12px;background:${modeInfo.color}22;color:${modeInfo.color};border:1px solid ${modeInfo.color}44;cursor:pointer}
.chat{flex-grow:1;border:1px solid var(--vscode-panel-border);padding:10px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:8px}
.input-row{display:flex;gap:5px}.input{flex-grow:1;box-sizing:border-box;padding:10px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:4px}
.btn{padding:8px 14px;border:none;cursor:pointer;border-radius:4px;color:#fff}
.btn-prompt{background:var(--vscode-button-background)} .btn-stop{background:var(--vscode-errorForeground)}
.u-msg{align-self:flex-end;background:var(--vscode-button-background);color:var(--vscode-button-foreground);padding:5px 10px;border-radius:4px;max-width:80%;word-wrap:break-word}
.a-msg{align-self:flex-start;background:var(--vscode-editorWidget-background);padding:8px 12px;border-radius:4px;max-width:95%;word-wrap:break-word;border:1px solid var(--vscode-panel-border);white-space:pre-wrap;font-size:0.9em;line-height:1.4}
.status{font-size:0.8em;color:var(--vscode-descriptionForeground);font-style:italic;min-height:1.2em}
.modes-row{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}
</style></head><body>
<div class="hdr"><h3 onclick="vscode.postMessage({type:'zeus'})">🏛️ OpenSIN</h3><span class="mode-pill" onclick="vscode.postMessage({type:'mode-select'})">${modeInfo.label}</span></div>
<div class="chat" id="chat"><div class="a-msg" style="opacity:0.7">👋 ${modeInfo.label} mode active${modeInfo.desc ? ': ' + modeInfo.desc : ''}. Type or use /command for quick actions.</div></div>
<div id="status" class="status"></div>
<div class="input-row"><input type="text" class="input" id="inp" placeholder="Ask OpenSIN..." /><button class="btn btn-prompt" id="send">Send</button><button class="btn btn-stop" id="stop" style="display:none">Stop</button></div>
<div class="modes-row">
${MODES.map(m => `<button class="btn" style="background:${m.color}22;color:${m.color};border:1px solid ${m.color}44;font-size:0.75em" onclick="selMode('${m.id}')">${m.label}</button>`).join('')}
<button class="btn" style="background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);font-size:0.75em" onclick="vscode.postMessage({type:'dispatch'})">🐝 Dispatch</button>
</div>
<script>
const vscode=acquireVsCodeApi();const chat=document.getElementById('chat');const inp=document.getElementById('inp');const st=document.getElementById('status');const send=document.getElementById('send');const stop=document.getElementById('stop');let cur=null,modeId='${mode}';
function selMode(id){modeId=id;vscode.postMessage({type:'mode-change',mode:id});st.textContent='Mode: '+id;}
function doSend(){if(!inp.value.trim())return;const v=inp.value.trim();const d=document.createElement('div');d.className='u-msg';d.textContent=v;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;vscode.postMessage({type:'prompt',value:v,mode:modeId});inp.value='';cur=null;send.style.display='none';stop.style.display='inline';}
inp.addEventListener('keypress',e=>{if(e.key==='Enter')doSend();});
send.addEventListener('click',doSend);
stop.addEventListener('click',()=>{vscode.postMessage({type:'cancel'});send.style.display='inline';stop.style.display='none';st.textContent='Cancelled.';});
window.addEventListener('message',ev=>{const m=ev.data;if(m.type==='stream'){if(!cur){cur=document.createElement('div');cur.className='a-msg';chat.appendChild(cur);}cur.textContent+=m.text;chat.scrollTop=chat.scrollHeight;st.textContent='';}if(m.type==='status'){st.textContent=m.message;if(m.message==='Done.'||m.message==='Cancelled.'){setTimeout(()=>st.textContent='',2000);cur=null;send.style.display='inline';stop.style.display='none';}}if(m.type==='error'){st.textContent='Error: '+m.message;st.style.color='var(--vscode-errorForeground)';send.style.display='inline';stop.style.display='none';}if(m.type==='mode-change'){modeId=m.mode;st.textContent='Mode: '+m.mode;}});
</script></body></html>`;
    }
}

function deactivate() {}
