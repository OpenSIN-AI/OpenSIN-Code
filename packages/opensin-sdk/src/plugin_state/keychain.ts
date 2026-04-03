import { execSync } from "child_process";
import { KeychainBackend, PlatformType } from "./types.js";

function detectPlatform(): PlatformType {
  const platform = process.platform;
  if (platform === "darwin") return "darwin";
  if (platform === "linux") return "linux";
  if (platform === "win32") return "windows";
  return "linux";
}

class MacOSKeychain implements KeychainBackend {
  name = "macos-keychain";

  async set(key: string, value: string): Promise<boolean> {
    try {
      const service = "opensin-plugin-state";
      execSync(
        `security add-generic-password -a "${key}" -s "${service}" -w "${value}" -U`,
        { timeout: 5000, stdio: "pipe" }
      );
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const service = "opensin-plugin-state";
      const result = execSync(
        `security find-generic-password -a "${key}" -s "${service}" -w`,
        { timeout: 5000, encoding: "utf-8", stdio: "pipe" }
      );
      return result.trim();
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const service = "opensin-plugin-state";
      execSync(
        `security delete-generic-password -a "${key}" -s "${service}"`,
        { timeout: 5000, stdio: "pipe" }
      );
      return true;
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync("which security", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

class LinuxKeychain implements KeychainBackend {
  name = "libsecret";

  async set(key: string, value: string): Promise<boolean> {
    try {
      execSync(`secret-tool store --label="OpenSIN Plugin State" opensin-key "${key}"`, {
        input: value,
        timeout: 5000,
        stdio: "pipe",
      });
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return execSync(
        `secret-tool lookup opensin-key "${key}"`,
        { timeout: 5000, encoding: "utf-8", stdio: "pipe" }
      ).trim();
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      execSync(`secret-tool clear opensin-key "${key}"`, {
        timeout: 5000,
        stdio: "pipe",
      });
      return true;
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      execSync("which secret-tool", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

class WindowsKeychain implements KeychainBackend {
  name = "windows-credential-manager";

  async set(key: string, value: string): Promise<boolean> {
    try {
      const escaped = value.replace(/"/g, '\\"');
      execSync(
        `cmdkey /generic:OpenSIN_${key} /user:${key} /pass:"${escaped}"`,
        { timeout: 5000, stdio: "pipe" }
      );
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = execSync(
        `cmdkey /list:OpenSIN_${key}`,
        { timeout: 5000, encoding: "utf-8", stdio: "pipe" }
      );
      if (result.includes("OpenSIN_" + key)) {
        return "[stored]";
      }
      return null;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      execSync(`cmdkey /delete:OpenSIN_${key}`, {
        timeout: 5000,
        stdio: "pipe",
      });
      return true;
    } catch {
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

export class KeychainManager {
  private backend: KeychainBackend;

  constructor() {
    const platform = detectPlatform();
    const backends: Record<PlatformType, KeychainBackend> = {
      darwin: new MacOSKeychain(),
      linux: new LinuxKeychain(),
      windows: new WindowsKeychain(),
    };
    this.backend = backends[platform];
  }

  async set(key: string, value: string): Promise<boolean> {
    const available = await this.backend.isAvailable();
    if (!available) {
      return false;
    }
    return this.backend.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    const available = await this.backend.isAvailable();
    if (!available) {
      return null;
    }
    return this.backend.get(key);
  }

  async delete(key: string): Promise<boolean> {
    const available = await this.backend.isAvailable();
    if (!available) {
      return false;
    }
    return this.backend.delete(key);
  }

  getBackendName(): string {
    return this.backend.name;
  }

  async isAvailable(): Promise<boolean> {
    return this.backend.isAvailable();
  }
}

let _keychainManager: KeychainManager | null = null;

export function getKeychainManager(): KeychainManager {
  if (!_keychainManager) {
    _keychainManager = new KeychainManager();
  }
  return _keychainManager;
}

export function resetKeychainManager(): void {
  _keychainManager = null;
}
