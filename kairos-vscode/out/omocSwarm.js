"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmOrchestrator = void 0;
const { spawn } = require('child_process');

const OMOC_SUBAGENTS = [
    { id: 'explore', name: 'Explore', desc: 'Codebase patterns, file structures', icon: '🔍' },
    { id: 'librarian', name: 'Librarian', desc: 'Remote repos, official docs, GitHub', icon: '📚' },
    { id: 'oracle', name: 'Oracle', desc: 'Architecture, debugging, complex logic', icon: '🔮' },
    { id: 'artistry', name: 'Artistry', desc: 'Non-conventional solutions', icon: '🎨' },
    { id: 'sisyphus', name: 'Sisyphus', desc: 'Persistent work execution', icon: '💪' },
    { id: 'sisyphus-junior', name: 'Sisyphus Jr', desc: 'Lightweight task execution', icon: '🏋️' },
    { id: 'prometheus', name: 'Prometheus', desc: 'Planning and orchestration', icon: '🔥' },
    { id: 'atlas', name: 'Atlas', desc: 'Infrastructure and devops', icon: '🌍' },
];

class SwarmOrchestrator {
    constructor() {
        this.activeSwarms = new Map();
        this.activeTasks = new Map();
        this.taskIdCounter = 0;
    }

    nextTaskId() {
        this.taskIdCounter++;
        return `task_swarm_${Date.now()}_${this.taskIdCounter}`;
    }

    executeMode(mode, prompt, context, options, onChunk) {
        return new Promise((resolve, reject) => {
            const taskId = this.nextTaskId();
            this.activeTasks.set(taskId, { mode, prompt, status: 'running', startTime: Date.now() });

            let fullResult = '';

            const modeHandler = () => {
                switch (mode) {
                    case 'solo': return this.runSolo(taskId, prompt, context, options, onChunk, resolve, reject);
                    case 'swarm': return this.runSwarm(taskId, prompt, context, options, onChunk, resolve, reject);
                    case 'trio': return this.runTrio(taskId, prompt, context, options, onChunk, resolve, reject);
                    case 'cloud': return this.runCloud(taskId, prompt, context, options, onChunk, resolve, reject);
                    default: reject(new Error(`Unknown mode: ${mode}`));
                }
            };

            modeHandler().catch(reject);
        });
    }

