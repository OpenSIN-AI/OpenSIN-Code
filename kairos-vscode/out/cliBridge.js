"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SinCodeBridge = void 0;
const child_process_1 = require("child_process");
class SinCodeBridge {
    activeProcess = null;
    /**
     * Calls the opencode/sin-code CLI using the mandatory format.
     * Priority -2.5 Rule: ALWAYS use opencode run <prompt> --format json
     */
    async call(prompt, mode, onData) {
        // Cancel any running process
        this.cancel();
        return new Promise((resolve, reject) => {
            const modeFlag = mode !== 'code' ? `--mode=${mode}` : '';
            const args = ['run', prompt, '--format', 'json'];
            if (modeFlag)
                args.push(modeFlag);
            const process = (0, child_process_1.spawn)('opencode', args);
            this.activeProcess = process;
            process.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.type === 'text' && parsed.part?.text) {
                            onData(parsed.part.text);
                        }
                    }
                    catch (e) {
                        // Ignore non-JSON lines
                    }
                }
            });
            process.stderr.on('data', (data) => {
                onData(`[stderr] ${data.toString()}`);
            });
            process.on('close', (code) => {
                this.activeProcess = null;
                if (code !== 0) {
                    reject(new Error(`sin-code CLI exited with code ${code}`));
                }
                else {
                    resolve();
                }
            });
            process.on('error', (err) => {
                this.activeProcess = null;
                reject(err);
            });
        });
    }
    cancel() {
        if (this.activeProcess) {
            this.activeProcess.kill('SIGTERM');
            this.activeProcess = null;
        }
    }
    /**
     * Fetch available models from the opencode config
     */
    async getAvailableModels() {
        return new Promise((resolve, reject) => {
            const process = (0, child_process_1.spawn)('opencode', ['config', 'list-models', '--format', 'json']);
            let output = '';
            process.stdout.on('data', (data) => output += data.toString());
            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        const models = JSON.parse(output);
                        resolve(Array.isArray(models) ? models : []);
                    }
                    catch {
                        resolve(['opencode/qwen3.6-plus-free', 'google/antigravity-gemini-3.1-pro', 'google/antigravity-claude-sonnet-4-6']);
                    }
                }
                else {
                    resolve(['opencode/qwen3.6-plus-free', 'google/antigravity-gemini-3.1-pro']);
                }
            });
            process.on('error', () => resolve(['opencode/qwen3.6-plus-free']));
        });
    }
}
exports.SinCodeBridge = SinCodeBridge;
//# sourceMappingURL=cliBridge.js.map