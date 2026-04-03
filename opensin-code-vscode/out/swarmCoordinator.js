"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmCoordinator = exports.AVAILABLE_AGENTS = void 0;
const child_process_1 = require("child_process");
exports.AVAILABLE_AGENTS = [
    { id: 'explore', name: 'Explore', description: 'Codebase patterns, file structures, ast-grep', icon: '🔍' },
    { id: 'librarian', name: 'Librarian', description: 'Remote repos, official docs, GitHub examples', icon: '📚' },
    { id: 'oracle', name: 'Oracle', description: 'Conventional problems (architecture, debugging, complex logic)', icon: '🔮' },
    { id: 'artistry', name: 'Artistry', description: 'Non-conventional problems (different approach needed)', icon: '🎨' }
];
/**
 * Swarm Coordinator that dispatches tasks to oh-my-opencode agents.
 * Uses the opencode task() tool pattern via CLI.
 */
class SwarmCoordinator {
    activeTasks = new Map();
    /**
     * Dispatch a task to an agent
     */
    async dispatchTask(agentType, prompt) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task = {
            id: taskId,
            agent: agentType,
            prompt,
            status: 'running', result: ''
        };
        this.activeTasks.set(taskId, task);
        return new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)('opencode', [
                'run',
                `Task: ${prompt}\nAgent Type: ${agentType}\nExecute this task and return the result.`,
                '--format', 'json',
                '--agent', agentType
            ]);
            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.on('close', (code) => {
                if (code === 0) {
                    task.status = 'completed';
                    task.result = output;
                    resolve(output);
                }
                else {
                    task.status = 'failed';
                    reject(new Error(`Agent ${agentType} failed with code ${code}`));
                }
            });
            process.on('error', (err) => {
                task.status = 'failed';
                reject(err);
            });
        });
    }
    /**
     * Dispatch multiple tasks in parallel (swarm pattern)
     */
    async dispatchSwarm(tasks) {
        const promises = tasks.map(t => this.dispatchTask(t.agent, t.prompt));
        const results = await Promise.allSettled(promises);
        return Array.from(this.activeTasks.values()).filter(t => tasks.some(task => task.agent === t.agent));
    }
    /**
     * Get status of all active tasks
     */
    getActiveTasks() {
        return Array.from(this.activeTasks.values());
    }
    /**
     * Cancel a specific task
     */
    cancelTask(taskId) {
        this.activeTasks.delete(taskId);
    }
}
//# sourceMappingURL=swarmCoordinator.js.map
//# sourceMappingURL=swarmCoordinator.js.map