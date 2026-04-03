"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2AClient = exports.A2A_CLOUD_VMS = exports.A2A_CONFIG = void 0;
const vscode = require("vscode");
exports.A2A_CONFIG = {
    n8nHost: "http://92.5.60.87:5678",
    n8nWebhookPath: "/webhook/sin-hermes-dispatch",
    n8nCancelPath: "/webhook/sin-hermes-cancel",
    supabaseUrl: process.env.SUPABASE_URL || "https://yfgnqjxwqkqgkqjxwqkq.supabase.co",
    vmHealthCheckInterval: 30000,
};
exports.A2A_CLOUD_VMS = [
    { id: "sin-frontend", name: "A2A-SIN-Frontend", host: "https://a2a-sin-frontend.hf.space", type: "hf", status: "unknown", lastSeen: null, model: "antigravity-gemini-3.1-pro", capabilities: ["ui", "frontend", "design"] },
    { id: "sin-backend", name: "A2A-SIN-Backend", host: "https://a2a-sin-backend.hf.space", type: "hf", status: "unknown", lastSeen: null, model: "qwen3.6-plus-free", capabilities: ["api", "database", "server"] },
    { id: "sin-github-issues", name: "A2A-SIN-GitHub-Issues", host: "https://a2a-sin-github-issues.hf.space", type: "hf", status: "unknown", lastSeen: null, model: "qwen3.6-plus-free", capabilities: ["github", "issues", "pr"] },
    { id: "sin-vision", name: "A2A-SIN-Vision-Colab", host: "https://a2a-sin-vision.hf.space", type: "hf", status: "unknown", lastSeen: null, model: "gemini-3.1-pro", capabilities: ["vision", "screenshots", "video"] },
    { id: "oci-n8n", name: "SIN-Hermes (n8n Router)", host: "http://92.5.60.87:5678", type: "oci", status: "unknown", lastSeen: null, model: "orchestrator", capabilities: ["dispatch", "routing", "cron"] },
];
class A2AClient {
    sessionId;
    vmHealth;
    activeTasks;
    healthCheckInterval;
    outputChannel;
    constructor() {
        this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.vmHealth = new Map();
        this.activeTasks = new Map();
        this.healthCheckInterval = null;
        this.outputChannel = vscode.window.createOutputChannel('SIN A2A');
        exports.A2A_CLOUD_VMS.forEach(vm => this.vmHealth.set(vm.id, { ...vm }));
        this.startHealthCheck();
    }
    log(message) {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }
    // A2A Protocol: Dispatch task to cloud VM via n8n gateway
    async dispatchTask(agentId, prompt, context = {}) {
        const vm = exports.A2A_CLOUD_VMS.find(v => v.id === agentId);
        if (!vm) {
            throw new Error(`Unknown agent: ${agentId}`);
        }
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const activeEditor = vscode.window.activeTextEditor;
        let selectedCode = '';
        if (activeEditor && !activeEditor.selection.isEmpty) {
            selectedCode = activeEditor.document.getText(activeEditor.selection);
        }
        const task = {
            id: taskId, agentId, prompt, status: 'dispatched',
            startTime: Date.now(), vm: vm.host,
        };
        this.activeTasks.set(taskId, task);
        this.log(`Dispatching [${agentId}#${taskId}] → n8n gateway`);
        try {
            // Method 1: n8n Webhook Gateway (PRIMARY)
            const url = `${exports.A2A_CONFIG.n8nHost}${exports.A2A_CONFIG.n8nWebhookPath}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId, taskId, agentId, prompt,
                    context: {
                        workspace: workspaceRoot,
                        activeFile: activeEditor?.document.fileName || '',
                        selectedCode,
                        gitBranch: await this.getGitBranch(workspaceRoot),
                        timestamp: Date.now(),
                    },
                    a2aProtocol: {
                        version: '0.2.5',
                        capabilities: ['code', 'shell', 'browser', 'web'],
                        priority: 'normal',
                    },
                }),
            });
            if (!response.ok)
                throw new Error(`n8n returned ${response.status}`);
            const data = await response.json();
            task.status = 'running';
            task.taskUrl = data.executionUrl || url;
            this.activeTasks.set(taskId, task);
            this.log(`Task [${agentId}#${taskId}] running: ${task.taskUrl}`);
            return { taskId, status: 'running', url: task.taskUrl };
        }
        catch (n8nErr) {
            this.log(`n8n failed: ${n8nErr.message}, trying direct VM`);
            try {
                // Method 2: Direct VM
                const response = await fetch(`${vm.host}/api/v1/run`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, sessionId: this.sessionId, mode: 'agent' }),
                });
                if (!response.ok)
                    throw new Error(`VM returned ${response.status}`);
                const data = await response.json();
                task.status = 'completed';
                task.result = data.result || data.response;
                task.endTime = Date.now();
                this.activeTasks.set(taskId, task);
                this.log(`Task [${agentId}#${taskId}] completed via direct VM`);
                return { taskId, status: 'completed', result: task.result };
            }
            catch (vmErr) {
                this.log(`Direct VM failed: ${vmErr.message}, falling back to local`);
                task.status = 'local_fallback';
                this.activeTasks.set(taskId, task);
                return { taskId, status: 'local_fallback' };
            }
        }
    }
    // Check VM health for all cloud VMs
    async checkVMHealth() {
        for (const [id, vm] of this.vmHealth) {
            try {
                const url = `${vm.host}${vm.type === 'hf' ? '/health' : '/healthz'}`;
                const start = Date.now();
                const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) });
                vm.status = response.ok ? 'online' : 'degraded';
                vm.lastSeen = Date.now();
                this.log(`VM [${vm.name}] → ${vm.status} (${Date.now() - start}ms)`);
            }
            catch {
                if (vm.status !== 'offline') {
                    this.log(`VM [${vm.name}] → OFFLINE`);
                }
                vm.status = 'offline';
            }
            this.vmHealth.set(id, vm);
        }
        return this.vmHealth;
    }
    // Start periodic health check
    startHealthCheck() {
        if (this.healthCheckInterval)
            return;
        this.checkVMHealth();
        this.healthCheckInterval = setInterval(() => {
            this.checkVMHealth();
        }, exports.A2A_CONFIG.vmHealthCheckInterval);
    }
    // Get task status
    getTaskStatus(taskId) {
        return this.activeTasks.get(taskId) || null;
    }
    // Get all active tasks
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    // Cancel a task
    async cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = 'cancelled';
            task.endTime = Date.now();
            this.activeTasks.set(taskId, task);
            void fetch(`${exports.A2A_CONFIG.n8nHost}${exports.A2A_CONFIG.n8nCancelPath}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, sessionId: this.sessionId }),
            }).catch(() => { });
            this.log(`Task [${taskId}] cancelled`);
        }
    }
    // Get session info
    getSessionInfo() {
        const vms = Array.from(this.vmHealth.values());
        return {
            sessionId: this.sessionId,
            activeTasks: this.activeTasks.size,
            totalVMs: vms.length,
            onlineVMs: vms.filter(v => v.status === 'online').length,
            offlineVMs: vms.filter(v => v.status === 'offline').length,
        };
    }
    // Get VM list
    getCloudVMs() {
        return Array.from(this.vmHealth.values());
    }
    // Get git branch
    async getGitBranch(workspaceRoot) {
        try {
            const { spawn } = await Promise.resolve().then(() => require('child_process'));
            return new Promise((resolve) => {
                const p = spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: workspaceRoot });
                let out = '';
                p.stdout.on('data', d => out += d.toString());
                p.on('close', () => resolve(out.trim() || 'unknown'));
                p.on('error', () => resolve('unknown'));
            });
        }
        catch {
            return 'unknown';
        }
    }
    // Cleanup
    dispose() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.outputChannel.dispose();
    }
}
exports.A2AClient = A2AClient;
//# sourceMappingURL=a2aClient.js.map