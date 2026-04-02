import { spawn } from 'child_process';

export interface AgentType {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface SwarmTask {
    id: string;
    agent: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
}

export const AVAILABLE_AGENTS: AgentType[] = [
    { id: 'explore', name: 'Explore', description: 'Codebase patterns, file structures, ast-grep', icon: '🔍' },
    { id: 'librarian', name: 'Librarian', description: 'Remote repos, official docs, GitHub examples', icon: '📚' },
    { id: 'oracle', name: 'Oracle', description: 'Conventional problems (architecture, debugging, complex logic)', icon: '🔮' },
    { id: 'artistry', name: 'Artistry', description: 'Non-conventional problems (different approach needed)', icon: '🎨' }
];

/**
 * Swarm Coordinator that dispatches tasks to oh-my-opencode agents.
 * Uses the opencode task() tool pattern via CLI.
 */
export class SwarmCoordinator {
    private activeTasks: Map<string, SwarmTask> = new Map();

    /**
     * Dispatch a task to an agent
     */
    public async dispatchTask(agentType: string, prompt: string): Promise<string> {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const task: SwarmTask = {
            id: taskId,
            agent: agentType,
            prompt,
            status: 'running'
        };
        this.activeTasks.set(taskId, task);

        return new Promise((resolve, reject) => {
            const process = spawn('opencode', [
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
                } else {
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
    public async dispatchSwarm(tasks: { agent: string; prompt: string }[]): Promise<SwarmTask[]> {
        const promises = tasks.map(t => this.dispatchTask(t.agent, t.prompt));
        const results = await Promise.allSettled(promises);
        
        return Array.from(this.activeTasks.values()).filter(t => 
            tasks.some(task => task.agent === t.agent)
        );
    }

    /**
     * Get status of all active tasks
     */
    public getActiveTasks(): SwarmTask[] {
        return Array.from(this.activeTasks.values());
    }

    /**
     * Cancel a specific task
     */
    public cancelTask(taskId: string): void {
        this.activeTasks.delete(taskId);
    }
}