    runSolo(taskId, prompt, context, options, onChunk, resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const agent = options.agentId || 'build';
            onChunk(`\`🎯 SOLO MODE\` → Agent: **${agent}**\n\n`);
            try {
                let output = '';
                yield this.runOpencode(prompt, agent, (chunk) => {
                    output += chunk;
                    onChunk(chunk);
                });
                onChunk('\n\n\`✅ SOLO COMPLETE\`\n');
                this.activeTasks.set(taskId, { status: 'completed', result: output });
                resolve({ mode: 'solo', status: 'completed', result: output });
            } catch (e) {
                onChunk(`\n\n\`❌ SOLO FAILED: ${e.message}\``);
                reject(e);
            }
        });
    }

    runSwarm(taskId, prompt, context, options, onChunk, resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            onChunk(`\`🐝 SWARM MODE\` → OMOC-Swarm starting...\n\n`);

            // Default swarm composition from omoc-swarm.ts
            const swarmMembers = [
                { name: 'planner', agent: 'plan', label: '📋 Planner' },
                { name: 'researcher', agent: 'explore', label: '🔍 Researcher' },
                { name: 'coder', agent: 'build', label: '💻 Coder' },
                { name: 'reviewer', agent: 'general', label: '🔎 Reviewer' }
            ];

            onChunk(`Creating swarm with ${swarmMembers.length} members:\n`);
            swarmMembers.forEach(m => onChunk(`- ${m.label} (${m.agent})\n`));
            onChunk('\n');

            const results = [];
            const allTasks = swarmMembers.map(member =>
                __awaiter(this, void 0, void 0, function* () {
                    const memberPrompt = `You are the '${member.name}' in an OMOC swarm. Your role is ${member.agent}. Task:\n\n${prompt}`;
                    onChunk(`\n▶️ Dispatching to **${member.label}**...\n`);
                    let output = '';
                    try {
                        yield this.runOpencode(memberPrompt, member.agent, (chunk) => {
                            output += chunk;
                        });
                        results.push({ name: member.name, label: member.label, status: 'success', output });
                        onChunk(`✅ **${member.label}** completed\n\n`);
                    } catch (e) {
                        results.push({ name: member.name, label: member.label, status: 'failed', error: e.message });
                        onChunk(`❌ **${member.label}** failed: ${e.message}\n\n`);
                    }
                })
            );

            // Run all swarm members in parallel
            yield Promise.all(allTasks);

            // Combine results
            let summary = `\`🐝 SWARM REPORT\`\n${'_'.repeat(50)}\n\n`;
            results.forEach(r => {
                summary += `### ${r.label}\n`;
                summary += `${r.output.slice(0, 500)}${r.output.length > 500 ? '...\n' : '\n'}\n`;
            });

            onChunk(summary);
            this.activeSwarms.set(taskId, { members: results, createdAt: Date.now() });
            this.activeTasks.set(taskId, { status: 'completed', results });
            resolve({ mode: 'swarm', status: 'completed', results });
        });
    }

    runTrio(taskId, prompt, context, options, onChunk, resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainAgent = options.agentId || 'build';
            onChunk(`\`🔱 TRIO MODE\` → Main: **${mainAgent}** + 3 Subagents\n\n`);

            // Select up to 3 OMOC subagents
            const trioAgents = options.subagents || OMOC_SUBAGENTS.slice(0, 3);

            let allResults = [];

            // Main agent runs first
            onChunk(`**Main Agent (${mainAgent}):**\n\n`);
            try {
                let mainOutput = '';
                yield this.runOpencode(prompt, mainAgent, (chunk) => {
                    mainOutput += chunk;
                    onChunk(chunk);
                });
                allResults.push({ name: mainAgent, type: 'main', status: 'success', output: mainOutput });
            } catch (e) {
                allResults.push({ name: mainAgent, type: 'main', status: 'failed', error: e.message });
                onChunk(`\n⚠️ Main agent failed: ${e.message}\n`);
            }

            // Now run 3 subagents in PARALLEL
            onChunk(`\n\n🔱 **Subagents (parallel):**\n`);
            trioAgents.forEach(a => onChunk(`- ${a.icon} ${a.name}: ${a.desc}\n`));
            onChunk('\n');

            const subagentTasks = trioAgents.map(agent =>
                __awaiter(this, void 0, void 0, function* () {
                    const agentPrompt = `You are OMOC '${agent.name}' working alongside other agents. Task:\n\n${prompt}`;
                    onChunk(`▶️ Dispatching to **${agent.icon} ${agent.name}**...\n`);
                    let output = '';
                    try {
                        yield this.runOpencode(agentPrompt, agent.id, (chunk) => {
                            output += chunk;
                        });
                        allResults.push({ name: agent.name, agent: agent.id, status: 'success', output });
                        onChunk(`✅ **${agent.icon} ${agent.name}** completed\n\n`);
                    } catch (e) {
                        allResults.push({ name: agent.name, agent: agent.id, status: 'failed', error: e.message });
                        onChunk(`❌ **${agent.icon} ${agent.name}** failed: ${e.message}\n\n`);
                    }
                })
            );

            yield Promise.all(subagentTasks);

            // Summary
            let summary = `\`🔱 TRIO COMPLETE\`\n\n`;
            summary += `**Results:** ${allResults.filter(r => r.status === 'success').length}/${allResults.length} successful\n\n`;
            onChunk(summary);
            this.activeTasks.set(taskId, { status: 'completed', results: allResults });
            resolve({ mode: 'trio', status: 'completed', results: allResults });
        });
    }

    runCloud(taskId, prompt, context, options, onChunk, resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            onChunk(`\`☁️ CLOUD FLEET MODE\` → SIN-Zeus orchestriert die gesamte A2A Flotte\n\n`);

            const a2aClient = options.a2aClient;
            if (!a2aClient) {
                onChunk(`\`⚠️ Fall back to Swarm mode - no A2A client available\``);
                return this.runSwarm(taskId, prompt, context, options, onChunk, resolve, reject);
            }

            const allVMs = a2aClient.getCloudVMs ? a2aClient.getCloudVMs() : [];
            const onlineVMs = allVMs.filter(vm => vm.status === 'online');

            if (onlineVMs.length === 0) {
                onChunk(`\`⚠️ No cloud VMs available. Falling back to Swarm Mode...\``);
                return this.runSwarm(taskId, prompt, context, options, onChunk, resolve, reject);
            }

            onChunk(`Dispatching to **${onlineVMs.length}** cloud agents:\n`);
            onlineVMs.forEach(vm => onChunk(`- 🤖 **${vm.name}** (${vm.model || vm.id})\n`));
            onChunk('\n');

            const results = [];
            const cloudTasks = onlineVMs.map(vm =>
                __awaiter(this, void 0, void 0, function* () {
                    onChunk(`▶️ Dispatching to **${vm.name}**...\n`);
                    try {
                        const result = yield a2aClient.dispatchTask(vm.id, prompt, context);
                        results.push({ agent: vm.name, status: result.status, url: result.url, result: result.result });
                        if (result.status === 'running') {
                            onChunk(`✅ **${vm.name}** running: ${result.url || ''}\n\n`);
                        } else if (result.status === 'completed') {
                            onChunk(`✅ **${vm.name}** completed\n\n`);
                        }
                    } catch (e) {
                        results.push({ agent: vm.name, status: 'failed', error: e.message });
                        onChunk(`❌ **${vm.name}** failed: ${e.message}\n\n`);
                    }
                })
            );

            yield Promise.all(cloudTasks);

            let summary = `\`☁️ CLOUD FLEET REPORT\`\n${'_'.repeat(50)}\n\n`;
            summary += `**Total:** ${results.length} | **Running:** ${results.filter(r => r.status === 'running').length} | **Completed:** ${results.filter(r => r.status === 'completed').length} | **Failed:** ${results.filter(r => r.status === 'failed').length}\n\n`;
            results.forEach(r => {
                const icon = r.status === 'running' ? '🔄' : r.status === 'completed' ? '✅' : '❌';
                summary += `${icon} **${r.agent}: ${r.status}**\n`;
                if (r.url) summary += `  URL: ${r.url}\n`;
                if (r.result && r.result.length > 0) summary += `  Result: ${r.result.slice(0, 200)}...\n`;
                summary += '\n';
            });

            onChunk(summary);
            this.activeTasks.set(taskId, { mode: 'cloud', status: 'dispatched', results });
            resolve({ mode: 'cloud', status: 'dispatched', results });
        });
    }

    runOpencode(prompt, agent, onChunk) {
        return new Promise((resolve, reject) => {
            const p = spawn('opencode', ['run', prompt, '--format', 'json']);
            let output = '';
            p.stdout.on('data', d => {
                const lines = d.toString().split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.type === 'text' && parsed.part && parsed.part.text) {
                            output += parsed.part.text;
                            onChunk(parsed.part.text);
                        }
                    } catch (e) {}
                }
            });
            p.stderr.on('data', d => onChunk('[stderr] ' + d.toString()));
            p.on('close', code => {
                if (code === 0) resolve(output);
                else reject(new Error('Process exited with code ' + code));
            });
            p.on('error', reject);
        });
    }

    getAvailableSubagents() {
        return OMOC_SUBAGENTS;
    }

    getActiveTasks() {
        return Array.from(this.activeTasks.entries()).map(([id, task]) => ({ id, ...task }));
    }

    getActiveSwarms() {
        return Array.from(this.activeSwarms.entries()).map(([id, swarm]) => ({ id, ...swarm }));
    }

    cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (task) {
            task.status = 'cancelled';
            this.activeTasks.set(taskId, task);
        }
    }
}
exports.SwarmOrchestrator = SwarmOrchestrator;
