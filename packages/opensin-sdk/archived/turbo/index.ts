import type { CommandSafetyFilter as CommandSafetyFilterConfig, AuditEntry, CommandResult, TurboConfig } from "./models.js";

export type { AuditEntry, CommandResult, CommandSafetyFilter as CommandSafetyFilterConfig, TurboConfig } from "./models.js";

const DESTRUCTIVE_PATTERNS = [
  /^rm\s+-rf\s+\//,
  /^rm\s+--no-preserve-root/,
  /^>\s*\/dev\/sda/,
  /^dd\s+if=.*of=\/dev\//,
  /^mkfs/,
  /^format\s+[a-z]:/i,
  /^del\s+\/f\s+\/s\s+\/q\s+\\/,
];

const NETWORK_PATTERNS = [
  /^curl\s+.*\|\s*(bash|sh)/,
  /^wget\s+.*-O-\s*\|\s*(bash|sh)/,
  /^(bash|sh)\s+<\(/,
];

const SUDO_PATTERNS = [
  /^sudo\s+/,
];

function createDefaultFilter(): CommandSafetyFilterConfig {
  return {
    blockDestructive: true,
    blockNetwork: true,
    blockSudo: true,
    maxExecutionTimeMs: 30000,
    requireConfirmation: false,
  };
}

function createDefaultWhitelist(): string[] {
  return [
    "ls", "cat", "echo", "pwd", "whoami", "date", "uname",
    "git status", "git log", "git diff", "git branch",
    "npm install", "npm run", "npm test", "npm run build",
    "yarn install", "yarn run", "yarn test", "yarn build",
    "pnpm install", "pnpm run", "pnpm test", "pnpm build",
    "bun install", "bun run", "bun test", "bun build",
    "make", "cargo build", "cargo test",
    "python", "node", "typescript", "tsc",
  ];
}

function createDefaultBlacklist(): string[] {
  return [
    "rm -rf /",
    "rm --no-preserve-root",
    "mkfs",
    "dd if=",
    "sudo rm",
    "chmod 777 /",
    "chown -R /",
  ];
}

export class CommandSafetyFilterImpl {
  private config: CommandSafetyFilterConfig;

  constructor(config?: Partial<CommandSafetyFilterConfig>) {
    this.config = { ...createDefaultFilter(), ...config };
  }

  check(command: string, whitelist: string[], blacklist: string[]): { allowed: boolean; reason: string } {
    const trimmed = command.trim();

    for (const bl of blacklist) {
      if (trimmed.toLowerCase().includes(bl.toLowerCase())) {
        return { allowed: false, reason: `Command matches blacklisted pattern: ${bl}` };
      }
    }

    if (this.config.blockDestructive) {
      for (const pattern of DESTRUCTIVE_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { allowed: false, reason: "Command matches destructive pattern" };
        }
      }
    }

    if (this.config.blockNetwork) {
      for (const pattern of NETWORK_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { allowed: false, reason: "Command matches dangerous network pattern (pipe to shell)" };
        }
      }
    }

    if (this.config.blockSudo) {
      for (const pattern of SUDO_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { allowed: false, reason: "Sudo commands are blocked for safety" };
        }
      }
    }

    const isWhitelisted = whitelist.some(w => trimmed.toLowerCase().startsWith(w.toLowerCase()));
    if (!isWhitelisted && this.config.requireConfirmation) {
      return { allowed: false, reason: "Command not in whitelist and confirmation required" };
    }

    return { allowed: true, reason: "Command passed safety filter" };
  }

  updateConfig(updates: Partial<CommandSafetyFilterConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): CommandSafetyFilterConfig {
    return { ...this.config };
  }
}

