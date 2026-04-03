import { execSync } from "child_process";
import { TerminalType, TerminalCapabilities, ProgressState } from "./types.js";

function detectTerminal(): TerminalType {
  if (process.env.TMUX) {
    return "tmux";
  }
  if (process.env.TERM_PROGRAM === "iTerm.app") {
    return "iterm2";
  }
  if (process.env.KITTY_WINDOW_ID) {
    return "kitty";
  }
  if (process.env.GHOSTTY_RESOURCES_DIR) {
    return "ghostty";
  }
  return "unknown";
}

function isInsideTmux(): boolean {
  try {
    execSync("tmux display-message -p '#{client_pid}'", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export class ITerm2Provider {
  getCapabilities(): TerminalCapabilities {
    return {
      terminal: "iterm2",
      supportsNotifications: true,
      supportsProgressBar: true,
      supportsTmuxPassthrough: false,
    };
  }

  sendNotification(title: string, message: string): void {
    const escaped = message
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    const titleEscaped = title
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    try {
      process.stdout.write(
        `\x1b]9;4;3;${titleEscaped}\x1b\\\x1b]9;9;"${escaped}"\x1b\\`
      );
    } catch {
      // iTerm2 escape sequence failed
    }
  }

  setProgress(progress: ProgressState): void {
    const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    try {
      process.stdout.write(`\x1b]9;4;1;${pct}\x1b\\`);
    } catch {
      // iTerm2 progress failed
    }
  }

  clearProgress(): void {
    try {
      process.stdout.write("\x1b]9;4;0\x1b\\");
    } catch {
      // iTerm2 clear failed
    }
  }
}

export class KittyProvider {
  getCapabilities(): TerminalCapabilities {
    return {
      terminal: "kitty",
      supportsNotifications: true,
      supportsProgressBar: true,
      supportsTmuxPassthrough: false,
    };
  }

  sendNotification(title: string, message: string): void {
    const body = `${title}\n${message}`;
    try {
      execSync(`kitty @ --to env:KITTY_LISTEN_ON send-text '${body.replace(/'/g, "'\\''")}'`, {
        stdio: "pipe",
        timeout: 2000,
      });
    } catch {
      try {
        process.stdout.write(`\x1b]9;4;3;${title}\x1b\\\x1b]9;9;"${message}"\x1b\\`);
      } catch {
        // Kitty escape failed
      }
    }
  }

  setProgress(progress: ProgressState): void {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    try {
      process.stdout.write(`\x1b]9;4;1;${pct}\x1b\\`);
    } catch {
      // Kitty progress failed
    }
  }

  clearProgress(): void {
    try {
      process.stdout.write("\x1b]9;4;0\x1b\\");
    } catch {
      // Kitty clear failed
    }
  }
}

export class GhosttyProvider {
  getCapabilities(): TerminalCapabilities {
    return {
      terminal: "ghostty",
      supportsNotifications: true,
      supportsProgressBar: false,
      supportsTmuxPassthrough: false,
    };
  }

  sendNotification(title: string, message: string): void {
    try {
      process.stdout.write(`\x1b]9;4;3;${title}\x1b\\\x1b]9;9;"${message}"\x1b\\`);
    } catch {
      // Ghostty escape failed
    }
  }

  setProgress(_progress: ProgressState): void {
    // Ghostty does not support progress bars
  }

  clearProgress(): void {
    // No-op for Ghostty
  }
}

export class TmuxProvider {
  private innerTerminal: TerminalType;

  constructor(innerTerminal: TerminalType) {
    this.innerTerminal = innerTerminal;
  }

  getCapabilities(): TerminalCapabilities {
    return {
      terminal: "tmux",
      supportsNotifications: true,
      supportsProgressBar: this.innerTerminal !== "ghostty",
      supportsTmuxPassthrough: true,
    };
  }

  sendNotification(title: string, message: string): void {
    const body = `${title}: ${message}`;
    try {
      execSync(`tmux display-message '${body.replace(/'/g, "'\\''")}'`, {
        stdio: "pipe",
        timeout: 2000,
      });
    } catch {
      // tmux display failed
    }
  }

  setProgress(progress: ProgressState): void {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
    const label = progress.message
      ? `${progress.message} [${pct}%]`
      : `${progress.title} [${pct}%]`;
    try {
      execSync(`tmux set-option status-left '${label.replace(/'/g, "'\\''")}'`, {
        stdio: "pipe",
        timeout: 2000,
      });
    } catch {
      // tmux status update failed
    }
  }

  clearProgress(): void {
    try {
      execSync("tmux set-option -u status-left", {
        stdio: "pipe",
        timeout: 2000,
      });
    } catch {
      // tmux status clear failed
    }
  }
}

export class UnknownProvider {
  getCapabilities(): TerminalCapabilities {
    return {
      terminal: "unknown",
      supportsNotifications: false,
      supportsProgressBar: false,
      supportsTmuxPassthrough: false,
    };
  }

  sendNotification(_title: string, _message: string): void {
    // No-op for unknown terminal
  }

  setProgress(_progress: ProgressState): void {
    // No-op for unknown terminal
  }

  clearProgress(): void {
    // No-op for unknown terminal
  }
}

export function detectTerminalType(): TerminalType {
  if (isInsideTmux()) {
    return "tmux";
  }
  return detectTerminal();
}

export function createProvider(terminal: TerminalType): {
  sendNotification(title: string, message: string): void;
  setProgress(progress: ProgressState): void;
  clearProgress(): void;
  getCapabilities(): TerminalCapabilities;
} {
  switch (terminal) {
    case "iterm2":
      return new ITerm2Provider();
    case "kitty":
      return new KittyProvider();
    case "ghostty":
      return new GhosttyProvider();
    case "tmux": {
      const inner = detectTerminal();
      return new TmuxProvider(inner === "tmux" ? "unknown" : inner);
    }
    default:
      return new UnknownProvider();
  }
}
