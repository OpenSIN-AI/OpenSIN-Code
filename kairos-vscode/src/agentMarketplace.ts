import * as vscode from 'vscode';

export interface SINAgent {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    version: string;
    installed: boolean;
    commands: string[];
}

const DEFAULT_AGENTS: SINAgent[] = [
    {
        id: 'sin-explorer',
        name: 'SIN-Explorer',
        description: 'Codebase analysis, ast-grep patterns, file structure mapping',
        category: 'Analysis',
        icon: '🔍',
        version: '1.0.0',
        installed: false,
        commands: ['explore.codebase', 'explore.patterns']
    },
    {
        id: 'sin-librarian',
        name: 'SIN-Librarian',
        description: 'Documentation research, GitHub examples, best-practice lookup',
        category: 'Research',
        icon: '📚',
        version: '1.0.0',
        installed: false,
        commands: ['librarian.search', 'librarian.docs']
    },
    {
        id: 'sin-oracle',
        name: 'SIN-Oracle',
        description: 'Architecture guidance, debugging, complex logic solving',
        category: 'Intelligence',
        icon: '🔮',
        version: '1.0.0',
        installed: false,
        commands: ['oracle.architect', 'oracle.debug']
    },
    {
        id: 'sin-artistry',
        name: 'SIN-Artistry',
        description: 'Creative problem solving, non-conventional approaches',
        category: 'Creative',
        icon: '🎨',
        version: '1.0.0',
        installed: false,
        commands: ['artistry.solve', 'artistry.design']
    },
    {
        id: 'sin-frontend',
        name: 'SIN-Frontend',
        description: 'UI/UX design, React, CSS, responsive layouts',
        category: 'Development',
        icon: '🎭',
        version: '1.0.0',
        installed: false,
        commands: ['frontend.design', 'frontend.react']
    },
    {
        id: 'sin-vision-colab',
        name: 'SIN-Vision-Colab',
        description: 'Screen recording + AI-vision analysis via Gemini',
        category: 'Vision',
        icon: '👁️',
        version: '1.0.0',
        installed: false,
        commands: ['vision.record', 'vision.analyze']
    }
];

export class MarketplacePanel {
    private panel: vscode.WebviewPanel | undefined;
    private agents: SINAgent[];

    constructor() {
        this.agents = [...DEFAULT_AGENTS];
    }

    public show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'sincode.marketplace',
            '🤖 SIN Agent Marketplace',
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        this.panel.webview.html = this.getHtml();

        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'install':
                    const agent = this.agents.find(a => a.id === message.agentId);
                    if (agent) {
                        agent.installed = true;
                        vscode.window.showInformationMessage(`📦 Installed ${agent.name}!`);
                        this.panel!.webview.html = this.getHtml();
                    }
                    break;
                case 'remove':
                    const removeAgent = this.agents.find(a => a.id === message.agentId);
                    if (removeAgent) {
                        removeAgent.installed = false;
                        vscode.window.showInformationMessage(`🗑️ Removed ${removeAgent.name}`);
                        this.panel!.webview.html = this.getHtml();
                    }
                    break;
                case 'close':
                    this.panel?.dispose();
                    break;
            }
        });

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private getHtml(): string {
        const installedCount = this.agents.filter(a => a.installed).length;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIN Agent Marketplace</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
            background: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 1.5em; }
        .badge { background: var(--vscode-badge-background, #4d4d4d); color: var(--vscode-badge-foreground, #fff); padding: 4px 12px; border-radius: 12px; font-size: 0.85em; }
        .categories { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .cat-btn { padding: 6px 14px; background: var(--vscode-button-secondaryBackground, #3c3c3c); color: var(--vscode-button-secondaryForeground, #ccc); border: none; border-radius: 4px; cursor: pointer; }
        .cat-btn:hover, .cat-btn.active { background: var(--vscode-button-background, #0e639c); color: #fff; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .card { background: var(--vscode-editorWidget-background, #252526); border: 1px solid var(--vscode-panel-border, #3c3c3c); border-radius: 8px; padding: 16px; }
        .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .card-header .icon { font-size: 1.8em; }
        .card-header h3 { margin: 0; font-size: 1em; }
        .card-header .version { font-size: 0.75em; color: var(--vscode-descriptionForeground, #888); }
        .card .desc { font-size: 0.85em; color: var(--vscode-descriptionForeground, #888); margin-bottom: 10px; }
        .card .category { display: inline-block; font-size: 0.75em; padding: 2px 8px; border-radius: 4px; background: var(--vscode-badge-background, #4d4d4b); color: var(--vscode-badge-foreground, #fff); margin-bottom: 10px; }
        .card .actions { display: flex; gap: 8px; }
        .btn { flex: 1; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em; }
        .btn-install { background: var(--vscode-button-background, #0e639c); color: #fff; }
        .btn-remove { background: var(--vscode-errorForeground, #f44747); color: #fff; }
        .btn-installed { background: var(--vscode-button-secondaryBackground, #3c3c3c); color: #aaa; cursor: default; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 SIN Agent Marketplace</h1>
        <span class="badge">${installedCount} / ${this.agents.length} installed</span>
    </div>
    <div class="categories">
        ${[...new Set(this.agents.map(a => a.category))].map(cat => 
            `<button class="cat-btn" onclick="filter('${cat}')">${cat}</button>`
        ).join('')}
        <button class="cat-btn active" onclick="filter('all')">All</button>
    </div>
    <div class="grid" id="grid">
        ${this.agents.map(agent => `
            <div class="card" data-category="${agent.category}">
                <div class="card-header">
                    <span class="icon">${agent.icon}</span>
                    <div>
                        <h3>${agent.name}</h3>
                        <span class="version">v${agent.version}</span>
                    </div>
                </div>
                <span class="category">${agent.category}</span>
                <div class="desc">${agent.description}</div>
                <div class="actions">
                    ${agent.installed 
                        ? `<button class="btn btn-installed" disabled>✓ Installed</button>
                           <button class="btn btn-remove" onclick="remove('${agent.id}')">Remove</button>`
                        : `<button class="btn btn-install" onclick="install('${agent.id}')">Install</button>`
                    }
                </div>
            </div>
        `).join('')}
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function filter(cat) {
            document.querySelectorAll('.card').forEach(c => {
                c.style.display = (cat === 'all' || c.dataset.category === cat) ? '' : 'none';
            });
            document.querySelectorAll('.cat-btn').forEach(b => {
                b.classList.toggle('active', b.textContent.toLowerCase() === cat || (cat === 'all' && b.textContent === 'All'));
            });
        }
        function install(id) { vscode.postMessage({command: 'install', agentId: id}); }
        function remove(id) { vscode.postMessage({command: 'remove', agentId: id}); }
    </script>
</body>
</html>`;
    }

    public dispose() {
        this.panel?.dispose();
    }
}