export class AuditTrail {
  private entries: AuditEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
  }

  record(command: string, allowed: boolean, reason: string, executed = false): AuditEntry {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      command,
      timestamp: Date.now(),
      allowed,
      reason,
      executed,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    return entry;
  }

  complete(auditId: string, output: string, durationMs: number, exitCode = 0): AuditEntry | null {
    const entry = this.entries.find(e => e.id === auditId);
    if (!entry) return null;
    entry.executed = true;
    entry.output = output;
    entry.durationMs = durationMs;
    return entry;
  }

  getEntries(limit = 100): AuditEntry[] {
    return this.entries.slice(-limit);
  }

  getBlockedCommands(): AuditEntry[] {
    return this.entries.filter(e => !e.allowed);
  }

  getExecutedCommands(): AuditEntry[] {
    return this.entries.filter(e => e.executed);
  }

  clear(): void {
    this.entries = [];
  }

  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}

export class TurboMode {
  private config: TurboConfig;
  private safetyFilter: CommandSafetyFilterImpl;
  private auditTrail: AuditTrail;

  constructor() {
    this.safetyFilter = new CommandSafetyFilterImpl();
    this.auditTrail = new AuditTrail();
    this.config = {
      enabled: false,
      autoExecute: false,
      safetyFilter: this.safetyFilter.getConfig(),
      whitelist: createDefaultWhitelist(),
      blacklist: createDefaultBlacklist(),
      auditTrail: [],
    };
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  toggle(): boolean {
    this.config.enabled = !this.config.enabled;
    return this.config.enabled;
  }

  setAutoExecute(enabled: boolean): void {
    this.config.autoExecute = enabled;
  }

  isAutoExecute(): boolean {
    return this.config.enabled && this.config.autoExecute;
  }

  addToWhitelist(command: string): void {
    if (!this.config.whitelist.includes(command)) {
      this.config.whitelist.push(command);
    }
  }

  removeFromWhitelist(command: string): void {
    this.config.whitelist = this.config.whitelist.filter(c => c !== command);
  }

  addToBlacklist(command: string): void {
    if (!this.config.blacklist.includes(command)) {
      this.config.blacklist.push(command);
    }
  }

  removeFromBlacklist(command: string): void {
    this.config.blacklist = this.config.blacklist.filter(c => c !== command);
  }

  getWhitelist(): string[] {
    return [...this.config.whitelist];
  }

  getBlacklist(): string[] {
    return [...this.config.blacklist];
  }

  checkCommand(command: string): { allowed: boolean; reason: string } {
    if (!this.config.enabled) {
      return { allowed: true, reason: "Turbo mode is disabled, no checks applied" };
    }
    return this.safetyFilter.check(command, this.config.whitelist, this.config.blacklist);
  }

  async executeCommand(command: string, executor: (cmd: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>): Promise<CommandResult> {
    const check = this.checkCommand(command);
    const audit = this.auditTrail.record(command, check.allowed, check.reason);

    if (!check.allowed) {
      return {
        command,
        exitCode: 1,
        stdout: "",
        stderr: check.reason,
        durationMs: 0,
        auditId: audit.id,
      };
    }

    const start = Date.now();
    try {
      const result = await executor(command);
      const duration = Date.now() - start;
      this.auditTrail.complete(audit.id, result.stdout, duration, result.exitCode);
      return {
        command,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: duration,
        auditId: audit.id,
      };
    } catch (error) {
      const duration = Date.now() - start;
      const stderr = error instanceof Error ? error.message : String(error);
      this.auditTrail.complete(audit.id, "", duration, 1);
      return {
        command,
        exitCode: 1,
        stdout: "",
        stderr,
        durationMs: duration,
        auditId: audit.id,
      };
    }
  }

  getAuditTrail(limit = 100): AuditEntry[] {
    return this.auditTrail.getEntries(limit);
  }

  getBlockedCommands(): AuditEntry[] {
    return this.auditTrail.getBlockedCommands();
  }

  exportAuditTrail(): string {
    return this.auditTrail.export();
  }

  updateSafetyFilter(updates: Partial<CommandSafetyFilterConfig>): void {
    this.safetyFilter.updateConfig(updates);
    this.config.safetyFilter = this.safetyFilter.getConfig();
  }

  getConfig(): TurboConfig {
    return {
      ...this.config,
      safetyFilter: this.safetyFilter.getConfig(),
      auditTrail: this.auditTrail.getEntries(10),
    };
  }
}

export function turboMode(): TurboMode {
  return new TurboMode();
}

