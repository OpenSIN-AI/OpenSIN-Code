import { execSync } from "child_process";
import { ClipboardBackend, PlatformType } from "./types.js";

function detectPlatform(): PlatformType {
  const platform = process.platform;
  if (platform === "darwin") return "darwin";
  if (platform === "linux") return "linux";
  if (platform === "win32") return "windows";
  return "linux";
}

class MacOSClipboard implements ClipboardBackend {
  name = "pbcopy";

  async write(text: string): Promise<boolean> {
    try {
      execSync("pbcopy", { input: text, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async read(): Promise<string> {
    try {
      return execSync("pbpaste", { encoding: "utf-8", timeout: 5000 }).trim();
    } catch {
      return "";
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync("which pbcopy", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

class LinuxClipboard implements ClipboardBackend {
  name = "xclip";

  async write(text: string): Promise<boolean> {
    try {
      execSync("xclip -selection clipboard", { input: text, timeout: 5000 });
      return true;
    } catch {
      try {
        execSync("xsel --clipboard --input", { input: text, timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  async read(): Promise<string> {
    try {
      return execSync("xclip -selection clipboard -o", {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();
    } catch {
      try {
        return execSync("xsel --clipboard --output", {
          encoding: "utf-8",
          timeout: 5000,
        }).trim();
      } catch {
        return "";
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync("which xclip", { stdio: "ignore" });
      return true;
    } catch {
      try {
        execSync("which xsel", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    }
  }
}

class WindowsClipboard implements ClipboardBackend {
  name = "clip";

  async write(text: string): Promise<boolean> {
    try {
      execSync("clip", { input: text, timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async read(): Promise<string> {
    try {
      return execSync("powershell Get-Clipboard", {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();
    } catch {
      return "";
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

export class ClipboardManager {
  private backend: ClipboardBackend | null = null;

  constructor() {
    this.backend = this.detectBackend();
  }

  private detectBackend(): ClipboardBackend | null {
    const platform = detectPlatform();
    const backends: Record<PlatformType, ClipboardBackend> = {
      darwin: new MacOSClipboard(),
      linux: new LinuxClipboard(),
      windows: new WindowsClipboard(),
    };
    return backends[platform];
  }

  async write(text: string, format?: string): Promise<boolean> {
    if (!this.backend) {
      return false;
    }
    const available = await this.backend.isAvailable();
    if (!available) {
      return false;
    }
    return this.backend.write(text);
  }

  async read(): Promise<string> {
    if (!this.backend) {
      return "";
    }
    return this.backend.read();
  }

  getBackendName(): string {
    return this.backend?.name ?? "none";
  }

  async isAvailable(): Promise<boolean> {
    if (!this.backend) {
      return false;
    }
    return this.backend.isAvailable();
  }
}

let _clipboardManager: ClipboardManager | null = null;

export function getClipboardManager(): ClipboardManager {
  if (!_clipboardManager) {
    _clipboardManager = new ClipboardManager();
  }
  return _clipboardManager;
}

export function resetClipboardManager(): void {
  _clipboardManager = null;
}
