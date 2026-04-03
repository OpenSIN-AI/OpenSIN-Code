import { spawn } from "child_process";
import { HookResult, HookConfig, HookExecutionContext } from "./types.js";

export class HookExecutor {
  async execute(
    hook: HookConfig,
    context: HookExecutionContext,
    defaultTimeout = 30000
  ): Promise<HookResult> {
    const timeout = hook.timeout ?? defaultTimeout;
    const cwd = hook.cwd ?? context.cwd;
    const env = this.buildEnv(hook, context);

    const command = hook.command;
    const args = hook.args ?? [];
    const fullCommand = [command, ...args].join(" ");

    const result: HookResult = {
      hookId: hook.id,
      event: hook.event,
      command: fullCommand,
      exitCode: -1,
      stdout: "",
      stderr: "",
      duration: 0,
      timedOut: false,
    };

    const startTime = Date.now();

    return new Promise((resolve) => {
      let timedOut = false;

      const proc = spawn(command, args, {
        cwd,
        env,
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      proc.stdout?.on("data", (chunk: Buffer) => {
        stdoutChunks.push(chunk);
      });

      proc.stderr?.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      const timeoutId = setTimeout(() => {
        timedOut = true;
        proc.kill("SIGTERM");
        setTimeout(() => {
          if (!proc.killed) {
            proc.kill("SIGKILL");
          }
        }, 2000);
      }, timeout);

      proc.on("error", (error) => {
        clearTimeout(timeoutId);
        result.duration = Date.now() - startTime;
        result.timedOut = timedOut;
        result.error = error.message;
        resolve(result);
      });

      proc.on("close", (code) => {
        clearTimeout(timeoutId);
        result.exitCode = code ?? -1;
        result.stdout = Buffer.concat(stdoutChunks).toString("utf-8");
        result.stderr = Buffer.concat(stderrChunks).toString("utf-8");
        result.duration = Date.now() - startTime;
        result.timedOut = timedOut;
        resolve(result);
      });
    });
  }

  private buildEnv(
    hook: HookConfig,
    context: HookExecutionContext
  ): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...process.env };

    env["OPENSIN_HOOK_EVENT"] = context.event;
    env["OPENSIN_HOOK_ID"] = hook.id;
    env["OPENSIN_HOOK_CWD"] = context.cwd;

    if (context.filePath) {
      env["OPENSIN_HOOK_FILE"] = context.filePath;
    }
    if (context.toolName) {
      env["OPENSIN_HOOK_TOOL"] = context.toolName;
    }

    if (hook.env) {
      Object.assign(env, hook.env);
    }

    Object.assign(env, context.env);

    return env;
  }
}