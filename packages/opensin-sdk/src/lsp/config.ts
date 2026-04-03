/**
 * LSP Configuration for automatic language server setup.
 */

export interface LanguageServerConfig {
  command: string;
  args: string[];
  fileExtensions: string[];
  initializationOptions?: Record<string, unknown>;
}

const DEFAULT_SERVERS: Record<string, LanguageServerConfig> = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  python: {
    command: 'pyright-langserver',
    args: ['--stdio'],
    fileExtensions: ['.py'],
  },
  rust: {
    command: 'rust-analyzer',
    args: [],
    fileExtensions: ['.rs'],
  },
  go: {
    command: 'gopls',
    args: [],
    fileExtensions: ['.go'],
  },
};

export class LSPConfig {
  private servers: Map<string, LanguageServerConfig> = new Map();

  constructor() {
    for (const [lang, config] of Object.entries(DEFAULT_SERVERS)) {
      this.servers.set(lang, config);
    }
  }

  getServer(language: string): LanguageServerConfig | undefined {
    return this.servers.get(language);
  }

  registerServer(language: string, config: LanguageServerConfig): void {
    this.servers.set(language, config);
  }

  detectLanguage(filePath: string): string | undefined {
    const ext = filePath.substring(filePath.lastIndexOf('.'));
    for (const [lang, config] of this.servers) {
      if (config.fileExtensions.includes(ext)) {
        return lang;
      }
    }
    return undefined;
  }

  getAllLanguages(): string[] {
    return Array.from(this.servers.keys());
  }

  getConfigForFile(filePath: string): LanguageServerConfig | undefined {
    const lang = this.detectLanguage(filePath);
    if (!lang) return undefined;
    return this.servers.get(lang);
  }
}
